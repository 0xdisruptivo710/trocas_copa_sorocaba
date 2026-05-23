"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createSbjsClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { env } from "@/lib/env";
import {
  createPixCharge,
  PREMIUM_PRICE_CENTS,
  PREMIUM_DISCOUNT_CENTS,
} from "@/lib/abacate/client";

type CreateResult =
  | { ok: true; chargeId: string; brCode: string; brCodeBase64: string; amount: number }
  | { ok: false; error: string };

function admin() {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }
  return createSbjsClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

export async function createPremiumChargeAction(
  referralCode?: string | null,
): Promise<CreateResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado." };

  const { data: profile } = await supabase
    .from("trocas_profiles")
    .select("username, full_name, is_premium")
    .eq("id", user.id)
    .single();
  if (!profile) return { ok: false, error: "Perfil não encontrado." };
  if (profile.is_premium) return { ok: false, error: "Você já é Premium." };

  // Resolve cupom — referralCode = username de outro usuário que indicou.
  const trimmedCode = (referralCode ?? "").trim().toLowerCase();
  let resolvedReferral: string | null = null;
  let amount = PREMIUM_PRICE_CENTS;

  if (trimmedCode.length > 0) {
    if (!/^[a-z0-9_]{3,30}$/.test(trimmedCode)) {
      return { ok: false, error: "Cupom inválido." };
    }
    if (trimmedCode === profile.username) {
      return { ok: false, error: "Não dá pra usar seu próprio cupom." };
    }
    const { data: referrer } = await supabase
      .from("trocas_public_profiles")
      .select("id, username")
      .eq("username", trimmedCode)
      .maybeSingle();
    if (!referrer) return { ok: false, error: "Cupom não encontrado." };
    resolvedReferral = referrer.username;
    amount = PREMIUM_PRICE_CENTS - PREMIUM_DISCOUNT_CENTS;
  }

  let charge;
  try {
    charge = await createPixCharge({
      amount,
      description: "TrocasCopa Premium — pagamento único",
      expiresIn: 3600,
      customer: {
        name: profile.full_name,
        email: user.email,
      },
      metadata: {
        user_id: user.id,
        product: "premium",
        referral_code: resolvedReferral ?? "",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro desconhecido";
    return { ok: false, error: `Falha ao criar PIX: ${msg}` };
  }

  // Salva a charge no DB via service-role (RLS impede insert direto).
  const sb = admin();
  const { error: insErr } = await sb.from("trocas_billing").insert({
    user_id: user.id,
    abacate_charge_id: charge.id,
    product: "premium",
    amount_cents: amount,
    status: "PENDING",
    br_code: charge.brCode,
    br_code_base64: charge.brCodeBase64,
    referral_code: resolvedReferral,
    expires_at: charge.expiresAt,
    metadata: { devMode: charge.devMode },
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

export async function checkChargeStatus(chargeId: string): Promise<{
  status: "PENDING" | "PAID" | "CANCELLED" | "EXPIRED" | "REFUNDED";
}> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "PENDING" };

  const { data } = await supabase
    .from("trocas_billing")
    .select("status")
    .eq("abacate_charge_id", chargeId)
    .eq("user_id", user.id)
    .maybeSingle();

  return { status: (data?.status ?? "PENDING") as "PENDING" | "PAID" | "CANCELLED" | "EXPIRED" | "REFUNDED" };
}

/**
 * Aplica pagamento confirmado: marca billing como PAID, seta is_premium,
 * paga R$ 5 PIX ao referrer (TODO: integração saque AbacatePay; por ora só
 * registra a referência no campo metadata pra histórico).
 */
export async function markChargePaid(chargeId: string): Promise<void> {
  const sb = admin();

  const { data: charge, error } = await sb
    .from("trocas_billing")
    .select("id, user_id, status, referral_code, product")
    .eq("abacate_charge_id", chargeId)
    .maybeSingle();
  if (error) throw error;
  if (!charge) return;
  if (charge.status === "PAID") return; // idempotente

  await sb
    .from("trocas_billing")
    .update({ status: "PAID", paid_at: new Date().toISOString() })
    .eq("id", charge.id);

  if (charge.product === "premium") {
    await sb.from("trocas_profiles").update({ is_premium: true }).eq("id", charge.user_id);
  }

  revalidatePath("/conta", "layout");
  revalidatePath("/", "layout");
}
