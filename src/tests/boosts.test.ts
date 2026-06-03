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
});

describe.skipIf(HAS_SERVICE)("trocas_boosts (skipped — sem service role key)", () => {
  it("requer SUPABASE_SERVICE_ROLE_KEY em .env.local", () => {
    expect(HAS_SERVICE).toBe(false);
  });
});
