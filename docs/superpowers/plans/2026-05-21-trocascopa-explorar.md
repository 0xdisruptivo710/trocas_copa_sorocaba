# TrocasCopa — Plano 3: Explorar

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar a página `/explorar` — usuário vê uma lista de colecionadores próximos, ordenada por score de match (figurinhas que ele dá × recebe + distância), com filtros de raio/estado/busca, e abre o perfil público do match para ver o preview detalhado da troca.

**Architecture:** RPC PostgreSQL `trocas_find_matches` faz o pesado: PostGIS cruza distância + cruza repetidas/faltantes em SQL puro, retornando candidatos ordenados. Página `/explorar` Server Component chama a RPC com searchParams. Card mostra resumo; tap abre `/u/{username}` com breakdown dos cromos da troca.

**Tech Stack:** Next.js 16 RSC, Supabase RPC `SECURITY DEFINER` (já que precisa ler `location` que está RLS-blocked), PostGIS `ST_DWithin` + `ST_Distance`.

**Decisões de UX (alinhadas):**
- Raio: pills `5 / 10 / 25 / 50 / 100` km, default 50.
- Card de match → "Ver perfil" → abre `/u/{username}` com preview detalhado.
- Sem botão "Abrir chat" ainda — Plano 4.

**Referência:** Spec em `docs/superpowers/specs/2026-05-19-trocascopa-design.md` (seção 4.10 + 5.x), schemas já criados pelos Planos 1 e 2.

---

## Estrutura de arquivos esperada ao fim do plano

```
supabase/migrations/
└── 20260521_0011_trocas_find_matches.sql  (RPC + revoke + grant)

src/types/supabase.ts                       (estendido com Functions.trocas_find_matches)

src/lib/explorar/
├── filters.ts          (parser de URL → ExploreQuery)
├── data.ts             (callFindMatches + getMatchPreview)
└── states.ts           (lista de UFs brasileiras pra select)

src/components/explorar/
├── match-card.tsx          (avatar + nome + dist + give/get + score + CTA)
├── explore-filters.tsx     (raio pills + state select + search input)
└── explore-empty.tsx       (estados vazios — sem localização, sem matches)

src/components/perfil/
├── profile-header.tsx      (avatar + nome + cidade — reutilizável)
└── trade-preview.tsx       (lista de cromos a dar + receber)

src/app/(app)/explorar/page.tsx     (substitui o placeholder)

src/app/u/[username]/
├── page.tsx                (perfil público + preview da troca se logado)
└── not-found.tsx           (username não existe)
```

---

## Fase 1 — RPC `trocas_find_matches`

### Task 1: Migration RPC + tipos TS

**Files:**
- Create: `supabase/migrations/20260521_0011_trocas_find_matches.sql`
- Modify: `src/types/supabase.ts` (preencher `Functions`)

- [ ] **Step 1.1: SQL da função**

Cria a RPC `SECURITY DEFINER` que cruza coleção do usuário com a do outro e pondera por distância.

```sql
create or replace function public.trocas_find_matches(
  p_radius_km numeric default 50,
  p_limit int default 50,
  p_search text default null,
  p_state text default null
)
returns table (
  other_user uuid,
  username text,
  full_name text,
  avatar_url text,
  city text,
  state char(2),
  distance_km numeric,
  i_can_give int,
  i_can_get int,
  match_score numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  my_location geography;
begin
  if me is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select location into my_location from trocas_profiles where id = me;
  if my_location is null then
    raise exception 'set your location before exploring' using errcode = 'P0001';
  end if;

  return query
  with my_dupes as (
    select sticker_code from trocas_user_stickers
    where user_id = me and owned_count >= 2
  ),
  my_missing as (
    select s.code as sticker_code
    from trocas_stickers s
    left join trocas_user_stickers us on us.user_id = me and us.sticker_code = s.code
    where coalesce(us.owned_count, 0) = 0
  ),
  candidates as (
    select
      p.id,
      p.username,
      p.full_name,
      p.avatar_url,
      p.city,
      p.state,
      round((st_distance(p.location, my_location) / 1000.0)::numeric, 1) as distance_km
    from trocas_profiles p
    where p.id <> me
      and p.location is not null
      and st_dwithin(p.location, my_location, p_radius_km * 1000)
      and (p_state is null or p.state = p_state)
      and (
        p_search is null
        or p.username ilike '%' || p_search || '%'
        or p.full_name ilike '%' || p_search || '%'
      )
  ),
  scored as (
    select
      c.id,
      c.username,
      c.full_name,
      c.avatar_url,
      c.city,
      c.state,
      c.distance_km,
      (
        select count(*) from my_dupes md
        where not exists (
          select 1 from trocas_user_stickers other_us
          where other_us.user_id = c.id
            and other_us.sticker_code = md.sticker_code
            and other_us.owned_count >= 1
        )
      )::int as i_can_give_raw,
      (
        select count(*) from my_missing mm
        join trocas_user_stickers other_us
          on other_us.user_id = c.id
         and other_us.sticker_code = mm.sticker_code
        where other_us.owned_count >= 2
      )::int as i_can_get_raw
    from candidates c
  )
  select
    s.id,
    s.username,
    s.full_name,
    s.avatar_url,
    s.city,
    s.state,
    s.distance_km,
    s.i_can_give_raw,
    s.i_can_get_raw,
    round(
      least(s.i_can_give_raw, s.i_can_get_raw)::numeric
      / (1 + s.distance_km / 10.0),
      2
    ) as match_score
  from scored s
  where least(s.i_can_give_raw, s.i_can_get_raw) > 0
  order by match_score desc
  limit p_limit;
end $$;

-- Allow callers, but only authenticated ones
revoke execute on function public.trocas_find_matches(numeric, int, text, text) from public, anon;
grant execute on function public.trocas_find_matches(numeric, int, text, text) to authenticated;
```

- [ ] **Step 1.2: Aplicar via MCP**

```
mcp__claude_ai_Supabase__apply_migration
  project_id: ehlpmukjdknnyhkycncb
  name: trocas_find_matches
  query: <conteúdo do .sql>
```

- [ ] **Step 1.3: Smoke da função via execute_sql (sem auth — deve dar erro 'not authenticated')**

```
mcp__claude_ai_Supabase__execute_sql
  project_id: ehlpmukjdknnyhkycncb
  query: "select * from public.trocas_find_matches();"
```

Expected: erro `not authenticated` (executa como service role mas `auth.uid()` retorna null).

- [ ] **Step 1.4: Estender `src/types/supabase.ts` com a função**

Encontre `Functions: Record<string, never>;` em `src/types/supabase.ts` e substitua por:

```ts
    Functions: {
      trocas_find_matches: {
        Args: {
          p_radius_km?: number;
          p_limit?: number;
          p_search?: string | null;
          p_state?: string | null;
        };
        Returns: {
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
        }[];
      };
    };
```

- [ ] **Step 1.5: Build**

```bash
npm run build
```

Expected: passa.

- [ ] **Step 1.6: Commit**

```bash
git add supabase/migrations/20260521_0011_trocas_find_matches.sql src/types/supabase.ts
git commit -m "feat(db): trocas_find_matches RPC + TS types"
```

---

## Fase 2 — Server helpers

### Task 2: `lib/explorar/filters.ts` — parser de URL

**Files:**
- Create: `src/lib/explorar/filters.ts`

- [ ] **Step 2.1: Tipos + parser**

```ts
export const RADIUS_OPTIONS = [5, 10, 25, 50, 100] as const;
export type Radius = (typeof RADIUS_OPTIONS)[number];

export interface ExploreQuery {
  radius: Radius;
  state: string | null; // 2-letter UF or null = todos
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
```

- [ ] **Step 2.2: Commit**

```bash
git add src/lib/explorar/filters.ts
git commit -m "feat(explorar): URL filter parser"
```

---

### Task 3: `lib/explorar/states.ts` — lista de UFs

**Files:**
- Create: `src/lib/explorar/states.ts`

- [ ] **Step 3.1: Lista**

```ts
export const BR_STATES: { code: string; name: string }[] = [
  { code: "AC", name: "Acre" },
  { code: "AL", name: "Alagoas" },
  { code: "AP", name: "Amapá" },
  { code: "AM", name: "Amazonas" },
  { code: "BA", name: "Bahia" },
  { code: "CE", name: "Ceará" },
  { code: "DF", name: "Distrito Federal" },
  { code: "ES", name: "Espírito Santo" },
  { code: "GO", name: "Goiás" },
  { code: "MA", name: "Maranhão" },
  { code: "MT", name: "Mato Grosso" },
  { code: "MS", name: "Mato Grosso do Sul" },
  { code: "MG", name: "Minas Gerais" },
  { code: "PA", name: "Pará" },
  { code: "PB", name: "Paraíba" },
  { code: "PR", name: "Paraná" },
  { code: "PE", name: "Pernambuco" },
  { code: "PI", name: "Piauí" },
  { code: "RJ", name: "Rio de Janeiro" },
  { code: "RN", name: "Rio Grande do Norte" },
  { code: "RS", name: "Rio Grande do Sul" },
  { code: "RO", name: "Rondônia" },
  { code: "RR", name: "Roraima" },
  { code: "SC", name: "Santa Catarina" },
  { code: "SP", name: "São Paulo" },
  { code: "SE", name: "Sergipe" },
  { code: "TO", name: "Tocantins" },
];
```

- [ ] **Step 3.2: Commit**

```bash
git add src/lib/explorar/states.ts
git commit -m "feat(explorar): UF list constants"
```

---

### Task 4: `lib/explorar/data.ts` — wrappers do RPC e do preview

**Files:**
- Create: `src/lib/explorar/data.ts`

- [ ] **Step 4.1: Tipos + funções**

```ts
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
  // Cromos que EU tenho repetida e o outro precisa
  i_give: { code: string; team_code: string; number: number; team_name: string }[];
  // Cromos que o OUTRO tem repetida e eu preciso
  i_get: { code: string; team_code: string; number: number; team_name: string }[];
}

export async function getTradePreview(otherUserId: string): Promise<TradePreview> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { i_give: [], i_get: [] };

  // i_give: my dupes that other is missing (no row OR owned_count = 0)
  // i_get: other's dupes that I am missing (no row OR owned_count = 0)
  //
  // We resolve in two passes — small lists, no need to optimize.
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

  // i_give = my dupes where other does NOT own (lookup their owned rows)
  const [otherOwned, myOwned] = await Promise.all([
    myDupeCodes.length
      ? supabase
          .from("trocas_user_stickers")
          .select("sticker_code")
          .eq("user_id", otherUserId)
          .in("sticker_code", myDupeCodes)
          .gte("owned_count", 1)
      : Promise.resolve({ data: [], error: null }),
    otherDupeCodes.length
      ? supabase
          .from("trocas_user_stickers")
          .select("sticker_code")
          .eq("user_id", user.id)
          .in("sticker_code", otherDupeCodes)
          .gte("owned_count", 1)
      : Promise.resolve({ data: [], error: null }),
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
    .select(
      "code, team_code, number, trocas_teams!inner(name_pt)",
    )
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
```

- [ ] **Step 4.2: Build check**

```bash
npm run build
```

- [ ] **Step 4.3: Commit**

```bash
git add src/lib/explorar/data.ts
git commit -m "feat(explorar): RPC wrapper, trade preview, public profile fetcher"
```

---

## Fase 3 — UI components

### Task 5: `MatchCard`

**Files:**
- Create: `src/components/explorar/match-card.tsx`

- [ ] **Step 5.1: Componente Server**

```tsx
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ChevronRight, MapPin } from "lucide-react";
import type { Match } from "@/lib/explorar/data";

export function MatchCard({ match }: { match: Match }) {
  const initials = match.full_name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Link href={`/u/${match.username}`} className="block">
      <Card className="flex items-center gap-3 p-3 transition-colors hover:bg-accent">
        <Avatar className="size-12 shrink-0">
          <AvatarImage src={match.avatar_url ?? undefined} alt={match.full_name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-sm font-semibold">{match.full_name}</p>
            <span className="shrink-0 text-xs font-bold text-primary">
              {match.match_score}
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3" aria-hidden />
            <span className="truncate">
              {match.city ? `${match.city}, ${match.state}` : match.state ?? "—"}
            </span>
            <span aria-hidden>·</span>
            <span>{match.distance_km} km</span>
          </div>

          <div className="mt-1 flex gap-3 text-xs">
            <span className="text-emerald-600">
              <strong>{match.i_can_give}</strong> que você dá
            </span>
            <span className="text-amber-600">
              <strong>{match.i_can_get}</strong> que recebe
            </span>
          </div>
        </div>

        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </Card>
    </Link>
  );
}
```

- [ ] **Step 5.2: Commit**

```bash
git add src/components/explorar/match-card.tsx
git commit -m "feat(explorar): MatchCard with avatar, distance, and give/get counts"
```

---

### Task 6: `ExploreFilters`

**Files:**
- Create: `src/components/explorar/explore-filters.tsx`

- [ ] **Step 6.1: Componente client**

```tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { RADIUS_OPTIONS, buildExploreUrl, type ExploreQuery } from "@/lib/explorar/filters";
import { BR_STATES } from "@/lib/explorar/states";

export function ExploreFilters({ query }: { query: ExploreQuery }) {
  const router = useRouter();
  const [q, setQ] = useState(query.q);
  const [, start] = useTransition();

  useEffect(() => {
    if (q === query.q) return;
    const t = setTimeout(() => {
      start(() => {
        router.push(buildExploreUrl("/explorar", { ...query, q }));
      });
    }, 300);
    return () => clearTimeout(t);
  }, [q, query, router]);

  const onStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    router.push(buildExploreUrl("/explorar", { ...query, state: v === "" ? null : v }));
  };

  const radiusHref = (r: number) => buildExploreUrl("/explorar", { ...query, radius: r as ExploreQuery["radius"] });

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar colecionador (nome ou @username)"
          className="pl-9"
        />
      </div>

      <div className="-mx-6 overflow-x-auto px-6">
        <div className="flex w-max gap-2">
          {RADIUS_OPTIONS.map((r) => {
            const active = query.radius === r;
            return (
              <Link
                key={r}
                href={radiusHref(r)}
                className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-accent"
                }`}
              >
                {r} km
              </Link>
            );
          })}
        </div>
      </div>

      <select
        value={query.state ?? ""}
        onChange={onStateChange}
        className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
        aria-label="Estado"
      >
        <option value="">Todos os estados</option>
        {BR_STATES.map((s) => (
          <option key={s.code} value={s.code}>
            {s.name} ({s.code})
          </option>
        ))}
      </select>
    </div>
  );
}
```

- [ ] **Step 6.2: Commit**

```bash
git add src/components/explorar/explore-filters.tsx
git commit -m "feat(explorar): filters bar (radius pills + state select + search)"
```

---

### Task 7: `ExploreEmpty` — estados vazios

**Files:**
- Create: `src/components/explorar/explore-empty.tsx`

- [ ] **Step 7.1: Componente**

```tsx
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { MapPinOff, Inbox } from "lucide-react";

export function NoLocationState() {
  return (
    <Card className="space-y-3 p-6 text-center">
      <MapPinOff className="mx-auto size-8 text-muted-foreground" />
      <h2 className="font-semibold">Defina sua localização</h2>
      <p className="text-sm text-muted-foreground">
        Pra encontrar colecionadores próximos, precisamos saber onde você está.
      </p>
      <Link
        href="/conta"
        className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Definir localização
      </Link>
    </Card>
  );
}

export function NoMatchesState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <Card className="space-y-2 p-6 text-center">
      <Inbox className="mx-auto size-8 text-muted-foreground" />
      <h2 className="font-semibold">Nenhum match agora</h2>
      <p className="text-sm text-muted-foreground">
        {hasFilters
          ? "Tenta aumentar o raio ou limpar os filtros."
          : "Conforme você marca figurinhas no álbum, vão aparecer colecionadores aqui."}
      </p>
      {!hasFilters && (
        <Link
          href="/album"
          className="inline-flex h-9 items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-accent"
        >
          Abrir álbum
        </Link>
      )}
    </Card>
  );
}
```

- [ ] **Step 7.2: Commit**

```bash
git add src/components/explorar/explore-empty.tsx
git commit -m "feat(explorar): empty states (no location, no matches)"
```

---

### Task 8: `/explorar` page wiring

**Files:**
- Modify: `src/app/(app)/explorar/page.tsx`

- [ ] **Step 8.1: Substituir o placeholder**

```tsx
import { parseExploreQuery } from "@/lib/explorar/filters";
import { findMatches } from "@/lib/explorar/data";
import { ExploreFilters } from "@/components/explorar/explore-filters";
import { MatchCard } from "@/components/explorar/match-card";
import { NoLocationState, NoMatchesState } from "@/components/explorar/explore-empty";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ExplorarPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sp = new URLSearchParams(
    Object.entries(params).flatMap(([k, v]) =>
      Array.isArray(v) ? v.map((vv) => [k, vv]) : v ? [[k, v]] : [],
    ) as [string, string][],
  );
  const query = parseExploreQuery(sp);

  const result = await findMatches(query);

  if (result.kind === "no_location") {
    return (
      <main className="space-y-4 px-6 py-6">
        <header>
          <h1 className="text-2xl font-semibold">Explorar</h1>
        </header>
        <NoLocationState />
      </main>
    );
  }

  if (result.kind === "not_authenticated") {
    return (
      <main className="px-6 py-6">
        <p className="text-sm text-muted-foreground">Não autenticado.</p>
      </main>
    );
  }

  if (result.kind === "error") {
    return (
      <main className="px-6 py-6">
        <p className="text-sm text-destructive">Erro ao buscar: {result.message}</p>
      </main>
    );
  }

  const hasFilters = query.radius !== 50 || query.state !== null || query.q !== "";

  return (
    <main className="space-y-4 px-6 py-6">
      <header>
        <h1 className="text-2xl font-semibold">Explorar</h1>
        <p className="text-sm text-muted-foreground">
          {result.matches.length === 0
            ? "Sem matches no raio escolhido"
            : `${result.matches.length} ${result.matches.length === 1 ? "match encontrado" : "matches encontrados"}`}
        </p>
      </header>

      <ExploreFilters query={query} />

      {result.matches.length === 0 ? (
        <NoMatchesState hasFilters={hasFilters} />
      ) : (
        <ul className="space-y-2">
          {result.matches.map((m) => (
            <li key={m.other_user}>
              <MatchCard match={m} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
```

- [ ] **Step 8.2: Build + smoke**

```bash
npm run build
```

- [ ] **Step 8.3: Commit**

```bash
git add src/app/\(app\)/explorar/page.tsx
git commit -m "feat(explorar): wire page with RPC, filters, cards, empty states"
```

---

## Fase 4 — Perfil público + preview da troca

### Task 9: Componentes `ProfileHeader` e `TradePreview`

**Files:**
- Create: `src/components/perfil/profile-header.tsx`, `src/components/perfil/trade-preview.tsx`

- [ ] **Step 9.1: ProfileHeader**

```tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin } from "lucide-react";

interface Props {
  fullName: string;
  username: string;
  avatarUrl: string | null;
  city: string | null;
  state: string | null;
  bio: string | null;
}

export function ProfileHeader({ fullName, username, avatarUrl, city, state, bio }: Props) {
  const initials = fullName
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="space-y-3">
      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          <AvatarImage src={avatarUrl ?? undefined} alt={fullName} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-semibold">{fullName}</h1>
          <p className="text-sm text-muted-foreground">@{username}</p>
        </div>
      </div>

      {(city || state) && (
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="size-4" aria-hidden />
          {city ? `${city}, ${state}` : state}
        </p>
      )}

      {bio && <p className="text-sm">{bio}</p>}
    </header>
  );
}
```

- [ ] **Step 9.2: TradePreview**

```tsx
import { Card } from "@/components/ui/card";
import { TEAM_COLORS, formatStickerNumber } from "@/lib/album/teams";
import type { TradePreview as Preview } from "@/lib/explorar/data";

interface Props {
  preview: Preview;
}

export function TradePreview({ preview }: Props) {
  const total = preview.i_give.length + preview.i_get.length;

  if (total === 0) {
    return (
      <Card className="p-6 text-center text-sm text-muted-foreground">
        Vocês não têm uma troca direta agora — talvez quando atualizar o álbum.
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TradeList
        title={`Você dá (${preview.i_give.length})`}
        tone="emerald"
        stickers={preview.i_give}
      />
      <TradeList
        title={`Você recebe (${preview.i_get.length})`}
        tone="amber"
        stickers={preview.i_get}
      />
    </div>
  );
}

function TradeList({
  title,
  tone,
  stickers,
}: {
  title: string;
  tone: "emerald" | "amber";
  stickers: { code: string; team_code: string; number: number; team_name: string }[];
}) {
  const heading = tone === "emerald" ? "text-emerald-600" : "text-amber-600";

  return (
    <Card className="space-y-2 p-4">
      <h2 className={`text-sm font-semibold ${heading}`}>{title}</h2>
      {stickers.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhuma figurinha.</p>
      ) : (
        <ul className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
          {stickers.map((s) => {
            const colors = TEAM_COLORS[s.team_code] ?? { bg: "#404040", fg: "#ffffff" };
            return (
              <li
                key={s.code}
                title={`${s.team_name} ${s.number}`}
                className="rounded p-1.5 text-center"
                style={{ background: colors.bg, color: colors.fg }}
              >
                <p className="text-[10px] font-bold opacity-80">{s.team_code}</p>
                <p className="text-base font-extrabold leading-none">
                  {formatStickerNumber(s.code, s.number)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
```

- [ ] **Step 9.3: Commit**

```bash
git add src/components/perfil/
git commit -m "feat(perfil): ProfileHeader and TradePreview components"
```

---

### Task 10: `/u/[username]` page + not-found

**Files:**
- Create: `src/app/u/[username]/page.tsx`, `src/app/u/[username]/not-found.tsx`

- [ ] **Step 10.1: not-found**

```tsx
import Link from "next/link";

export default function UserNotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12 text-center">
      <h1 className="text-2xl font-semibold">Colecionador não encontrado</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Esse @username não existe ou foi removido.
      </p>
      <Link
        href="/explorar"
        className="mt-6 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Voltar pra Explorar
      </Link>
    </main>
  );
}
```

- [ ] **Step 10.2: page.tsx**

```tsx
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getPublicProfileByUsername,
  getTradePreview,
} from "@/lib/explorar/data";
import { ProfileHeader } from "@/components/perfil/profile-header";
import { TradePreview } from "@/components/perfil/trade-preview";
import { ChevronLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getPublicProfileByUsername(username);
  if (!profile) notFound();

  // Próprio perfil? Redireciona pra /conta
  if (profile.id === user.id) redirect("/conta");

  const preview = await getTradePreview(profile.id);

  return (
    <main className="space-y-6 px-6 py-6">
      <Link
        href="/explorar"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Voltar
      </Link>

      <ProfileHeader
        fullName={profile.full_name}
        username={profile.username}
        avatarUrl={profile.avatar_url}
        city={profile.city}
        state={profile.state}
        bio={profile.bio}
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Sua troca</h2>
        <TradePreview preview={preview} />
      </section>

      <section className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm">
        <p className="font-medium">Chat em breve (Plano 4)</p>
        <p className="text-muted-foreground">
          Por enquanto você consegue ver os matches e o preview da troca. O chat
          direto chega na próxima fase.
        </p>
      </section>
    </main>
  );
}
```

- [ ] **Step 10.3: Build**

```bash
npm run build
```

- [ ] **Step 10.4: Commit**

```bash
git add src/app/u/
git commit -m "feat(perfil): /u/[username] public profile with trade preview"
```

---

## Checklist de aceitação do Plano 3

- [ ] `npm run build` passa.
- [ ] DB: `select count(*) from pg_proc where proname = 'trocas_find_matches';` retorna 1.
- [ ] Chamar a RPC sem auth retorna erro `not authenticated`.
- [ ] `/explorar` carrega sem 500 errors.
- [ ] Quando user não tem localização, vê o estado vazio "Defina sua localização".
- [ ] Quando user não tem matches no raio, vê "Nenhum match agora".
- [ ] Filtros de raio (5/10/25/50/100) funcionam: mudar URL → resultado muda.
- [ ] Filtro de UF funciona.
- [ ] Busca por nome/username funciona.
- [ ] MatchCard mostra avatar, nome, distância, dá/recebe, score.
- [ ] Tap em MatchCard abre `/u/{username}`.
- [ ] Página `/u/{username}` mostra header + 2 grids (Você dá / Você recebe).
- [ ] `/u/{seu_username}` (próprio user) redireciona pra `/conta`.
- [ ] Username inexistente em `/u/...` mostra not-found.

---

## Como testar end-to-end (precisa de 2 usuários)

Como você só tem 1 conta no app no momento (`muriloaugustoatm`), pra testar o fluxo completo:

1. **Cria um segundo usuário fake via Supabase SQL** (eu te ajudo com isso):
   ```sql
   -- Cria user via auth.admin.createUser via MCP execute_sql:
   -- Já que MCP roda como service_role, podemos usar a função de admin
   -- (ou criar via dashboard mesmo)
   ```
   Mais fácil: abre o Dashboard Supabase → Authentication → Add user → cria `tester@teste.com` / `senha1234`.

2. **Configura o tester:**
   ```sql
   -- Set location pra perto da sua + algumas figurinhas
   update public.trocas_profiles
   set city = 'Sorocaba', state = 'SP',
       location = ST_SetSRID(ST_MakePoint(-47.45, -23.50), 4326)::geography
   where username = 'tester';
   
   -- Marca algumas repetidas e faltantes pro tester
   insert into public.trocas_user_stickers (user_id, sticker_code, owned_count)
   select (select id from trocas_profiles where username = 'tester'),
          code, 3
   from trocas_stickers
   where team_code = 'BRA' and number between 1 and 5;
   ```

3. **No seu user, marca cromos diferentes do BRA como repetidas pra fechar a troca**, vai pra `/explorar` e veja se `tester` aparece.

---

## Próximos planos

- **Plano 4 — Chat:** `trocas_chats`, `trocas_messages`, RPC `trocas_open_chat`, Realtime, lista de conversas, thread. Substitui o card amarelo "Chat em breve" no perfil público por um botão "Conversar".
