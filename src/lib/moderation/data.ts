import { createClient } from "@/lib/supabase/server";

export interface BlockedUser {
  blocked_id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  city: string | null;
  state: string | null;
  created_at: string;
}

export async function listMyBlocks(): Promise<BlockedUser[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trocas_my_blocks")
    .select("blocked_id, username, full_name, avatar_url, city, state, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as BlockedUser[];
}

export async function isBlockedByMe(otherUserId: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from("trocas_blocks")
    .select("blocked_id")
    .eq("blocker_id", user.id)
    .eq("blocked_id", otherUserId)
    .maybeSingle();
  if (error) return false;
  return data !== null;
}
