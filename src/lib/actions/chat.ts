"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUserStickersForPicker } from "@/lib/chat/stickers";
import type { PickerScope, StickerCode } from "@/lib/chat/sticker-codes";

export async function loadMyStickersAction(
  scope: PickerScope,
): Promise<{ stickers: StickerCode[]; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { stickers: [], error: "Não autenticado." };
  try {
    const stickers = await getUserStickersForPicker(user.id, scope);
    return { stickers };
  } catch (e) {
    return { stickers: [], error: e instanceof Error ? e.message : "Erro" };
  }
}

type Result = { error?: string };

export async function openChatAction(otherUserId: string): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };
  if (user.id === otherUserId) return { error: "Não dá pra conversar consigo." };

  const { data, error } = await supabase.rpc("trocas_open_chat", {
    other_user: otherUserId,
  });
  if (error) return { error: error.message };
  if (!data) return { error: "Falha ao abrir chat." };

  redirect(`/chat/${data}`);
}

export async function sendMessageAction(
  chatId: string,
  body: string,
): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const trimmed = body.trim();
  if (trimmed.length === 0) return { error: "Mensagem vazia." };
  if (trimmed.length > 2000) return { error: "Mensagem muito longa." };

  const { error } = await supabase.from("trocas_messages").insert({
    chat_id: chatId,
    sender_id: user.id,
    body: trimmed,
  });
  if (error) return { error: error.message };

  revalidatePath(`/chat/${chatId}`);
  revalidatePath("/chat");
  return {};
}

async function requirePremium(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("trocas_profiles")
    .select("is_premium")
    .eq("id", userId)
    .single();
  if (!data?.is_premium) {
    return "Recurso Premium. Visita /conta/premium pra ativar.";
  }
  return null;
}

export async function sendStickerCardAction(
  chatId: string,
  codes: string[],
): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const premiumErr = await requirePremium(user.id);
  if (premiumErr) return { error: premiumErr };

  if (codes.length === 0 || codes.length > 30) {
    return { error: "Selecione de 1 a 30 cromos." };
  }

  const { error } = await supabase.from("trocas_messages").insert({
    chat_id: chatId,
    sender_id: user.id,
    body: "",
    kind: "sticker_card",
    metadata: { codes },
  });
  if (error) return { error: error.message };

  revalidatePath(`/chat/${chatId}`);
  return {};
}

export async function sendProposalAction(
  chatId: string,
  give: string[],
  receive: string[],
): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const premiumErr = await requirePremium(user.id);
  if (premiumErr) return { error: premiumErr };

  if (give.length === 0 && receive.length === 0) {
    return { error: "Adiciona ao menos 1 cromo." };
  }
  if (give.length > 30 || receive.length > 30) {
    return { error: "Máximo 30 cromos de cada lado." };
  }

  const { error } = await supabase.from("trocas_messages").insert({
    chat_id: chatId,
    sender_id: user.id,
    body: "",
    kind: "proposal",
    metadata: { give, receive, status: "pending" },
  });
  if (error) return { error: error.message };

  revalidatePath(`/chat/${chatId}`);
  return {};
}

export async function respondProposalAction(
  proposalMsgId: string,
  response: "accepted" | "rejected" | "cancelled",
): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase.rpc("trocas_respond_to_proposal", {
    p_proposal_msg_id: proposalMsgId,
    p_response: response,
  });
  if (error) return { error: error.message };

  // Best-effort revalidate — page revalida via Realtime tb
  revalidatePath("/chat", "layout");
  return {};
}

export async function markReadAction(chatId: string): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase
    .from("trocas_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("chat_id", chatId)
    .neq("sender_id", user.id)
    .is("read_at", null);
  if (error) return { error: error.message };

  revalidatePath("/chat");
  return {};
}
