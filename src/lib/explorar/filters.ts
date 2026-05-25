export const RADIUS_OPTIONS = [3, 5, 10, 25, 50] as const;
export type Radius = (typeof RADIUS_OPTIONS)[number];

export interface ExploreQuery {
  radius: Radius;
  state: string | null; // sempre SP por enquanto; mantido pra compat
  q: string;
}

const STATIC_STATE = "SP";

export function parseExploreQuery(params: URLSearchParams): ExploreQuery {
  const rRaw = Number(params.get("r") ?? "25");
  const radius: Radius = (RADIUS_OPTIONS as readonly number[]).includes(rRaw)
    ? (rRaw as Radius)
    : 25;

  const q = (params.get("q") ?? "").trim().slice(0, 50);

  return { radius, state: STATIC_STATE, q };
}

export function buildExploreUrl(base: string, query: Partial<ExploreQuery>): string {
  const params = new URLSearchParams();
  if (query.radius && query.radius !== 25) params.set("r", String(query.radius));
  if (query.q) params.set("q", query.q);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}
