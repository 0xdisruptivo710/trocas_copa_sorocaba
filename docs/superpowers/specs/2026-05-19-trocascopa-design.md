# TrocasCopa — Design Spec & PRD do Banco de Dados

**Data:** 2026-05-19
**Status:** Aprovado para implementação (MVP v1)
**Autor:** Sessão Claude Code + Murilo

---

## 1. Visão geral do produto

**TrocasCopa** é um PWA mobile-first para colecionadores do álbum **Panini FIFA World Cup 2026™** (Brasil) trocarem figurinhas. O app permite:

1. **Gerenciar o álbum pessoal** das 994 figurinhas (980 oficiais + 14 Coca-Cola).
2. **Encontrar matches de troca** por proximidade geográfica (GPS, raio em km) cruzando repetidas × faltantes.
3. **Conversar em chat 1:1** com matches para combinar a troca.
4. **Perfil público** com região, progresso e estatísticas.

### Fora do escopo da v1 (MVP)
- Pagamento premium (PIX R$ 24,90 / R$ 19,90 com cupom).
- Sistema de cupons de indicação e cashback de R$ 5,00.
- Propostas de troca formais (aceitar/recusar/cancelar/concluir).
- Notificações push.
- Reputação, denúncia, bloqueio.
- Nomes/fotos dos jogadores (Panini revela perto do lançamento — 2026-04-01).

Premium **continua na modelagem do banco** (`profiles.is_premium`) como bandeira pré-fabricada, mas sem efeito em v1.

---

## 2. Stack técnica

| Camada | Escolha | Por quê |
|---|---|---|
| Frontend | Next.js 16 (App Router, RSC, Server Actions) | Estrutura nativa do Vercel, streaming, Cache Components |
| Hospedagem | Vercel (Fluid Compute) | Default da stack, edge-friendly, sem cold-start relevante |
| Banco | Supabase Postgres + PostGIS | RLS, Realtime, Auth e Storage em uma só plataforma |
| Auth | Supabase Auth (email/senha + Google OAuth) | Cobre ~95% do público brasileiro sem fricção |
| Realtime | Supabase Realtime | Channel por conversa, INSERT em `messages` |
| Storage | Supabase Storage (bucket `avatars`) | Upload direto do cliente com policies |
| Geolocalização | Browser Geolocation API → PostGIS `geography` | Privacidade server-side; só `distance_km` retorna ao cliente |
| Estilo | Tailwind CSS + shadcn/ui | Velocidade de iteração, baseline de qualidade |
| PWA | next-pwa ou manifest manual | Instalável, splash, ícone, modo standalone |

### Decisões transversais
- **IDs:** `uuid` para entidades de usuário; `text` (códigos curtos como `BRA`, `FWC-00`) para o catálogo estático.
- **Soft delete:** apenas em `chats`/`messages` (`deleted_at` nullable). Resto é hard delete.
- **Timestamps:** `timestamptz` em UTC; UI interpreta no fuso `America/Sao_Paulo`.
- **Triggers genéricos:** `set_updated_at()` em todas as tabelas com `updated_at`.
- **Naming:** snake_case em SQL, camelCase em TypeScript, geração de tipos via `supabase gen types`.

---

## 3. Mapa de páginas → dados

| Rota | Função principal | Tabelas envolvidas |
|---|---|---|
| `/` (Início) | Onboarding, progresso, atalhos | `profiles`, `user_stickers` (agregado) |
| `/explorar` | Lista de matches por proximidade e score | `profiles`, `find_matches()` RPC |
| `/album` | Grid de 994 cromos com filtros | `teams`, `stickers`, `user_stickers` |
| `/chat` | Lista de conversas | `chats`, `messages` (último) |
| `/chat/[id]` | Thread de mensagens | `messages`, Realtime channel |
| `/conta` | Perfil, localização, logout | `profiles`, `user_stickers` (agregado) |
| `/login`, `/cadastro` | Auth | `auth.users` (Supabase) |

---

## 4. PRD do Banco de Dados

### 4.1 Extensões necessárias

```sql
create extension if not exists postgis;
create extension if not exists pgcrypto; -- gen_random_uuid()
```

### 4.2 Tabela `profiles`

Perfil público do usuário. 1:1 com `auth.users`.

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null
    check (username ~ '^[a-z0-9_]{3,30}$'),
  full_name text not null check (char_length(full_name) between 2 and 100),
  avatar_url text,
  bio text check (char_length(bio) <= 280),
  city text,
  state char(2) check (state ~ '^[A-Z]{2}$'),
  location geography(Point, 4326),
  location_updated_at timestamptz,
  is_premium boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_location_gix on public.profiles using gist (location);
create index profiles_state_idx on public.profiles (state);
create index profiles_username_lower_idx on public.profiles (lower(username));
```

**Notas:**
- `username` validado por regex (lowercase alfanumérico + `_`, 3-30 chars).
- `state` UF maiúsculo de 2 chars.
- `location` opcional — usuário pode usar o app sem GPS, mas não aparece em Explorar.
- `is_premium` reservado para fase 2.

### 4.3 Tabela `teams`

Catálogo estático: 48 seleções + FWC + CC = 50 linhas.

```sql
create table public.teams (
  code text primary key check (char_length(code) between 2 and 5),
  name_pt text not null,
  group_letter char(1) check (group_letter between 'A' and 'L'),
  sticker_count smallint not null check (sticker_count > 0),
  kind text not null check (kind in ('team','fwc','special')),
  display_order smallint not null
);
```

**Seed (resumo, 50 linhas):**

| code | name_pt | group | kind | count |
|---|---|---|---|---|
| `FWC` | FIFA World Cup History | NULL | `fwc` | 20 |
| `MEX` | México | A | `team` | 20 |
| `RSA` | África do Sul | A | `team` | 20 |
| `KOR` | República da Coreia | A | `team` | 20 |
| `CZE` | Tchéquia | A | `team` | 20 |
| `CAN` | Canadá | B | `team` | 20 |
| `BIH` | Bósnia | B | `team` | 20 |
| `QAT` | Catar | B | `team` | 20 |
| `SUI` | Suíça | B | `team` | 20 |
| `BRA` | Brasil | C | `team` | 20 |
| `MAR` | Marrocos | C | `team` | 20 |
| `HAI` | Haiti | C | `team` | 20 |
| `SCO` | Escócia | C | `team` | 20 |
| `USA` | Estados Unidos | D | `team` | 20 |
| `PAR` | Paraguai | D | `team` | 20 |
| `AUS` | Austrália | D | `team` | 20 |
| `TUR` | Turquia | D | `team` | 20 |
| `GER` | Alemanha | E | `team` | 20 |
| `CUW` | Curaçau | E | `team` | 20 |
| `CIV` | Costa do Marfim | E | `team` | 20 |
| `ECU` | Equador | E | `team` | 20 |
| `NED` | Países Baixos | F | `team` | 20 |
| `JPN` | Japão | F | `team` | 20 |
| `SWE` | Suécia | F | `team` | 20 |
| `TUN` | Tunísia | F | `team` | 20 |
| `BEL` | Bélgica | G | `team` | 20 |
| `EGY` | Egito | G | `team` | 20 |
| `IRN` | República Islâmica do Irã | G | `team` | 20 |
| `NZL` | Nova Zelândia | G | `team` | 20 |
| `ESP` | Espanha | H | `team` | 20 |
| `CPV` | Cabo Verde | H | `team` | 20 |
| `KSA` | Arábia Saudita | H | `team` | 20 |
| `URU` | Uruguai | H | `team` | 20 |
| `FRA` | França | I | `team` | 20 |
| `SEN` | Senegal | I | `team` | 20 |
| `IRQ` | Iraque | I | `team` | 20 |
| `NOR` | Noruega | I | `team` | 20 |
| `ARG` | Argentina | J | `team` | 20 |
| `ALG` | Argélia | J | `team` | 20 |
| `AUT` | Áustria | J | `team` | 20 |
| `JOR` | Jordânia | J | `team` | 20 |
| `POR` | Portugal | K | `team` | 20 |
| `COD` | RD Congo | K | `team` | 20 |
| `UZB` | Uzbequistão | K | `team` | 20 |
| `COL` | Colômbia | K | `team` | 20 |
| `ENG` | Inglaterra | L | `team` | 20 |
| `CRO` | Croácia | L | `team` | 20 |
| `GHA` | Gana | L | `team` | 20 |
| `PAN` | Panamá | L | `team` | 20 |
| `CC` | Coca-Cola | NULL | `special` | 14 |

**Totais:** 48 × 20 (seleções) + 20 (FWC) + 14 (CC) = **994** ✓

### 4.4 Tabela `stickers`

As 994 figurinhas. Catálogo gerado por migration a partir de `teams.sticker_count`.

```sql
create table public.stickers (
  code text primary key,
  team_code text not null references public.teams(code) on delete restrict,
  number smallint not null check (number >= 0),
  player_name text,
  position text check (position in ('GK','DEF','MID','FWD','COACH','BADGE','OTHER')),
  is_metalic boolean not null default false,
  image_url text,
  unique (team_code, number)
);

create index stickers_team_code_idx on public.stickers (team_code, number);
```

**Geração do seed via migration:**
- Para `FWC`: 20 linhas, `number` de 0 a 19, `code` = `FWC-00`, `FWC-01`...`FWC-19`.
- Para cada seleção (48): 20 linhas, `number` de 1 a 20, `code` = `{TEAM}-{N}`.
- Para `CC`: 14 linhas, `number` de 1 a 14, `code` = `CC-1`...`CC-14`.
- Marca `is_metalic = true` nas 68 figurinhas especiais quando essa lista for divulgada pela Panini (TODO pós-lançamento).
- `player_name` e `position` ficam NULL até a Panini publicar a composição (próximo a 2026-05-01).

### 4.5 Tabela `user_stickers`

A coleção pessoal de cada usuário (linhas lazy: só existem quando o usuário marca algo).

```sql
create table public.user_stickers (
  user_id uuid not null references public.profiles(id) on delete cascade,
  sticker_code text not null references public.stickers(code) on delete cascade,
  owned_count smallint not null default 0 check (owned_count >= 0 and owned_count <= 99),
  is_priority boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, sticker_code)
);

create index user_stickers_user_owned_idx on public.user_stickers (user_id, owned_count);
create index user_stickers_dupes_idx on public.user_stickers (sticker_code) where owned_count >= 2;
create index user_stickers_missing_idx on public.user_stickers (sticker_code) where owned_count = 0;
create index user_stickers_priority_idx on public.user_stickers (user_id) where is_priority;
```

**Semântica dos filtros do álbum:**

| Filtro UI | Condição |
|---|---|
| Todas | todas as 994 linhas de `stickers` (LEFT JOIN com `user_stickers`) |
| Faltando | linha inexistente OU `owned_count = 0` |
| Tenho | `owned_count >= 1` |
| Repetidas | `owned_count >= 2` |
| Prioridade | `is_priority = true` |

### 4.6 Tabela `chats`

Conversa 1:1 entre dois usuários.

```sql
create table public.chats (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  check (user_a < user_b),
  unique (user_a, user_b)
);

create index chats_user_a_idx on public.chats (user_a, last_message_at desc);
create index chats_user_b_idx on public.chats (user_b, last_message_at desc);
```

**Invariante:** `user_a < user_b` (uuid ordenado lexicograficamente). Garante unicidade do par sem duplicar (A,B) e (B,A). A função `open_chat()` (seção 4.9) ordena antes de inserir.

### 4.7 Tabela `messages`

Mensagens trocadas dentro de um chat.

```sql
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index messages_chat_created_idx on public.messages (chat_id, created_at desc);
create index messages_unread_idx on public.messages (chat_id) where read_at is null;
```

**Trigger:** após `INSERT`, atualiza `chats.last_message_at = now()`.

### 4.8 Trigger genérico `set_updated_at`

```sql
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger user_stickers_set_updated_at
  before update on public.user_stickers
  for each row execute function public.set_updated_at();
```

### 4.9 RPC `open_chat(other_user uuid)`

Cria (ou retorna existente) um chat entre o usuário atual e outro. Garante ordenação `user_a < user_b`.

```sql
create or replace function public.open_chat(other_user uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  a uuid;
  b uuid;
  chat_id uuid;
begin
  if me is null then
    raise exception 'not authenticated';
  end if;
  if me = other_user then
    raise exception 'cannot open chat with self';
  end if;
  if not exists (select 1 from profiles where id = other_user) then
    raise exception 'other user not found';
  end if;

  if me < other_user then
    a := me; b := other_user;
  else
    a := other_user; b := me;
  end if;

  insert into chats (user_a, user_b)
  values (a, b)
  on conflict (user_a, user_b) do update set last_message_at = chats.last_message_at
  returning id into chat_id;

  return chat_id;
end $$;
```

### 4.10 RPC `find_matches(p_radius_km, p_limit, p_search, p_state)`

Coração do **Explorar**. Cruza repetidas do usuário atual com faltantes do outro e vice-versa, ponderado por distância.

```sql
create or replace function public.find_matches(
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
  if me is null then raise exception 'not authenticated'; end if;

  select location into my_location from profiles where id = me;
  if my_location is null then
    raise exception 'set your location before exploring';
  end if;

  return query
  with my_dupes as (
    select sticker_code from user_stickers where user_id = me and owned_count >= 2
  ),
  my_missing as (
    select s.code as sticker_code
    from stickers s
    left join user_stickers us on us.user_id = me and us.sticker_code = s.code
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
    from profiles p
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
          select 1 from user_stickers other_us
          where other_us.user_id = c.id
            and other_us.sticker_code = md.sticker_code
            and other_us.owned_count >= 1
        )
      ) as i_can_give_raw,
      (
        select count(*) from my_missing mm
        join user_stickers other_us
          on other_us.user_id = c.id
         and other_us.sticker_code = mm.sticker_code
        where other_us.owned_count >= 2
      ) as i_can_get_raw
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
    s.i_can_give_raw::int,
    s.i_can_get_raw::int,
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
```

**Fórmula do score:**
```
match_score = min(i_can_give, i_can_get) / (1 + distance_km / 10)
```
- 10 trocas mútuas a 0 km → score 10.00.
- 10 trocas mútuas a 50 km → score ~1.67.
- 10 trocas mútuas a 100 km → score ~0.91.

Iterações futuras: ajustar peso da distância, considerar prioridade, decay temporal de atividade.

---

## 5. Row-Level Security (políticas detalhadas)

### 5.1 `profiles` — leitura pública, escrita só do dono

```sql
alter table public.profiles enable row level security;

create policy "profiles read all"
  on public.profiles for select using (true);

create policy "profiles insert self"
  on public.profiles for insert with check (auth.uid() = id);

create policy "profiles update self"
  on public.profiles for update using (auth.uid() = id);
```

A coluna `location` é exposta a todos — proteger via **view pública** `public_profiles` que omite `location`:

```sql
create view public.public_profiles
with (security_invoker = on) as
select id, username, full_name, avatar_url, bio, city, state, is_premium, created_at
from public.profiles;
```

Aplicações leem `public_profiles`. A `location` só é tocada pelas RPCs `SECURITY DEFINER`.

### 5.2 `teams`, `stickers` — leitura pública, escrita só por migration

```sql
alter table public.teams enable row level security;
alter table public.stickers enable row level security;

create policy "teams read all" on public.teams for select using (true);
create policy "stickers read all" on public.stickers for select using (true);
-- nenhuma policy de INSERT/UPDATE/DELETE — só service_role
```

### 5.3 `user_stickers` — só dono

```sql
alter table public.user_stickers enable row level security;

create policy "user_stickers own select"
  on public.user_stickers for select using (auth.uid() = user_id);

create policy "user_stickers own write"
  on public.user_stickers for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

`find_matches` roda como `SECURITY DEFINER` e burla a RLS de leitura para calcular o score sem vazar quais cromos cada um tem.

### 5.4 `chats` — só participantes

```sql
alter table public.chats enable row level security;

create policy "chats read participant"
  on public.chats for select using (auth.uid() in (user_a, user_b));

-- INSERT só via RPC open_chat (que é SECURITY DEFINER)
revoke insert on public.chats from authenticated;
```

### 5.5 `messages` — participantes leem, sender escreve

```sql
alter table public.messages enable row level security;

create policy "messages read participant"
  on public.messages for select using (
    exists (
      select 1 from chats c
      where c.id = chat_id and auth.uid() in (c.user_a, c.user_b)
    )
  );

create policy "messages send participant"
  on public.messages for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from chats c
      where c.id = chat_id and auth.uid() in (c.user_a, c.user_b)
    )
  );

create policy "messages mark read"
  on public.messages for update using (
    exists (
      select 1 from chats c
      where c.id = chat_id and auth.uid() in (c.user_a, c.user_b)
    )
  ) with check (sender_id <> auth.uid()); -- só marca como lida se não é o remetente
```

### 5.6 Storage `avatars`

```sql
-- bucket "avatars" público para leitura
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);

create policy "avatar upload own"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "avatar update own"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "avatar read public"
  on storage.objects for select using (bucket_id = 'avatars');
```

Convenção: `avatars/{user_id}/avatar.jpg`.

---

## 6. Realtime

Canal por chat. Front se inscreve no INSERT de `messages` filtrado por `chat_id`:

```ts
supabase
  .channel(`chat:${chatId}`)
  .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
      handleNewMessage)
  .subscribe();
```

RLS de `messages` garante que o cliente só recebe mensagens de chats em que participa.

---

## 7. Fluxos críticos

### 7.1 Onboarding
1. Usuário cria conta (email/senha ou Google).
2. Trigger `auth.users` → cria `profiles` com `username` derivado do email + sufixo aleatório.
3. Tela de boas-vindas pede: `full_name`, `username` (editável), localização (pede permissão GPS) e ao menos 1 figurinha.
4. Progresso `Primeiros passos (2/3)` da home reflete: perfil completo, localização salva, ≥1 cromo registrado.

### 7.2 Marcar figurinha no álbum
1. UI mostra grid 60 cromos/página (17 páginas para 994).
2. Tap em cromo abre detalhe: `Tenho 0/1/+`, toggle Prioridade.
3. Server Action faz `UPSERT` em `user_stickers` com `owned_count` e `is_priority`.
4. Panorama agregado recalcula via query: `SELECT count(*) FILTER (WHERE owned_count >= 1) FROM user_stickers WHERE user_id = me`.

### 7.3 Encontrar match
1. `/explorar` chama `find_matches(radius, limit, search, state)`.
2. Cliente recebe lista ordenada por `match_score`.
3. Cada card mostra: nome, cidade, distância, `i_can_give`/`i_can_get`, score.
4. Botão "Conversar" → chama RPC `open_chat(other_user)` → redireciona para `/chat/{id}`.

### 7.4 Chat
1. `/chat` lista conversas: JOIN `chats` × último `messages` × outro `profiles`.
2. `/chat/{id}` carrega últimas 50 mensagens, paginação infinita ao rolar pra cima.
3. INSERT em `messages` via Server Action.
4. Realtime entrega para o outro lado.
5. Ao abrir chat, `UPDATE messages SET read_at = now() WHERE chat_id = $1 AND sender_id <> auth.uid() AND read_at IS NULL`.

---

## 8. Considerações operacionais

| Tópico | Decisão |
|---|---|
| Backups | Default Supabase (PITR no Pro; free tem snapshot diário) — sem ação |
| Custo | v1 cabe no free tier do Supabase (500MB DB, 1GB Storage, 50k MAU) |
| PostGIS | Grátis, já incluso no Supabase |
| Migrações | Aplicadas via Supabase MCP (`apply_migration`); versionadas em `supabase/migrations/` |
| Tipos TypeScript | Gerados via `supabase gen types typescript --project-id <id> > src/types/supabase.ts` |
| Privacidade | `location` exata fica server-side; cliente só recebe `distance_km` arredondado |
| LGPD | Dados pessoais: nome, email, cidade, GPS. Política de privacidade em página dedicada (v1.1) |
| Rate limits | Padrão Supabase. Função `find_matches` com `LIMIT` para não escalar |
| Observabilidade | Vercel Analytics + Supabase Dashboard. Logs de Server Actions via `console.log` (Vercel logs) |

---

## 9. Roadmap pós-MVP (referência, fora de escopo desta spec)

- **v1.1:** Notificações push (Web Push API), policy de denúncia/bloqueio, política de privacidade.
- **v2 — Premium:** PIX via Stripe/PagSeguro, cupons de indicação, cashback R$ 5,00.
- **v2.1 — Propostas formais:** tabela `trades` com estados (proposed/accepted/cancelled/completed), histórico de trocas.
- **v3:** App nativo (React Native/Expo), reputação, badges, integração com escaneamento de cromos.

---

## 10. Critérios de aceitação do MVP

- [ ] Cadastro e login funcionando (email/senha + Google).
- [ ] Usuário consegue setar localização via GPS e ver "Cidade, UF" no perfil.
- [ ] Álbum exibe 994 figurinhas com filtros Todas / Faltando / Tenho / Repetidas / Prioridade funcionando.
- [ ] Panorama do álbum mostra contagens corretas em tempo real.
- [ ] Explorar retorna lista ordenada por match_score quando há candidatos no raio.
- [ ] Filtros de Explorar: raio, estado, busca textual.
- [ ] Chat 1:1 funciona com Realtime (mensagem aparece sem refresh).
- [ ] Marca como lida ao abrir.
- [ ] Logout limpa sessão.
- [ ] RLS bloqueia acesso a dados de terceiros (testado com supabase-js + token de outro user).
- [ ] PWA instalável no iOS Safari e Chrome Android.
- [ ] Lighthouse ≥ 90 em Performance/Accessibility/Best Practices na home.
