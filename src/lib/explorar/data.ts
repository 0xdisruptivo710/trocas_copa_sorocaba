import { createClient } from "@/lib/supabase/server";
import type { ExploreQuery } from "./filters";

export interface Match {
  other_user: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  city: string | null;
  state: string | null;
  distance_km: number;
  i_can_give: number;
  i_can_get: number;
  match_score: number;
}

export type FindMatchesResult =
  | { kind: "ok"; matches: Match[] }
  | { kind: "no_location" }
  | { kind: "not_authenticated" }
  | { kind: "error"; message: string };

export async function findMatches(query: ExploreQuery): Promise<FindMatchesResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("trocas_find_matches", {
    p_radius_km: query.radius,
    p_limit: 50,
    p_search: query.q || null,
    p_state: query.state,
  });

  if (error) {
    if (error.code === "42501") return { kind: "not_authenticated" };
    if (error.message?.includes("set your location")) return { kind: "no_location" };
    return { kind: "error", message: error.message };
  }
  return { kind: "ok", matches: (data ?? []) as Match[] };
}

export interface TradePreview {
  i_give: { code: string; team_code: string; number: number; team_name: string }[];
  i_get: { code: string; team_code: string; number: number; team_name: string }[];
}

export async function getTradePreview(otherUserId: string): Promise<TradePreview> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { i_give: [], i_get: [] };

  const [myDupes, otherDupes] = await Promise.all([
    supabase
      .from("trocas_user_stickers")
      .select("sticker_code")
      .eq("user_id", user.id)
      .gte("owned_count", 2),
    supabase
      .from("trocas_user_stickers")
      .select("sticker_code")
      .eq("user_id", otherUserId)
      .gte("owned_count", 2),
  ]);

  if (myDupes.error) throw myDupes.error;
  if (otherDupes.error) throw otherDupes.error;

  const myDupeCodes = (myDupes.data ?? []).map((r) => r.sticker_code);
  const otherDupeCodes = (otherDupes.data ?? []).map((r) => r.sticker_code);

  const [otherOwned, myOwned] = await Promise.all([
    myDupeCodes.length
      ? supabase
          .from("trocas_user_stickers")
          .select("sticker_code")
          .eq("user_id", otherUserId)
          .in("sticker_code", myDupeCodes)
          .gte("owned_count", 1)
      : Promise.resolve({ data: [] as { sticker_code: string }[], error: null }),
    otherDupeCodes.length
      ? supabase
          .from("trocas_user_stickers")
          .select("sticker_code")
          .eq("user_id", user.id)
          .in("sticker_code", otherDupeCodes)
          .gte("owned_count", 1)
      : Promise.resolve({ data: [] as { sticker_code: string }[], error: null }),
  ]);

  if (otherOwned.error) throw otherOwned.error;
  if (myOwned.error) throw myOwned.error;

  const otherOwnsSet = new Set((otherOwned.data ?? []).map((r) => r.sticker_code));
  const meOwnSet = new Set((myOwned.data ?? []).map((r) => r.sticker_code));

  const iGiveCodes = myDupeCodes.filter((c) => !otherOwnsSet.has(c));
  const iGetCodes = otherDupeCodes.filter((c) => !meOwnSet.has(c));

  const allCodes = [...iGiveCodes, ...iGetCodes];
  if (allCodes.length === 0) return { i_give: [], i_get: [] };

  const { data: stickers, error: stErr } = await supabase
    .from("trocas_stickers")
    .select("code, team_code, number, trocas_teams!inner(name_pt)")
    .in("code", allCodes);
  if (stErr) throw stErr;

  type StickerJoinRow = {
    code: string;
    team_code: string;
    number: number;
    trocas_teams: { name_pt: string } | null;
  };
  const stickerMap = new Map<string, StickerJoinRow>(
    ((stickers ?? []) as unknown as StickerJoinRow[]).map((s) => [s.code, s]),
  );

  const expand = (codes: string[]) =>
    codes
      .map((c) => stickerMap.get(c))
      .filter((s): s is StickerJoinRow => Boolean(s))
      .map((s) => ({
        code: s.code,
        team_code: s.team_code,
        number: s.number,
        team_name: s.trocas_teams?.name_pt ?? s.team_code,
      }));

  return { i_give: expand(iGiveCodes), i_get: expand(iGetCodes) };
}

export async function getPublicProfileByUsername(username: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trocas_public_profiles")
    .select("id, username, full_name, avatar_url, bio, city, state, created_at")
    .eq("username", username.toLowerCase())
    .maybeSingle();
  if (error) throw error;
  return data;
}
