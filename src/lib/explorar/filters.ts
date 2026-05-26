export const RADIUS_OPTIONS = [3, 5, 10, 25, 50] as const;
export type Radius = (typeof RADIUS_OPTIONS)[number];

export type ExploreMode = "matches" | "todos";
export type ExploreView = "lista" | "mapa";

export interface ExploreQuery {
  radius: Radius;
  state: string | null; // sempre SP por enquanto; mantido pra compat
  q: string;
  mode: ExploreMode;
  view: ExploreView;
}

const STATIC_STATE = "SP";

export function parseExploreQuery(params: URLSearchParams): ExploreQuery {
  const rRaw = Number(params.get("r") ?? "25");
  const radius: Radius = (RADIUS_OPTIONS as readonly number[]).includes(rRaw)
    ? (rRaw as Radius)
    : 25;

  const q = (params.get("q") ?? "").trim().slice(0, 50);

  const modeRaw = params.get("aba") ?? "matches";
  const mode: ExploreMode = modeRaw === "todos" ? "todos" : "matches";

  const viewRaw = params.get("vista") ?? "lista";
  const view: ExploreView = viewRaw === "mapa" ? "mapa" : "lista";

  return { radius, state: STATIC_STATE, q, mode, view };
}

export function buildExploreUrl(base: string, query: Partial<ExploreQuery>): string {
  const params = new URLSearchParams();
  if (query.radius && query.radius !== 25) params.set("r", String(query.radius));
  if (query.q) params.set("q", query.q);
  if (query.mode && query.mode !== "matches") params.set("aba", query.mode);
  if (query.view && query.view !== "lista") params.set("vista", query.view);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}
