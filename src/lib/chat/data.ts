import { createClient } from "@/lib/supabase/server";

export interface ChatListItem {
  chat_id: string;
  other_id: string;
  other_username: string;
  other_full_name: string;
  other_avatar_url: string | null;
  last_message: string | null;
  last_message_at: string;
  unread_count: number;
  last_sender_was_me: boolean;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

export interface ChatThread {
  chat_id: string;
  me_id: string;
  other_id: string;
  other_username: string;
  other_full_name: string;
  other_avatar_url: string | null;
  messages: ChatMessage[];
}

export async function listChats(userId: string): Promise<ChatListItem[]> {
  const supabase = await createClient();

  const { data: chats, error } = await supabase
    .from("trocas_chats")
    .select("id, user_a, user_b, last_message_at")
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .order("last_message_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  const chatRows = chats ?? [];
  if (chatRows.length === 0) return [];

  const otherIds = chatRows.map((c) => (c.user_a === userId ? c.user_b : c.user_a));
  const { data: profiles, error: pErr } = await supabase
    .from("trocas_public_profiles")
    .select("id, username, full_name, avatar_url")
    .in("id", otherIds);
  if (pErr) throw pErr;

  const profMap = new Map((profiles ?? []).map((p) => [p.id, p] as const));

  const chatIds = chatRows.map((c) => c.id);
  const { data: allMsgs, error: mErr } = await supabase
    .from("trocas_messages")
    .select("chat_id, sender_id, body, created_at, read_at")
    .in("chat_id", chatIds)
    .order("created_at", { ascending: false });
  if (mErr) throw mErr;

  const byChat = new Map<
    string,
    { last: { body: string; sender_id: string; created_at: string } | null; unread: number }
  >();
  for (const c of chatRows) byChat.set(c.id, { last: null, unread: 0 });
  for (const m of allMsgs ?? []) {
    const entry = byChat.get(m.chat_id);
    if (!entry) continue;
    if (entry.last === null) {
      entry.last = { body: m.body, sender_id: m.sender_id, created_at: m.created_at };
    }
    if (m.read_at === null && m.sender_id !== userId) {
      entry.unread += 1;
    }
  }

  return chatRows.map((c) => {
    const otherId = c.user_a === userId ? c.user_b : c.user_a;
    const prof = profMap.get(otherId);
    const agg = byChat.get(c.id);
    return {
      chat_id: c.id,
      other_id: otherId,
      other_username: prof?.username ?? "?",
      other_full_name: prof?.full_name ?? "Colecionador",
      other_avatar_url: prof?.avatar_url ?? null,
      last_message: agg?.last?.body ?? null,
      last_message_at: c.last_message_at,
      unread_count: agg?.unread ?? 0,
      last_sender_was_me: agg?.last?.sender_id === userId,
    };
  });
}

export async function getChatThread(
  userId: string,
  chatId: string,
): Promise<ChatThread | null> {
  const supabase = await createClient();

  const { data: chat, error: cErr } = await supabase
    .from("trocas_chats")
    .select("id, user_a, user_b")
    .eq("id", chatId)
    .maybeSingle();
  if (cErr) throw cErr;
  if (!chat) return null;
  if (chat.user_a !== userId && chat.user_b !== userId) return null;

  const otherId = chat.user_a === userId ? chat.user_b : chat.user_a;

  const [profileRes, messagesRes] = await Promise.all([
    supabase
      .from("trocas_public_profiles")
      .select("id, username, full_name, avatar_url")
      .eq("id", otherId)
      .maybeSingle(),
    supabase
      .from("trocas_messages")
      .select("id, chat_id, sender_id, body, created_at, read_at")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true })
      .limit(200),
  ]);
  if (profileRes.error) throw profileRes.error;
  if (messagesRes.error) throw messagesRes.error;

  return {
    chat_id: chat.id,
    me_id: userId,
    other_id: otherId,
    other_username: profileRes.data?.username ?? "?",
    other_full_name: profileRes.data?.full_name ?? "Colecionador",
    other_avatar_url: profileRes.data?.avatar_url ?? null,
    messages: messagesRes.data ?? [],
  };
}
