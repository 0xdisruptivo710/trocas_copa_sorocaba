"use server";

import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createSbjsClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { env } from "@/lib/env";
import { createPixCharge, BOOST_DESTAQUE_CENTS } from "@/lib/abacate/client";

type CreateResult =
  | { ok: true; chargeId: string; brCode: string; brCodeBase64: string; amount: number }
  | { ok: false; error: string };

function admin() {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return createSbjsClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

export async function createBoostChargeAction(
  kind: "destaque" = "destaque",
): Promise<CreateResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado." };

  const amount = BOOST_DESTAQUE_CENTS;

  let charge;
  try {
    charge = await createPixCharge({
      amount,
      description: "TrocasCopa — Destaque no Explorar (7 dias)",
      expiresIn: 3600,
      metadata: { user_id: user.id, product: "boost_destaque", kind },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro desconhecido";
    return { ok: false, error: `Falha ao criar PIX: ${msg}` };
  }

  const sb = admin();
  const { error: insErr } = await sb.from("trocas_billing").insert({
    user_id: user.id,
    abacate_charge_id: charge.id,
    product: "boost_destaque",
    amount_cents: amount,
    status: "PENDING",
    br_code: charge.brCode,
    br_code_base64: charge.brCodeBase64,
    expires_at: charge.expiresAt,
    metadata: { devMode: charge.devMode, kind },
  });
  if (insErr) return { ok: false, error: insErr.message };

  return {
    ok: true,
    chargeId: charge.id,
    brCode: charge.brCode,
    brCodeBase64: charge.brCodeBase64,
    amount,
  };
}

export interface MyBoost {
  kind: "destaque";
  expires_at: string;
}

export async function getMyBoost(): Promise<MyBoost | null> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("trocas_boosts")
    .select("kind, expires_at")
    .eq("user_id", user.id)
    .eq("kind", "destaque")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  return (data as MyBoost | null) ?? null;
}
