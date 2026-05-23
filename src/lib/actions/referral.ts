"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { error?: string; referralId?: string };

export async function registerReferralAction(
  referrerUsername: string,
  source: "coupon" | "signup_link" = "signup_link",
): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const cleaned = referrerUsername.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,30}$/.test(cleaned)) return { error: "Username inválido." };

  const { data, error } = await supabase.rpc("trocas_register_referral", {
    p_referrer_username: cleaned,
    p_source: source,
  });
  if (error) {
    if (error.code === "P0003") return { error: "Não dá pra usar seu próprio cupom." };
    if (error.code === "P0002") return { error: "Cupom não encontrado." };
    return { error: error.message };
  }
  revalidatePath("/", "layout");
  return { referralId: data as string };
}

/**
 * Chamado após o user salvar localização ou marcar 1º cromo — confirma se o
 * referral pode ser marcado como efetivado.
 */
export async function checkReferralEffectiveAction(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.rpc("trocas_check_referral_effective", {});
}

export interface ReferralStats {
  total: number;
  effective: number;
  rewarded: number;
  myUsername: string;
}

export async function getMyReferralStats(): Promise<ReferralStats | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("trocas_referral_stats")
    .select("username, total_referrals, effective_referrals, rewarded_referrals")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) return null;
  return {
    myUsername: data.username,
    total: data.total_referrals,
    effective: data.effective_referrals,
    rewarded: data.rewarded_referrals,
  };
}
