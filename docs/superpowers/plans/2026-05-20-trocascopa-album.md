# TrocasCopa — Plano 2: Álbum

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar o álbum interativo das 994 figurinhas — usuário consegue navegar por seleções, filtrar por status (Tenho/Falta/Repetida/Prioridade), buscar, marcar quantidade no card e ver panorama de progresso.

**Architecture:** Catálogo seedado uma vez (`trocas_teams` 50 linhas + `trocas_stickers` 994 linhas). Coleção pessoal em `trocas_user_stickers` (linhas lazy). Página `/album` é Server Component que lê filtros da URL, query no Supabase com JOIN entre stickers/user_stickers, renderiza grid paginado. Interação inline +/- via Server Action.

**Tech Stack:** Next.js 16 RSC + Server Actions, Supabase Postgres (já configurado), Tailwind, shadcn/ui, lucide-react.

**Decisões de UX (alinhadas com usuário):**
- Quantidade: botões inline `-`/`+` no card (sem modal).
- Navegação por seções: chips horizontais no topo (`Todas | FWC | Grupo A...L | Coca-Cola`).
- Visual: card minimalista com código + número grande + cor de fundo derivada da seleção. Sem fotos de jogadores (Panini não publicou).

**Referência:** Spec em `docs/superpowers/specs/2026-05-19-trocascopa-design.md` (seções 4.3, 4.4, 4.5, 5.2, 5.3).

---

## Estrutura de arquivos esperada ao fim do plano

```
supabase/migrations/
├── 20260520_0008_trocas_teams.sql          (table + RLS + seed 50 linhas)
├── 20260520_0009_trocas_stickers.sql       (table + RLS + seed 994 linhas)
└── 20260520_0010_trocas_user_stickers.sql  (table + RLS + indexes)

src/types/supabase.ts                       (estendido com 3 novas tabelas)

src/lib/album/
├── teams.ts            (metadata constants: nome, grupo, cor de fundo, ordem)
├── filters.ts          (parser de URL searchParams → AlbumQuery)
└── data.ts             (getAlbumPage, getPanorama — server-side)

src/lib/actions/
└── stickers.ts         (setStickerQuantity, togglePriority — Server Actions)

src/components/album/
├── sticker-card.tsx        (visual + inline +/- + toggle prioridade)
├── album-grid.tsx          (grid 60 cromos/página)
├── album-filters.tsx       (status pills + group chips + search input)
├── album-pagination.tsx    (botões 1 2 … 17 + prev/next)
└── album-panorama.tsx      (contadores + barra de progresso)

src/app/(app)/album/
└── page.tsx                (Server Component: lê searchParams, fetch, renderiza)
```

---

## Fase 1 — Catálogo no banco

### Task 1: Migration `trocas_teams` (50 linhas)

**Files:**
- Create: `supabase/migrations/20260520_0008_trocas_teams.sql`

- [ ] **Step 1.1: Criar tabela + RLS + seed**

```sql
create table public.trocas_teams (
  code text primary key check (char_length(code) between 2 and 5),
  name_pt text not null,
  group_letter char(1) check (group_letter between 'A' and 'L'),
  sticker_count smallint not null check (sticker_count > 0),
  kind text not null check (kind in ('team','fwc','special')),
  display_order smallint not null
);

alter table public.trocas_teams enable row level security;

create policy "trocas_teams read all"
  on public.trocas_teams for select using (true);
-- INSERT/UPDATE/DELETE: nenhuma policy — só service_role (catálogo estático)

insert into public.trocas_teams (code, name_pt, group_letter, sticker_count, kind, display_order) values
  ('FWC', 'FIFA World Cup History', null, 20, 'fwc',     0),
  ('MEX', 'México',                  'A',  20, 'team',    1),
  ('RSA', 'África do Sul',           'A',  20, 'team',    2),
  ('KOR', 'República da Coreia',     'A',  20, 'team',    3),
  ('CZE', 'Tchéquia',                'A',  20, 'team',    4),
  ('CAN', 'Canadá',                  'B',  20, 'team',    5),
  ('BIH', 'Bósnia',                  'B',  20, 'team',    6),
  ('QAT', 'Catar',                   'B',  20, 'team',    7),
  ('SUI', 'Suíça',                   'B',  20, 'team',    8),
  ('BRA', 'Brasil',                  'C',  20, 'team',    9),
  ('MAR', 'Marrocos',                'C',  20, 'team',   10),
  ('HAI', 'Haiti',                   'C',  20, 'team',   11),
  ('SCO', 'Escócia',                 'C',  20, 'team',   12),
  ('USA', 'Estados Unidos',          'D',  20, 'team',   13),
  ('PAR', 'Paraguai',                'D',  20, 'team',   14),
  ('AUS', 'Austrália',               'D',  20, 'team',   15),
  ('TUR', 'Turquia',                 'D',  20, 'team',   16),
  ('GER', 'Alemanha',                'E',  20, 'team',   17),
  ('CUW', 'Curaçau',                 'E',  20, 'team',   18),
  ('CIV', 'Costa do Marfim',         'E',  20, 'team',   19),
  ('ECU', 'Equador',                 'E',  20, 'team',   20),
  ('NED', 'Países Baixos',           'F',  20, 'team',   21),
  ('JPN', 'Japão',                   'F',  20, 'team',   22),
  ('SWE', 'Suécia',                  'F',  20, 'team',   23),
  ('TUN', 'Tunísia',                 'F',  20, 'team',   24),
  ('BEL', 'Bélgica',                 'G',  20, 'team',   25),
  ('EGY', 'Egito',                   'G',  20, 'team',   26),
  ('IRN', 'República Islâmica do Irã','G', 20, 'team',   27),
  ('NZL', 'Nova Zelândia',           'G',  20, 'team',   28),
  ('ESP', 'Espanha',                 'H',  20, 'team',   29),
  ('CPV', 'Cabo Verde',              'H',  20, 'team',   30),
  ('KSA', 'Arábia Saudita',          'H',  20, 'team',   31),
  ('URU', 'Uruguai',                 'H',  20, 'team',   32),
  ('FRA', 'França',                  'I',  20, 'team',   33),
  ('SEN', 'Senegal',                 'I',  20, 'team',   34),
  ('IRQ', 'Iraque',                  'I',  20, 'team',   35),
  ('NOR', 'Noruega',                 'I',  20, 'team',   36),
  ('ARG', 'Argentina',               'J',  20, 'team',   37),
  ('ALG', 'Argélia',                 'J',  20, 'team',   38),
  ('AUT', 'Áustria',                 'J',  20, 'team',   39),
  ('JOR', 'Jordânia',                'J',  20, 'team',   40),
  ('POR', 'Portugal',                'K',  20, 'team',   41),
  ('COD', 'RD Congo',                'K',  20, 'team',   42),
  ('UZB', 'Uzbequistão',             'K',  20, 'team',   43),
  ('COL', 'Colômbia',                'K',  20, 'team',   44),
  ('ENG', 'Inglaterra',              'L',  20, 'team',   45),
  ('CRO', 'Croácia',                 'L',  20, 'team',   46),
  ('GHA', 'Gana',                    'L',  20, 'team',   47),
  ('PAN', 'Panamá',                  'L',  20, 'team',   48),
  ('CC',  'Coca-Cola',               null, 14, 'special', 99);
```

- [ ] **Step 1.2: Aplicar via MCP**

Use o MCP tool `mcp__claude_ai_Supabase__apply_migration`:
- `project_id`: `ehlpmukjdknnyhkycncb`
- `name`: `trocas_teams`
- `query`: conteúdo completo do .sql

- [ ] **Step 1.3: Verificar contagem**

```
mcp__claude_ai_Supabase__execute_sql
  project_id: ehlpmukjdknnyhkycncb
  query: "select count(*) as n, sum(sticker_count) as total from public.trocas_teams;"
```

Expected: `n=50, total=994`.

- [ ] **Step 1.4: Commit**

```bash
git add supabase/migrations/20260520_0008_trocas_teams.sql
git commit -m "feat(db): trocas_teams catalog with 50 rows (48 selections + FWC + CC)"
```

---

### Task 2: Migration `trocas_stickers` (994 linhas)

**Files:**
- Create: `supabase/migrations/20260520_0009_trocas_stickers.sql`

- [ ] **Step 2.1: Criar tabela + RLS + seed via geração programática**

```sql
create table public.trocas_stickers (
  code text primary key,
  team_code text not null references public.trocas_teams(code) on delete restrict,
  number smallint not null check (number >= 0),
  player_name text,
  position text check (position in ('GK','DEF','MID','FWD','COACH','BADGE','OTHER')),
  is_metalic boolean not null default false,
  image_url text,
  unique (team_code, number)
);

create index trocas_stickers_team_idx on public.trocas_stickers (team_code, number);

alter table public.trocas_stickers enable row level security;

create policy "trocas_stickers read all"
  on public.trocas_stickers for select using (true);
-- INSERT/UPDATE/DELETE: catálogo estático, só service_role

-- Seed FWC (numbered 0..19)
insert into public.trocas_stickers (code, team_code, number)
select 'FWC-' || n::text, 'FWC', n
from generate_series(0, 19) as g(n);

-- Seed all teams (number 1..20)
insert into public.trocas_stickers (code, team_code, number)
select t.code || '-' || n::text, t.code, n
from public.trocas_teams t
cross join generate_series(1, 20) as g(n)
where t.kind = 'team';

-- Seed Coca-Cola (number 1..14)
insert into public.trocas_stickers (code, team_code, number)
select 'CC-' || n::text, 'CC', n
from generate_series(1, 14) as g(n);
```

- [ ] **Step 2.2: Aplicar via MCP** com `name: trocas_stickers`.

- [ ] **Step 2.3: Verificar contagens**

```sql
select team_code, count(*) as n
from public.trocas_stickers
group by team_code
order by team_code;
-- Expected: 49 linhas, todas com n=20 exceto CC (n=14)

select count(*) from public.trocas_stickers;
-- Expected: 994
```

- [ ] **Step 2.4: Commit**

```bash
git add supabase/migrations/20260520_0009_trocas_stickers.sql
git commit -m "feat(db): trocas_stickers seeded with 994 rows (20 FWC + 48*20 teams + 14 CC)"
```

---

### Task 3: Migration `trocas_user_stickers` (coleção do usuário)

**Files:**
- Create: `supabase/migrations/20260520_0010_trocas_user_stickers.sql`

- [ ] **Step 3.1: Criar tabela + índices + RLS + trigger updated_at**

```sql
create table public.trocas_user_stickers (
  user_id uuid not null references public.trocas_profiles(id) on delete cascade,
  sticker_code text not null references public.trocas_stickers(code) on delete cascade,
  owned_count smallint not null default 0 check (owned_count >= 0 and owned_count <= 99),
  is_priority boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, sticker_code)
);

create index trocas_user_stickers_user_owned_idx
  on public.trocas_user_stickers (user_id, owned_count);

create index trocas_user_stickers_dupes_idx
  on public.trocas_user_stickers (sticker_code) where owned_count >= 2;

create index trocas_user_stickers_missing_idx
  on public.trocas_user_stickers (sticker_code) where owned_count = 0;

create index trocas_user_stickers_priority_idx
  on public.trocas_user_stickers (user_id) where is_priority;

alter table public.trocas_user_stickers enable row level security;

create policy "trocas_user_stickers own select"
  on public.trocas_user_stickers for select using (auth.uid() = user_id);

create policy "trocas_user_stickers own insert"
  on public.trocas_user_stickers for insert with check (auth.uid() = user_id);

create policy "trocas_user_stickers own update"
  on public.trocas_user_stickers for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "trocas_user_stickers own delete"
  on public.trocas_user_stickers for delete using (auth.uid() = user_id);

create trigger trocas_user_stickers_set_updated_at
  before update on public.trocas_user_stickers
  for each row execute function public.trocas_set_updated_at();
```

- [ ] **Step 3.2: Aplicar via MCP** com `name: trocas_user_stickers`.

- [ ] **Step 3.3: Verificar tabela**

```sql
select count(*) from public.trocas_user_stickers;
-- Expected: 0 (vazia até usuário marcar primeira figurinha)
```

- [ ] **Step 3.4: Commit**

```bash
git add supabase/migrations/20260520_0010_trocas_user_stickers.sql
git commit -m "feat(db): trocas_user_stickers with RLS and partial indexes for filters"
```

---

### Task 4: Atualizar tipos TypeScript

**Files:**
- Modify: `src/types/supabase.ts`

- [ ] **Step 4.1: Adicionar `trocas_teams`, `trocas_stickers`, `trocas_user_stickers` ao Database interface**

Abra `src/types/supabase.ts` e dentro de `Tables:` (depois de `trocas_profiles`) adicione:

```ts
      trocas_teams: {
        Row: {
          code: string;
          name_pt: string;
          group_letter: string | null;
          sticker_count: number;
          kind: "team" | "fwc" | "special";
          display_order: number;
        };
        Insert: {
          code: string;
          name_pt: string;
          group_letter?: string | null;
          sticker_count: number;
          kind: "team" | "fwc" | "special";
          display_order: number;
        };
        Update: Partial<{
          code: string;
          name_pt: string;
          group_letter: string | null;
          sticker_count: number;
          kind: "team" | "fwc" | "special";
          display_order: number;
        }>;
        Relationships: [];
      };
      trocas_stickers: {
        Row: {
          code: string;
          team_code: string;
          number: number;
          player_name: string | null;
          position: "GK" | "DEF" | "MID" | "FWD" | "COACH" | "BADGE" | "OTHER" | null;
          is_metalic: boolean;
          image_url: string | null;
        };
        Insert: {
          code: string;
          team_code: string;
          number: number;
          player_name?: string | null;
          position?: "GK" | "DEF" | "MID" | "FWD" | "COACH" | "BADGE" | "OTHER" | null;
          is_metalic?: boolean;
          image_url?: string | null;
        };
        Update: Partial<{
          code: string;
          team_code: string;
          number: number;
          player_name: string | null;
          position: "GK" | "DEF" | "MID" | "FWD" | "COACH" | "BADGE" | "OTHER" | null;
          is_metalic: boolean;
          image_url: string | null;
        }>;
        Relationships: [];
      };
      trocas_user_stickers: {
        Row: {
          user_id: string;
          sticker_code: string;
          owned_count: number;
          is_priority: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          sticker_code: string;
          owned_count?: number;
          is_priority?: boolean;
          updated_at?: string;
        };
        Update: Partial<{
          user_id: string;
          sticker_code: string;
          owned_count: number;
          is_priority: boolean;
          updated_at: string;
        }>;
        Relationships: [];
      };
```

- [ ] **Step 4.2: Verificar build**

```bash
npm run build
```

Expected: passa sem erro de tipos.

- [ ] **Step 4.3: Commit**

```bash
git add src/types/supabase.ts
git commit -m "types: extend Database with teams, stickers, user_stickers"
```

---

## Fase 2 — Server-side helpers

### Task 5: `lib/album/teams.ts` — metadata frontend

**Files:**
- Create: `src/lib/album/teams.ts`

- [ ] **Step 5.1: Constantes de UI por seleção**

```ts
/**
 * Frontend-only metadata for teams: background colors derived from flags,
 * group labels. Source of truth for IDs/names stays in the DB.
 *
 * Tailwind arbitrary class values (e.g. bg-[#009c3b]) require literal strings
 * in source so the compiler can extract them. We use inline style instead.
 */

export const TEAM_COLORS: Record<string, { bg: string; fg: string }> = {
  FWC: { bg: "#1d4ed8", fg: "#ffffff" },
  MEX: { bg: "#006847", fg: "#ffffff" },
  RSA: { bg: "#007a4d", fg: "#ffffff" },
  KOR: { bg: "#003478", fg: "#ffffff" },
  CZE: { bg: "#11457e", fg: "#ffffff" },
  CAN: { bg: "#d52b1e", fg: "#ffffff" },
  BIH: { bg: "#002395", fg: "#ffffff" },
  QAT: { bg: "#8a1538", fg: "#ffffff" },
  SUI: { bg: "#d52b1e", fg: "#ffffff" },
  BRA: { bg: "#009c3b", fg: "#ffdf00" },
  MAR: { bg: "#c1272d", fg: "#006233" },
  HAI: { bg: "#00209f", fg: "#d21034" },
  SCO: { bg: "#0065bf", fg: "#ffffff" },
  USA: { bg: "#bf0a30", fg: "#ffffff" },
  PAR: { bg: "#d52b1e", fg: "#ffffff" },
  AUS: { bg: "#00843d", fg: "#ffffff" },
  TUR: { bg: "#e30a17", fg: "#ffffff" },
  GER: { bg: "#000000", fg: "#ffce00" },
  CUW: { bg: "#002868", fg: "#ffffff" },
  CIV: { bg: "#ff7900", fg: "#ffffff" },
  ECU: { bg: "#ffd100", fg: "#0072ce" },
  NED: { bg: "#ae1c28", fg: "#ffffff" },
  JPN: { bg: "#bc002d", fg: "#ffffff" },
  SWE: { bg: "#006aa7", fg: "#fecc00" },
  TUN: { bg: "#e70013", fg: "#ffffff" },
  BEL: { bg: "#ed2939", fg: "#fae042" },
  EGY: { bg: "#ce1126", fg: "#ffffff" },
  IRN: { bg: "#239f40", fg: "#ffffff" },
  NZL: { bg: "#000000", fg: "#ffffff" },
  ESP: { bg: "#aa151b", fg: "#f1bf00" },
  CPV: { bg: "#003893", fg: "#ffffff" },
  KSA: { bg: "#006c35", fg: "#ffffff" },
  URU: { bg: "#7fb2e5", fg: "#ffffff" },
  FRA: { bg: "#0055a4", fg: "#ffffff" },
  SEN: { bg: "#00853f", fg: "#fdef42" },
  IRQ: { bg: "#ce1126", fg: "#ffffff" },
  NOR: { bg: "#ba0c2f", fg: "#ffffff" },
  ARG: { bg: "#75aadb", fg: "#ffffff" },
  ALG: { bg: "#006233", fg: "#ffffff" },
  AUT: { bg: "#ed2939", fg: "#ffffff" },
  JOR: { bg: "#000000", fg: "#ffffff" },
  POR: { bg: "#046a38", fg: "#da291c" },
  COD: { bg: "#007fff", fg: "#ffffff" },
  UZB: { bg: "#1eb53a", fg: "#ffffff" },
  COL: { bg: "#ffcd00", fg: "#003893" },
  ENG: { bg: "#ffffff", fg: "#ce1124" },
  CRO: { bg: "#171796", fg: "#ffffff" },
  GHA: { bg: "#006b3f", fg: "#fcd116" },
  PAN: { bg: "#d72828", fg: "#ffffff" },
  CC:  { bg: "#e61a27", fg: "#ffffff" },
};

export const GROUP_LABELS = [
  "FWC",
  "Grupo A",
  "Grupo B",
  "Grupo C",
  "Grupo D",
  "Grupo E",
  "Grupo F",
  "Grupo G",
  "Grupo H",
  "Grupo I",
  "Grupo J",
  "Grupo K",
  "Grupo L",
  "Coca-Cola",
] as const;

export type GroupLabel = (typeof GROUP_LABELS)[number];

export function groupLabel(team: { kind: string; group_letter: string | null }): GroupLabel {
  if (team.kind === "fwc") return "FWC";
  if (team.kind === "special") return "Coca-Cola";
  return `Grupo ${team.group_letter}` as GroupLabel;
}

export function formatStickerNumber(stickerCode: string, number: number): string {
  // FWC-0 displays as "00", everything else uses the raw number
  if (stickerCode === "FWC-0") return "00";
  return String(number);
}
```

- [ ] **Step 5.2: Commit**

```bash
git add src/lib/album/teams.ts
git commit -m "feat(album): team color metadata and label helpers"
```

---

### Task 6: `lib/album/filters.ts` — parser de URL params

**Files:**
- Create: `src/lib/album/filters.ts`

- [ ] **Step 6.1: Definir tipos e parser**

```ts
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
  const status: StatusFilter = STATUS_VALUES.includes(statusRaw as StatusFilter)
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
```

- [ ] **Step 6.2: Commit**

```bash
git add src/lib/album/filters.ts
git commit -m "feat(album): URL searchParams parser for filters"
```

---

### Task 7: `lib/album/data.ts` — fetches server-side

**Files:**
- Create: `src/lib/album/data.ts`

- [ ] **Step 7.1: Definir tipos e fetchers**

```ts
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

/**
 * Lists all team codes that belong to a UI "group" label.
 * "FWC" → ["FWC"]. "Grupo A" → ["MEX","RSA","KOR","CZE"]. "Coca-Cola" → ["CC"].
 */
function groupToTeamCodes(group: AlbumQuery["group"]): string[] | null {
  if (group === "all") return null;
  if (group === "FWC") return ["FWC"];
  if (group === "Coca-Cola") return ["CC"];
  // "Grupo A" → "A"
  const letter = group.replace("Grupo ", "");
  // Filtered at DB level; we don't know team codes here without a query.
  // So we return null and let the caller filter by group_letter directly.
  return null;
}

function groupLetter(group: AlbumQuery["group"]): string | null {
  if (typeof group === "string" && group.startsWith("Grupo ")) {
    return group.replace("Grupo ", "");
  }
  return null;
}

export async function getAlbumPage(userId: string, query: AlbumQuery): Promise<AlbumPage> {
  const supabase = await createClient();

  // Get every sticker joined with the user's row (LEFT JOIN via separate fetch
  // because supabase-js relational queries get unwieldy with optional rows
  // and we need the full 994 catalog visible).
  //
  // Strategy:
  // 1. Fetch the catalog page (with team join) filtered by group/search.
  // 2. Fetch the user's ownership rows for that page in a second query.
  // 3. Merge in memory.
  // 4. Apply the status filter AFTER merging (since "faltando" means no row).

  // Step 1: catalog query
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

  // Search filter — match team code (uppercase), number, or team name
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

  // Status filters that don't depend on user data can be cut here; the rest
  // (tenho/repetidas/prioridade/faltando) are applied after merge with paging
  // — but to avoid pulling 994 rows per request we apply pagination here for
  // the "todas" case only. For other statuses, we fetch all matching catalog
  // rows (up to the group), filter, then paginate in memory.

  const needsMemoryFilter = query.status !== "todas";

  if (!needsMemoryFilter) {
    const from = (query.page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    catalogQuery = catalogQuery.range(from, to);
  }

  const { data: catalog, error: catErr, count: catalogCount } = await catalogQuery;
  if (catErr) throw catErr;
  const catalogRows = catalog ?? [];

  // Step 2: fetch user's rows for the catalog page
  const codes = catalogRows.map((r) => r.code);
  const { data: ownerships, error: ownErr } = await supabase
    .from("trocas_user_stickers")
    .select("sticker_code, owned_count, is_priority")
    .eq("user_id", userId)
    .in("sticker_code", codes);
  if (ownErr) throw ownErr;
  const ownMap = new Map(
    (ownerships ?? []).map((o) => [o.sticker_code, o] as const),
  );

  // Step 3: merge
  type CatalogJoinRow = {
    code: string;
    team_code: string;
    number: number;
    trocas_teams:
      | { name_pt: string; kind: string; group_letter: string | null; display_order: number }
      | null;
  };
  let merged: StickerRow[] = catalogRows.map((r) => {
    const row = r as unknown as CatalogJoinRow;
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

  // Step 4: status filter + pagination (memory)
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
```

- [ ] **Step 7.2: Build check**

```bash
npm run build
```

Expected: passa.

- [ ] **Step 7.3: Commit**

```bash
git add src/lib/album/data.ts
git commit -m "feat(album): server-side queries (getAlbumPage, getPanorama)"
```

---

### Task 8: `lib/actions/stickers.ts` — Server Actions

**Files:**
- Create: `src/lib/actions/stickers.ts`

- [ ] **Step 8.1: Actions de quantidade e prioridade**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { error?: string };

const MAX_COUNT = 99;

async function upsertUserSticker(
  userId: string,
  stickerCode: string,
  patch: { owned_count?: number; is_priority?: boolean },
) {
  const supabase = await createClient();
  // First check whether a row exists
  const { data: existing } = await supabase
    .from("trocas_user_stickers")
    .select("owned_count, is_priority")
    .eq("user_id", userId)
    .eq("sticker_code", stickerCode)
    .maybeSingle();

  if (existing) {
    return supabase
      .from("trocas_user_stickers")
      .update(patch)
      .eq("user_id", userId)
      .eq("sticker_code", stickerCode);
  }

  return supabase.from("trocas_user_stickers").insert({
    user_id: userId,
    sticker_code: stickerCode,
    owned_count: patch.owned_count ?? 0,
    is_priority: patch.is_priority ?? false,
  });
}

export async function setStickerQuantity(
  stickerCode: string,
  delta: 1 | -1,
): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { data: current } = await supabase
    .from("trocas_user_stickers")
    .select("owned_count")
    .eq("user_id", user.id)
    .eq("sticker_code", stickerCode)
    .maybeSingle();

  const currentCount = current?.owned_count ?? 0;
  const newCount = Math.max(0, Math.min(MAX_COUNT, currentCount + delta));

  if (newCount === currentCount) return {};

  const { error } = await upsertUserSticker(user.id, stickerCode, {
    owned_count: newCount,
  });
  if (error) return { error: error.message };

  revalidatePath("/album");
  revalidatePath("/", "layout");
  return {};
}

export async function togglePriority(stickerCode: string): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { data: current } = await supabase
    .from("trocas_user_stickers")
    .select("is_priority")
    .eq("user_id", user.id)
    .eq("sticker_code", stickerCode)
    .maybeSingle();

  const next = !(current?.is_priority ?? false);
  const { error } = await upsertUserSticker(user.id, stickerCode, {
    is_priority: next,
  });
  if (error) return { error: error.message };

  revalidatePath("/album");
  return {};
}
```

- [ ] **Step 8.2: Build check**

```bash
npm run build
```

- [ ] **Step 8.3: Commit**

```bash
git add src/lib/actions/stickers.ts
git commit -m "feat(album): server actions for sticker quantity and priority"
```

---

## Fase 3 — UI components

### Task 9: `StickerCard` — visual + inline +/-

**Files:**
- Create: `src/components/album/sticker-card.tsx`

- [ ] **Step 9.1: Componente client com optimistic update**

```tsx
"use client";

import { useTransition, useState } from "react";
import { Star, Minus, Plus } from "lucide-react";
import { TEAM_COLORS, formatStickerNumber } from "@/lib/album/teams";
import { setStickerQuantity, togglePriority } from "@/lib/actions/stickers";
import { toast } from "sonner";

interface Props {
  code: string;
  teamCode: string;
  teamName: string;
  number: number;
  ownedCount: number;
  isPriority: boolean;
}

export function StickerCard({
  code,
  teamCode,
  teamName,
  number,
  ownedCount,
  isPriority,
}: Props) {
  const [optimisticCount, setOptimisticCount] = useState(ownedCount);
  const [optimisticPriority, setOptimisticPriority] = useState(isPriority);
  const [pending, start] = useTransition();

  const colors = TEAM_COLORS[teamCode] ?? { bg: "#404040", fg: "#ffffff" };

  const status =
    optimisticCount === 0 ? "missing" : optimisticCount === 1 ? "owned" : "duplicate";

  const change = (delta: 1 | -1) => {
    const next = Math.max(0, Math.min(99, optimisticCount + delta));
    if (next === optimisticCount) return;
    setOptimisticCount(next);
    start(async () => {
      const r = await setStickerQuantity(code, delta);
      if (r.error) {
        setOptimisticCount(ownedCount);
        toast.error(r.error);
      }
    });
  };

  const toggle = () => {
    const next = !optimisticPriority;
    setOptimisticPriority(next);
    start(async () => {
      const r = await togglePriority(code);
      if (r.error) {
        setOptimisticPriority(isPriority);
        toast.error(r.error);
      }
    });
  };

  return (
    <div
      className={`relative flex flex-col rounded-lg border ${
        status === "missing"
          ? "border-border bg-card"
          : status === "owned"
            ? "border-emerald-500/50 bg-card"
            : "border-amber-500/50 bg-card"
      }`}
    >
      <div
        className="flex flex-col items-center justify-center rounded-t-lg p-3"
        style={{ background: colors.bg, color: colors.fg }}
      >
        <span className="text-xs font-bold opacity-80">{teamCode}</span>
        <span className="text-2xl font-extrabold leading-none">
          {formatStickerNumber(code, number)}
        </span>
      </div>

      <div className="flex items-center justify-between px-2 py-1.5">
        <button
          type="button"
          onClick={toggle}
          aria-label={optimisticPriority ? "Remover prioridade" : "Marcar prioridade"}
          disabled={pending}
          className="text-muted-foreground hover:text-amber-500 disabled:opacity-50"
        >
          <Star
            className="size-4"
            fill={optimisticPriority ? "currentColor" : "none"}
            stroke="currentColor"
          />
        </button>

        <span
          className={`text-xs font-medium ${
            status === "missing"
              ? "text-muted-foreground"
              : status === "owned"
                ? "text-emerald-600"
                : "text-amber-600"
          }`}
        >
          {status === "missing"
            ? "Falta"
            : status === "owned"
              ? "Tenho"
              : `${optimisticCount}x`}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => change(-1)}
            aria-label="Diminuir"
            disabled={pending || optimisticCount === 0}
            className="rounded p-0.5 text-muted-foreground hover:bg-accent disabled:opacity-30"
          >
            <Minus className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => change(1)}
            aria-label="Aumentar"
            disabled={pending}
            className="rounded p-0.5 text-muted-foreground hover:bg-accent disabled:opacity-50"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
      </div>

      <span className="sr-only">{teamName}</span>
    </div>
  );
}
```

- [ ] **Step 9.2: Commit**

```bash
git add src/components/album/sticker-card.tsx
git commit -m "feat(album): StickerCard with inline +/- and priority toggle"
```

---

### Task 10: `AlbumGrid` + `AlbumPagination`

**Files:**
- Create: `src/components/album/album-grid.tsx`, `src/components/album/album-pagination.tsx`

- [ ] **Step 10.1: AlbumGrid**

```tsx
import { StickerCard } from "./sticker-card";
import type { StickerRow } from "@/lib/album/data";

export function AlbumGrid({ stickers }: { stickers: StickerRow[] }) {
  if (stickers.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Nenhuma figurinha encontrada com esses filtros.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {stickers.map((s) => (
        <StickerCard
          key={s.code}
          code={s.code}
          teamCode={s.team_code}
          teamName={s.team_name}
          number={s.number}
          ownedCount={s.owned_count}
          isPriority={s.is_priority}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 10.2: AlbumPagination**

```tsx
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buildAlbumUrl, type AlbumQuery } from "@/lib/album/filters";

interface Props {
  query: AlbumQuery;
  totalPages: number;
  total: number;
}

export function AlbumPagination({ query, totalPages, total }: Props) {
  if (totalPages <= 1) {
    return (
      <p className="py-2 text-center text-xs text-muted-foreground">
        {total} figurinhas
      </p>
    );
  }

  const current = query.page;
  const pages: (number | "...")[] = [];

  // Show: 1 ... current-1, current, current+1 ... last
  const push = (n: number | "...") => {
    if (pages[pages.length - 1] !== n) pages.push(n);
  };

  push(1);
  if (current > 3) push("...");
  for (let p = Math.max(2, current - 1); p <= Math.min(totalPages - 1, current + 1); p++) {
    push(p);
  }
  if (current < totalPages - 2) push("...");
  if (totalPages > 1) push(totalPages);

  return (
    <nav className="flex items-center justify-center gap-1 py-3" aria-label="Paginação">
      {current > 1 && (
        <Link
          href={buildAlbumUrl("/album", { ...query, page: current - 1 })}
          className="flex size-8 items-center justify-center rounded text-sm hover:bg-accent"
          aria-label="Anterior"
        >
          <ChevronLeft className="size-4" />
        </Link>
      )}

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`gap-${i}`} className="px-1 text-xs text-muted-foreground">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={buildAlbumUrl("/album", { ...query, page: p })}
            className={`flex size-8 items-center justify-center rounded text-sm ${
              p === current ? "bg-primary text-primary-foreground" : "hover:bg-accent"
            }`}
            aria-current={p === current ? "page" : undefined}
          >
            {p}
          </Link>
        ),
      )}

      {current < totalPages && (
        <Link
          href={buildAlbumUrl("/album", { ...query, page: current + 1 })}
          className="flex size-8 items-center justify-center rounded text-sm hover:bg-accent"
          aria-label="Próxima"
        >
          <ChevronRight className="size-4" />
        </Link>
      )}
    </nav>
  );
}
```

- [ ] **Step 10.3: Commit**

```bash
git add src/components/album/album-grid.tsx src/components/album/album-pagination.tsx
git commit -m "feat(album): grid layout and pagination component"
```

---

### Task 11: `AlbumFilters` — status pills + group chips + search

**Files:**
- Create: `src/components/album/album-filters.tsx`

- [ ] **Step 11.1: Componente client com URL state**

```tsx
"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { GROUP_LABELS } from "@/lib/album/teams";
import { buildAlbumUrl, type AlbumQuery, type StatusFilter } from "@/lib/album/filters";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "faltando", label: "Faltando" },
  { value: "tenho", label: "Tenho" },
  { value: "repetidas", label: "Repetidas" },
  { value: "prioridade", label: "Prioridade" },
];

export function AlbumFilters({ query }: { query: AlbumQuery }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(query.q);
  const [pending, start] = useTransition();

  // Debounce search input → URL
  useEffect(() => {
    if (q === query.q) return;
    const t = setTimeout(() => {
      start(() => {
        router.push(buildAlbumUrl("/album", { ...query, q, page: 1 }));
      });
    }, 300);
    return () => clearTimeout(t);
  }, [q, query, router]);

  const baseHref = (override: Partial<AlbumQuery>) =>
    buildAlbumUrl("/album", { ...query, ...override, page: 1 });

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por número, código ou seleção"
          className="pl-9"
        />
      </div>

      <div className="-mx-6 overflow-x-auto px-6">
        <div className="flex w-max gap-2">
          {STATUS_OPTIONS.map((opt) => {
            const active = query.status === opt.value;
            return (
              <Link
                key={opt.value}
                href={baseHref({ status: opt.value })}
                className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-accent"
                }`}
              >
                {opt.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="-mx-6 overflow-x-auto px-6">
        <div className="flex w-max gap-2">
          <Link
            href={baseHref({ group: "all" })}
            className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs ${
              query.group === "all"
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-muted-foreground hover:bg-accent"
            }`}
          >
            Todas
          </Link>
          {GROUP_LABELS.map((g) => {
            const active = query.group === g;
            return (
              <Link
                key={g}
                href={baseHref({ group: g })}
                className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs ${
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card text-muted-foreground hover:bg-accent"
                }`}
              >
                {g}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 11.2: Commit**

```bash
git add src/components/album/album-filters.tsx
git commit -m "feat(album): filters bar (search + status pills + group chips)"
```

---

### Task 12: `AlbumPanorama` — contadores e progresso

**Files:**
- Create: `src/components/album/album-panorama.tsx`

- [ ] **Step 12.1: Componente Server**

```tsx
import type { Panorama } from "@/lib/album/data";
import { Card } from "@/components/ui/card";

export function AlbumPanorama({ panorama }: { panorama: Panorama }) {
  const { total, owned, duplicates, missing, priority, percent } = panorama;

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">Panorama</h2>
        <span className="text-xs text-muted-foreground">
          {owned} de {total} ({percent}%)
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        <Stat label="Tenho" value={owned} tone="emerald" />
        <Stat label="Repetidas" value={duplicates} tone="amber" />
        <Stat label="Faltam" value={missing} tone="muted" />
        <Stat label="Prioridade" value={priority} tone="primary" />
      </div>
    </Card>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "amber" | "muted" | "primary";
}) {
  const colors = {
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    muted: "text-muted-foreground",
    primary: "text-primary",
  }[tone];

  return (
    <div>
      <p className={`text-lg font-bold ${colors}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
```

- [ ] **Step 12.2: Commit**

```bash
git add src/components/album/album-panorama.tsx
git commit -m "feat(album): panorama card with counts and progress bar"
```

---

## Fase 4 — Página

### Task 13: `/album` page — wiring tudo

**Files:**
- Modify: `src/app/(app)/album/page.tsx` (substituir o placeholder)

- [ ] **Step 13.1: Substituir a página placeholder**

```tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { parseAlbumQuery } from "@/lib/album/filters";
import { getAlbumPage, getPanorama } from "@/lib/album/data";
import { AlbumFilters } from "@/components/album/album-filters";
import { AlbumGrid } from "@/components/album/album-grid";
import { AlbumPagination } from "@/components/album/album-pagination";
import { AlbumPanorama } from "@/components/album/album-panorama";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AlbumPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sp = new URLSearchParams(
    Object.entries(params).flatMap(([k, v]) =>
      Array.isArray(v) ? v.map((vv) => [k, vv]) : v ? [[k, v]] : [],
    ) as [string, string][],
  );
  const query = parseAlbumQuery(sp);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [page, panorama] = await Promise.all([
    getAlbumPage(user.id, query),
    getPanorama(user.id),
  ]);

  return (
    <main className="space-y-4 px-6 py-6">
      <header>
        <h1 className="text-2xl font-semibold">Álbum</h1>
        <p className="text-sm text-muted-foreground">Copa 2026 · 994 figurinhas</p>
      </header>

      <AlbumPanorama panorama={panorama} />

      <AlbumFilters query={query} />

      <AlbumGrid stickers={page.stickers} />

      <AlbumPagination
        query={query}
        totalPages={page.totalPages}
        total={page.total}
      />
    </main>
  );
}
```

- [ ] **Step 13.2: Build + smoke test**

```bash
npm run build
```

Then start dev and verify:

```bash
npm run dev
# Browser: http://localhost:3000/album
# Expected: 994 figurinhas paginated, filters working, +/- updates count
```

- [ ] **Step 13.3: Commit**

```bash
git add src/app/(app)/album/page.tsx
git commit -m "feat(album): /album page wires filters, grid, pagination, panorama"
```

---

### Task 14: Atualizar home com progresso real

**Files:**
- Modify: `src/app/(app)/page.tsx`

- [ ] **Step 14.1: Substituir o card estático por dados reais**

Encontre este bloco em `src/app/(app)/page.tsx`:

```tsx
      <Card className="p-6 space-y-3">
        <h2 className="text-lg font-semibold">Primeiros passos</h2>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500" /> Conta criada
          </li>
          <li className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500" /> Localização salva
          </li>
          <li className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-muted" /> Registre suas figurinhas
          </li>
        </ul>
        <Link
          href="/album"
          className="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Abrir álbum
        </Link>
      </Card>
```

E substitua por:

```tsx
      <Card className="p-6 space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Seu álbum</h2>
          <span className="text-xs text-muted-foreground">
            {panorama.owned} de {panorama.total} ({panorama.percent}%)
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${panorama.percent}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <p className="font-bold text-emerald-600">{panorama.owned}</p>
            <p className="text-muted-foreground">Tenho</p>
          </div>
          <div>
            <p className="font-bold text-amber-600">{panorama.duplicates}</p>
            <p className="text-muted-foreground">Repetidas</p>
          </div>
          <div>
            <p className="font-bold text-muted-foreground">{panorama.missing}</p>
            <p className="text-muted-foreground">Faltam</p>
          </div>
        </div>

        <Link
          href="/album"
          className="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {panorama.owned === 0 ? "Começar o álbum" : "Continuar álbum"}
        </Link>
      </Card>
```

E adicione no topo do arquivo, depois dos imports existentes:

```tsx
import { getPanorama } from "@/lib/album/data";
```

E dentro do `async function Home()`, antes do `return`:

```tsx
  const panorama = await getPanorama(user!.id);
```

- [ ] **Step 14.2: Build + smoke**

```bash
npm run build
```

- [ ] **Step 14.3: Commit**

```bash
git add src/app/(app)/page.tsx
git commit -m "feat(home): show live album progress card"
```

---

## Checklist de aceitação do Plano 2

- [ ] `npm run build` passa.
- [ ] DB: `select count(*) from public.trocas_teams;` retorna 50.
- [ ] DB: `select count(*) from public.trocas_stickers;` retorna 994.
- [ ] `/album` carrega com 60 figurinhas na primeira página.
- [ ] Paginação navega entre 17 páginas (994/60 ≈ 17).
- [ ] Botão `+` no card incrementa `owned_count` (verifica no banco).
- [ ] Botão `-` decrementa, parando em 0.
- [ ] `≥ 2` muda o badge para "2x" (amber).
- [ ] Toggle estrela marca/desmarca `is_priority`.
- [ ] Filtro "Faltando" lista só cards com count=0.
- [ ] Filtro "Repetidas" lista só count≥2.
- [ ] Filtro "Prioridade" lista só marcadas.
- [ ] Chip "Grupo C" mostra só BRA, MAR, HAI, SCO (4×20=80 cromos).
- [ ] Chip "FWC" mostra FWC-0 a FWC-19 (20 cromos, com "00" para o primeiro).
- [ ] Chip "Coca-Cola" mostra CC-1 a CC-14 (14 cromos).
- [ ] Busca "BRA" lista só Brasil.
- [ ] Busca "10" lista todos os cromos número 10.
- [ ] Panorama atualiza após mudar quantidade (revalidatePath em ação).
- [ ] Home `/` mostra progresso real do álbum.

---

## Próximos planos

Depois deste, na ordem sugerida:

- **Plano 3 — Explorar:** RPC `trocas_find_matches` (PostGIS), página `/explorar` com filtros (raio/estado/busca), cards de match, botão "Abrir chat".
- **Plano 4 — Chat:** `trocas_chats`, `trocas_messages`, RPC `trocas_open_chat`, Realtime, lista + thread.
