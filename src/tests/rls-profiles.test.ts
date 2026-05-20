/**
 * Smoke test for trocas_profiles RLS.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local (pegue no Dashboard →
 * Settings → API → service_role).
 *
 * Reads `.env.local` directly to avoid depending on Next.js' loader.
 */

import { readFileSync } from "node:fs";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

function loadEnv() {
  const path = ".env.local";
  try {
    const content = readFileSync(path, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/i);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {
    // ignore — falls back to process.env
  }
}
loadEnv();

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const HAS_SERVICE = SERVICE.length > 0;

describe.skipIf(!HAS_SERVICE)("trocas_profiles RLS", () => {
  let admin: SupabaseClient<Database>;
  let userA: { id: string; email: string };
  let userB: { id: string; email: string };

  const rand = () => Math.random().toString(36).slice(2, 10);

  beforeAll(async () => {
    admin = createClient<Database>(URL, SERVICE, {
      auth: { persistSession: false },
    });

    const a = await admin.auth.admin.createUser({
      email: `a-${rand()}@trocas-test.local`,
      password: "pwd12345",
      email_confirm: true,
    });
    const b = await admin.auth.admin.createUser({
      email: `b-${rand()}@trocas-test.local`,
      password: "pwd12345",
      email_confirm: true,
    });
    if (a.error || b.error) throw a.error ?? b.error;
    userA = { id: a.data.user!.id, email: a.data.user!.email! };
    userB = { id: b.data.user!.id, email: b.data.user!.email! };
  });

  afterAll(async () => {
    if (userA?.id) await admin.auth.admin.deleteUser(userA.id);
    if (userB?.id) await admin.auth.admin.deleteUser(userB.id);
  });

  it("trigger trocas_handle_new_user populates trocas_profiles", async () => {
    const { data, error } = await admin
      .from("trocas_profiles")
      .select("id, username")
      .in("id", [userA.id, userB.id]);
    expect(error).toBeNull();
    expect(data).toHaveLength(2);
  });

  it("user A cannot UPDATE user B's profile (RLS blocks)", async () => {
    const clientA = createClient<Database>(URL, ANON, {
      auth: { persistSession: false },
    });
    await clientA.auth.signInWithPassword({ email: userA.email, password: "pwd12345" });

    await clientA
      .from("trocas_profiles")
      .update({ full_name: "hacked" })
      .eq("id", userB.id);

    const { data: bAfter } = await admin
      .from("trocas_profiles")
      .select("full_name")
      .eq("id", userB.id)
      .single();
    expect(bAfter?.full_name).not.toBe("hacked");
  });

  it("any authenticated user can SELECT profiles (public read)", async () => {
    const clientA = createClient<Database>(URL, ANON, {
      auth: { persistSession: false },
    });
    await clientA.auth.signInWithPassword({ email: userA.email, password: "pwd12345" });

    const { data, error } = await clientA
      .from("trocas_profiles")
      .select("username")
      .eq("id", userB.id)
      .single();
    expect(error).toBeNull();
    expect(data?.username).toBeTruthy();
  });
});

describe.skipIf(HAS_SERVICE)("RLS test (skipped — missing service role key)", () => {
  it("requires SUPABASE_SERVICE_ROLE_KEY in .env.local", () => {
    expect(HAS_SERVICE).toBe(false);
  });
});
