import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { StickerCode, PickerScope } from "./sticker-codes";

export type { StickerCode, PickerScope };

/**
 * Fetch cromos do user filtrados por escopo, ordenados. Server-only.
 */
export async function getUserStickersForPicker(
  userId: string,
  scope: PickerScope,
): Promise<StickerCode[]> {
  const supabase = await createClient();

  if (scope === "missing") {
    const [allRes, ownedRes] = await Promise.all([
      supabase
        .from("trocas_stickers")
        .select("code, team_code, number, trocas_teams!inner(name_pt, display_order)")
        .order("display_order", { foreignTable: "trocas_teams", ascending: true })
        .order("number", { ascending: true }),
      supabase
        .from("trocas_user_stickers")
        .select("sticker_code, owned_count")
        .eq("user_id", userId)
        .gte("owned_count", 1),
    ]);
    if (allRes.error) throw allRes.error;
    if (ownedRes.error) throw ownedRes.error;

    const ownedSet = new Set((ownedRes.data ?? []).map((r) => r.sticker_code));
    type Row = {
      code: string;
      team_code: string;
      number: number;
      trocas_teams: { name_pt: string } | null;
    };
    return ((allRes.data ?? []) as unknown as Row[])
      .filter((r) => !ownedSet.has(r.code))
      .map((r) => ({
        code: r.code,
        team_code: r.team_code,
        number: r.number,
        team_name: r.trocas_teams?.name_pt ?? r.team_code,
      }));
  }

  let q = supabase
    .from("trocas_user_stickers")
    .select(
      "sticker_code, owned_count, is_priority, trocas_stickers!inner(code, team_code, number, trocas_teams!inner(name_pt, display_order))",
    )
    .eq("user_id", userId);

  if (scope === "owned") q = q.gte("owned_count", 1);
  if (scope === "duplicates") q = q.gte("owned_count", 2);
  if (scope === "priority") q = q.eq("is_priority", true);

  const { data, error } = await q
    .order("display_order", { foreignTable: "trocas_stickers.trocas_teams", ascending: true })
    .order("number", { foreignTable: "trocas_stickers", ascending: true });
  if (error) throw error;

  type Row = {
    trocas_stickers: {
      code: string;
      team_code: string;
      number: number;
      trocas_teams: { name_pt: string } | null;
    };
  };
  return ((data ?? []) as unknown as Row[]).map((r) => ({
    code: r.trocas_stickers.code,
    team_code: r.trocas_stickers.team_code,
    number: r.trocas_stickers.number,
    team_name: r.trocas_stickers.trocas_teams?.name_pt ?? r.trocas_stickers.team_code,
  }));
}
