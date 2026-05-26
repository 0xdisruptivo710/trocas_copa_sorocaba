import { createClient } from "@/lib/supabase/server";

export type NotificationKind =
  | "message"
  | "proposal_new"
  | "proposal_reply"
  | "trade_completed";

export interface NotificationItem {
  id: string;
  kind: NotificationKind;
  chat_id: string | null;
  actor_id: string | null;
  actor_username: string | null;
  actor_full_name: string | null;
  actor_avatar_url: string | null;
  payload: { preview?: string; message_id?: string } & Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

const LIMIT = 20;

export async function listMyNotifications(): Promise<NotificationItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: rows, error } = await supabase
    .from("trocas_notifications")
    .select("id, kind, chat_id, actor_id, payload, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(LIMIT);
  if (error) throw error;

  const items = (rows ?? []) as Array<{
    id: string;
    kind: NotificationKind;
    chat_id: string | null;
    actor_id: string | null;
    payload: NotificationItem["payload"];
    read_at: string | null;
    created_at: string;
  }>;

  const actorIds = Array.from(
    new Set(items.map((r) => r.actor_id).filter((v): v is string => Boolean(v))),
  );

  const actorMap = new Map<
    string,
    { username: string; full_name: string; avatar_url: string | null }
  >();
  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("trocas_public_profiles")
      .select("id, username, full_name, avatar_url")
      .in("id", actorIds);
    for (const p of profiles ?? []) {
      actorMap.set(p.id, {
        username: p.username,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
      });
    }
  }

  return items.map((r) => {
    const actor = r.actor_id ? actorMap.get(r.actor_id) : undefined;
    return {
      ...r,
      actor_username: actor?.username ?? null,
      actor_full_name: actor?.full_name ?? null,
      actor_avatar_url: actor?.avatar_url ?? null,
    };
  });
}

export async function countUnreadNotifications(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from("trocas_notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);
  if (error) return 0;
  return count ?? 0;
}
