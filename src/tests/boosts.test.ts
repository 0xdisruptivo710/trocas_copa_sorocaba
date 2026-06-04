import { readFileSync } from "node:fs";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

function loadEnv() {
  try {
    for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/i);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {
    /* ignore */
  }
}
loadEnv();

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const HAS_SERVICE = SERVICE.length > 0;
const rand = () => Math.random().toString(36).slice(2, 10);

describe.skipIf(!HAS_SERVICE)("trocas_boosts", () => {
  let admin: SupabaseClient<Database>;
  let user: { id: string; email: string };

  beforeAll(async () => {
    admin = createClient<Database>(URL, SERVICE, { auth: { persistSession: false } });
    const u = await admin.auth.admin.createUser({
      email: `boost-${rand()}@trocas-test.local`,
      password: "pwd12345",
      email_confirm: true,
    });
    if (u.error) throw u.error;
    user = { id: u.data.user!.id, email: u.data.user!.email! };
  });

  afterAll(async () => {
    if (user?.id) await admin.auth.admin.deleteUser(user.id);
  });

  it("trocas_grant_boost concede 7 dias e empilha em compra repetida", async () => {
    const g1 = await admin.rpc("trocas_grant_boost", {
      p_user_id: user.id,
      p_kind: "destaque",
      p_days: 7,
      p_charge_id: "ch_1",
    });
    expect(g1.error).toBeNull();

    const { data: b1 } = await admin
      .from("trocas_boosts")
      .select("expires_at")
      .eq("user_id", user.id)
      .eq("kind", "destaque")
      .single();
    const exp1 = new Date(b1!.expires_at).getTime();
    expect(exp1).toBeGreaterThan(Date.now() + 6 * 864e5); // ~7 dias

    await admin.rpc("trocas_grant_boost", {
      p_user_id: user.id,
      p_kind: "destaque",
      p_days: 7,
      p_charge_id: "ch_2",
    });
    const { data: b2 } = await admin
      .from("trocas_boosts")
      .select("expires_at, charge_id")
      .eq("user_id", user.id)
      .eq("kind", "destaque")
      .single();
    expect(new Date(b2!.expires_at).getTime()).toBeGreaterThan(exp1 + 6 * 864e5); // empilhou
    expect(b2!.charge_id).toBe("ch_2");
  });

  it("RLS: usuário só lê o próprio boost; não insere direto", async () => {
    const client = createClient<Database>(URL, ANON, { auth: { persistSession: false } });
    await client.auth.signInWithPassword({ email: user.email, password: "pwd12345" });

    const ownRead = await client.from("trocas_boosts").select("kind").eq("user_id", user.id);
    expect(ownRead.error).toBeNull();

    const ins = await client.from("trocas_boosts").insert({
      user_id: user.id,
      kind: "destaque",
      expires_at: new Date(Date.now() + 864e5).toISOString(),
    });
    expect(ins.error).not.toBeNull();
  });

  it("trocas_find_matches põe o destacado no topo entre matches equivalentes", async () => {
    const { data: sts } = await admin.from("trocas_stickers").select("code").limit(2);
    const [s1, s2] = (sts ?? []).map((r) => r.code);
    expect(Boolean(s1 && s2)).toBe(true);

    const mk = async () => {
      const u = await admin.auth.admin.createUser({
        email: `m-${rand()}@trocas-test.local`,
        password: "pwd12345",
        email_confirm: true,
      });
      return u.data.user!.id;
    };
    const viewer = await mk();
    const candA = await mk();
    const candB = await mk();
    const cleanup = [viewer, candA, candB];

    try {
      // viewer: tem s1 repetida (dá), não tem s2 (recebe)
      await admin
        .from("trocas_user_stickers")
        .insert([{ user_id: viewer, sticker_code: s1, owned_count: 2 }]);
      // candA e candB: faltam s1 (recebem do viewer) e têm s2 repetida (dão pro viewer)
      for (const c of [candA, candB]) {
        await admin
          .from("trocas_user_stickers")
          .insert([{ user_id: c, sticker_code: s2, owned_count: 2 }]);
      }
      // boost só no candB
      await admin.rpc("trocas_grant_boost", {
        p_user_id: candB,
        p_kind: "destaque",
        p_days: 7,
        p_charge_id: "ch_rank",
      });

      // chama como viewer (precisa estar autenticado p/ auth.uid())
      const client = createClient<Database>(URL, ANON, { auth: { persistSession: false } });
      const vEmail = (await admin.auth.admin.getUserById(viewer)).data.user!.email!;
      await client.auth.signInWithPassword({ email: vEmail, password: "pwd12345" });

      const { data: matches, error } = await client.rpc("trocas_find_matches", {
        p_radius_km: 100000,
        p_limit: 50,
        p_search: null,
        p_state: null,
        p_only_with_matches: true,
      });
      expect(error).toBeNull();
      const ids = (matches ?? []).map((m) => m.other_user);
      const ia = ids.indexOf(candA);
      const ib = ids.indexOf(candB);
      expect(ib).toBeGreaterThanOrEqual(0); // candB aparece
      expect(ib).toBeLessThan(ia === -1 ? Number.MAX_SAFE_INTEGER : ia); // destacado antes
      expect((matches ?? []).find((m) => m.other_user === candB)?.is_boosted).toBe(true);
    } finally {
      for (const id of cleanup) await admin.auth.admin.deleteUser(id);
    }
  });
});

describe.skipIf(HAS_SERVICE)("trocas_boosts (skipped — sem service role key)", () => {
  it("requer SUPABASE_SERVICE_ROLE_KEY em .env.local", () => {
    expect(HAS_SERVICE).toBe(false);
  });
});
