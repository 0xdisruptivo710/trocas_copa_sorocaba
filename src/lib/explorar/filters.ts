export const RADIUS_OPTIONS = [5, 10, 25, 50, 100] as const;
export type Radius = (typeof RADIUS_OPTIONS)[number];

export interface ExploreQuery {
  radius: Radius;
  state: string | null;
  q: string;
}

export function parseExploreQuery(params: URLSearchParams): ExploreQuery {
  const rRaw = Number(params.get("r") ?? "50");
  const radius: Radius = (RADIUS_OPTIONS as readonly number[]).includes(rRaw)
    ? (rRaw as Radius)
    : 50;

  const stateRaw = (params.get("uf") ?? "").toUpperCase();
  const state = /^[A-Z]{2}$/.test(stateRaw) ? stateRaw : null;

  const q = (params.get("q") ?? "").trim().slice(0, 50);

  return { radius, state, q };
}

export function buildExploreUrl(base: string, query: Partial<ExploreQuery>): string {
  const params = new URLSearchParams();
  if (query.radius && query.radius !== 50) params.set("r", String(query.radius));
  if (query.state) params.set("uf", query.state);
  if (query.q) params.set("q", query.q);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}
