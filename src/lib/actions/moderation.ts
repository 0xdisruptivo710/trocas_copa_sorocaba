"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { error?: string };

export type ReportReason =
  | "spam"
  | "assedio"
  | "fraude_troca"
  | "conteudo_improprio"
  | "perfil_falso"
  | "menor_de_idade"
  | "outro";

export async function blockUserAction(otherUserId: string): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };
  if (user.id === otherUserId) return { error: "Não dá pra bloquear você mesmo." };

  const { error } = await supabase.rpc("trocas_block_user", {
    p_other: otherUserId,
  });
  if (error) return { error: error.message };

  revalidatePath("/chat");
  revalidatePath("/explorar");
  revalidatePath("/conta/privacidade");
  return {};
}

export async function unblockUserAction(otherUserId: string): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase.rpc("trocas_unblock_user", {
    p_other: otherUserId,
  });
  if (error) return { error: error.message };

  revalidatePath("/conta/privacidade");
  revalidatePath("/explorar");
  revalidatePath("/chat");
  return {};
}

export async function reportUserAction(
  otherUserId: string,
  reason: ReportReason,
  details: string | null,
  chatId: string | null,
): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };
  if (user.id === otherUserId) return { error: "Não dá pra reportar você mesmo." };

  const trimmedDetails = details?.trim() ?? "";
  if (trimmedDetails.length > 1000) {
    return { error: "Descrição muito longa (máx 1000 caracteres)." };
  }

  const { error } = await supabase.rpc("trocas_report_user", {
    p_other: otherUserId,
    p_reason: reason,
    p_details: trimmedDetails.length > 0 ? trimmedDetails : null,
    p_chat_id: chatId,
  });
  if (error) return { error: error.message };

  return {};
}
