import { GROUP_LABELS, type GroupLabel } from "./teams";

export type StatusFilter = "todas" | "faltando" | "tenho" | "repetidas" | "prioridade";

export interface AlbumQuery {
  status: StatusFilter;
  group: GroupLabel | "all";
  q: string;
  page: number;
}

const STATUS_VALUES = ["todas", "faltando", "tenho", "repetidas", "prioridade"] as const;

export const PAGE_SIZE = 60;

export function parseAlbumQuery(params: URLSearchParams): AlbumQuery {
  const statusRaw = params.get("status") ?? "todas";
  const status: StatusFilter = (STATUS_VALUES as readonly string[]).includes(statusRaw)
    ? (statusRaw as StatusFilter)
    : "todas";

  const groupRaw = params.get("group") ?? "all";
  const group: AlbumQuery["group"] =
    groupRaw === "all" || (GROUP_LABELS as readonly string[]).includes(groupRaw)
      ? (groupRaw as AlbumQuery["group"])
      : "all";

  const q = (params.get("q") ?? "").trim().slice(0, 50);

  const pageRaw = Number(params.get("page") ?? "1");
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;

  return { status, group, q, page };
}

export function buildAlbumUrl(base: string, query: Partial<AlbumQuery>): string {
  const params = new URLSearchParams();
  if (query.status && query.status !== "todas") params.set("status", query.status);
  if (query.group && query.group !== "all") params.set("group", query.group);
  if (query.q) params.set("q", query.q);
  if (query.page && query.page > 1) params.set("page", String(query.page));
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}
