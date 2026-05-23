"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { error?: string; tradeId?: string; status?: string };

/**
 * Inicializa registro de troca a partir de uma proposta aceita.
 * Chamado quando user clica "Marcar como entregue" pela 1ª vez.
 */
export async function initTradeAction(proposalMsgId: string): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { data, error } = await supabase.rpc("trocas_init_trade", {
    p_proposal_msg_id: proposalMsgId,
  });
  if (error) return { error: error.message };
  return { tradeId: data as string };
}

/**
 * Confirma do seu lado. Se o outro também confirmou, aplica a troca
 * (atualiza coleções dos dois).
 */
export async function confirmTradeAction(tradeId: string): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { data, error } = await supabase.rpc("trocas_confirm_trade", {
    p_trade_id: tradeId,
  });
  if (error) return { error: error.message };

  const result = data as { status?: string };
  revalidatePath("/album");
  revalidatePath("/", "layout");
  revalidatePath("/chat", "layout");
  return { status: result?.status, tradeId };
}

export async function rateTradeAction(
  tradeId: string,
  ratedUserId: string,
  score: 1 | -1,
  comment?: string | null,
): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase.from("trocas_trade_ratings").insert({
    trade_id: tradeId,
    rater_id: user.id,
    rated_id: ratedUserId,
    score,
    comment: comment?.slice(0, 280) || null,
  });
  if (error) {
    if (error.code === "23505") return { error: "Você já avaliou essa troca." };
    return { error: error.message };
  }
  revalidatePath("/chat", "layout");
  return {};
}
