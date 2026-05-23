"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
