import { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE, type AlbumQuery } from "./filters";

export interface StickerRow {
  code: string;
  team_code: string;
  team_name: string;
  team_kind: "team" | "fwc" | "special";
  team_group: string | null;
  number: number;
  owned_count: number;
  is_priority: boolean;
}

export interface AlbumPage {
  stickers: StickerRow[];
  total: number;
  totalPages: number;
}

export interface Panorama {
  total: number;
  owned: number;
  duplicates: number;
  missing: number;
  priority: number;
  percent: number;
}

function groupLetter(group: AlbumQuery["group"]): string | null {
  if (typeof group === "string" && group.startsWith("Grupo ")) {
    return group.replace("Grupo ", "");
  }
  return null;
}

type CatalogJoinRow = {
  code: string;
  team_code: string;
  number: number;
  trocas_teams:
    | { name_pt: string; kind: string; group_letter: string | null; display_order: number }
    | null;
};

export async function getAlbumPage(userId: string, query: AlbumQuery): Promise<AlbumPage> {
  const supabase = await createClient();

  let catalogQuery = supabase
    .from("trocas_stickers")
    .select(
      `
      code,
      team_code,
      number,
      trocas_teams!inner (
        name_pt,
        kind,
        group_letter,
        display_order
      )
    `,
      { count: "exact" },
    )
    .order("display_order", { foreignTable: "trocas_teams", ascending: true })
    .order("number", { ascending: true });

  // Group filter
  if (query.group === "FWC") {
    catalogQuery = catalogQuery.eq("team_code", "FWC");
  } else if (query.group === "Coca-Cola") {
    catalogQuery = catalogQuery.eq("team_code", "CC");
  } else {
    const letter = groupLetter(query.group);
    if (letter) {
      catalogQuery = catalogQuery.eq("trocas_teams.group_letter", letter);
    }
  }

  // Search filter — match team code, sticker code, or number
  if (query.q) {
    const qUpper = query.q.toUpperCase();
    const qLower = query.q.toLowerCase();
    const asNumber = Number(query.q);

    const orExpr: string[] = [
      `team_code.eq.${qUpper}`,
      `code.ilike.%${qLower}%`,
    ];
    if (Number.isFinite(asNumber) && asNumber >= 0 && asNumber <= 20) {
      orExpr.push(`number.eq.${asNumber}`);
    }
    catalogQuery = catalogQuery.or(orExpr.join(","));
  }

  const needsMemoryFilter = query.status !== "todas";

  if (!needsMemoryFilter) {
    const from = (query.page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    catalogQuery = catalogQuery.range(from, to);
  }

  const { data: catalog, error: catErr, count: catalogCount } = await catalogQuery;
  if (catErr) throw catErr;
  const catalogRows = (catalog ?? []) as unknown as CatalogJoinRow[];

  const codes = catalogRows.map((r) => r.code);
  const { data: ownerships, error: ownErr } = codes.length
    ? await supabase
        .from("trocas_user_stickers")
        .select("sticker_code, owned_count, is_priority")
        .eq("user_id", userId)
        .in("sticker_code", codes)
    : { data: [], error: null };
  if (ownErr) throw ownErr;
  const ownMap = new Map(
    (ownerships ?? []).map((o) => [o.sticker_code, o] as const),
  );

  let merged: StickerRow[] = catalogRows.map((row) => {
    const own = ownMap.get(row.code);
    return {
      code: row.code,
      team_code: row.team_code,
      team_name: row.trocas_teams?.name_pt ?? row.team_code,
      team_kind: (row.trocas_teams?.kind ?? "team") as StickerRow["team_kind"],
      team_group: row.trocas_teams?.group_letter ?? null,
      number: row.number,
      owned_count: own?.owned_count ?? 0,
      is_priority: own?.is_priority ?? false,
    };
  });

  if (needsMemoryFilter) {
    merged = merged.filter((s) => {
      switch (query.status) {
        case "faltando":
          return s.owned_count === 0;
        case "tenho":
          return s.owned_count >= 1;
        case "repetidas":
          return s.owned_count >= 2;
        case "prioridade":
          return s.is_priority;
        default:
          return true;
      }
    });

    const total = merged.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const from = (query.page - 1) * PAGE_SIZE;
    return {
      stickers: merged.slice(from, from + PAGE_SIZE),
      total,
      totalPages,
    };
  }

  const total = catalogCount ?? merged.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return { stickers: merged, total, totalPages };
}

export async function getPanorama(userId: string): Promise<Panorama> {
  const supabase = await createClient();
  const total = 994;

  const { data, error } = await supabase
    .from("trocas_user_stickers")
    .select("owned_count, is_priority")
    .eq("user_id", userId);
  if (error) throw error;

  const rows = data ?? [];
  const owned = rows.filter((r) => r.owned_count >= 1).length;
  const duplicates = rows.reduce(
    (sum, r) => sum + Math.max(0, r.owned_count - 1),
    0,
  );
  const priority = rows.filter((r) => r.is_priority).length;
  const missing = total - owned;
  const percent = total > 0 ? Math.round((owned / total) * 1000) / 10 : 0;

  return { total, owned, duplicates, missing, priority, percent };
}
