-- Moderação: bloqueios e reportes.
--
-- trocas_blocks: relação direcional (blocker -> blocked). A presença do bloqueio
-- esconde a OUTRA pessoa em find_matches e impede open_chat / messages — em
-- ambas as direções (basta um dos dois ter bloqueado pra cortar contato).
--
-- trocas_reports: histórico de denúncias. Não modera automaticamente — só
-- registra pra revisão manual via SQL. Reason é enum fechado pra facilitar
-- relatório agregado depois.

-- ============================================================
-- Enums
-- ============================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'trocas_report_reason') then
    create type trocas_report_reason as enum (
      'spam',
      'assedio',
      'fraude_troca',
      'conteudo_improprio',
      'perfil_falso',
      'menor_de_idade',
      'outro'
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'trocas_report_status') then
    create type trocas_report_status as enum (
      'open',
      'reviewing',
      'resolved',
      'dismissed'
    );
  end if;
end $$;

-- ============================================================
-- trocas_blocks
-- ============================================================

create table public.trocas_blocks (
  blocker_id uuid not null references public.trocas_profiles(id) on delete cascade,
  blocked_id uuid not null references public.trocas_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index trocas_blocks_blocked_idx on public.trocas_blocks (blocked_id);

alter table public.trocas_blocks enable row level security;

-- O usuário só vê os próprios bloqueios (quem ele bloqueou).
-- Não expõe a lista de "quem te bloqueou" — isso é por design.
create policy "trocas_blocks read mine"
  on public.trocas_blocks for select
  using (auth.uid() = blocker_id);

-- INSERT / DELETE só via RPC (security definer).
revoke insert, update, delete on public.trocas_blocks from public, anon, authenticated;

-- ============================================================
-- trocas_reports
-- ============================================================

create table public.trocas_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.trocas_profiles(id) on delete cascade,
  reported_id uuid not null references public.trocas_profiles(id) on delete cascade,
  reason trocas_report_reason not null,
  details text check (details is null or char_length(details) <= 1000),
  context_chat_id uuid references public.trocas_chats(id) on delete set null,
  status trocas_report_status not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  check (reporter_id <> reported_id)
);

create index trocas_reports_reported_idx on public.trocas_reports (reported_id, created_at desc);
create index trocas_reports_status_idx on public.trocas_reports (status, created_at desc) where status in ('open','reviewing');

alter table public.trocas_reports enable row level security;

-- Reporter vê os próprios reportes (pra eventualmente mostrar "denúncia enviada").
create policy "trocas_reports read mine"
  on public.trocas_reports for select
  using (auth.uid() = reporter_id);

-- INSERT via RPC apenas.
revoke insert, update, delete on public.trocas_reports from public, anon, authenticated;

-- ============================================================
-- Helper: existe bloqueio em qualquer direção entre dois users?
-- ============================================================

create or replace function public.trocas_blocked_pair(p_a uuid, p_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.trocas_blocks
    where (blocker_id = p_a and blocked_id = p_b)
       or (blocker_id = p_b and blocked_id = p_a)
  );
$$;

revoke execute on function public.trocas_blocked_pair(uuid, uuid) from public, anon;
grant execute on function public.trocas_blocked_pair(uuid, uuid) to authenticated;

-- ============================================================
-- RPC: bloquear / desbloquear
-- ============================================================

create or replace function public.trocas_block_user(p_other uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if me = p_other then
    raise exception 'cannot block self' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.trocas_profiles where id = p_other) then
    raise exception 'user not found' using errcode = 'P0002';
  end if;

  insert into public.trocas_blocks (blocker_id, blocked_id)
  values (me, p_other)
  on conflict (blocker_id, blocked_id) do nothing;
end $$;

revoke execute on function public.trocas_block_user(uuid) from public, anon;
grant execute on function public.trocas_block_user(uuid) to authenticated;

create or replace function public.trocas_unblock_user(p_other uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  delete from public.trocas_blocks
  where blocker_id = me and blocked_id = p_other;
end $$;

revoke execute on function public.trocas_unblock_user(uuid) from public, anon;
grant execute on function public.trocas_unblock_user(uuid) to authenticated;

-- ============================================================
-- RPC: reportar
-- ============================================================

create or replace function public.trocas_report_user(
  p_other uuid,
  p_reason trocas_report_reason,
  p_details text default null,
  p_chat_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  report_id uuid;
begin
  if me is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if me = p_other then
    raise exception 'cannot report self' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.trocas_profiles where id = p_other) then
    raise exception 'user not found' using errcode = 'P0002';
  end if;

  -- Se context_chat_id veio, verifica que o user faz parte do chat
  if p_chat_id is not null and not exists (
    select 1 from public.trocas_chats
    where id = p_chat_id and me in (user_a, user_b)
  ) then
    raise exception 'not a participant of chat' using errcode = '42501';
  end if;

  insert into public.trocas_reports (reporter_id, reported_id, reason, details, context_chat_id)
  values (me, p_other, p_reason, nullif(trim(p_details), ''), p_chat_id)
  returning id into report_id;

  return report_id;
end $$;

revoke execute on function public.trocas_report_user(uuid, trocas_report_reason, text, uuid) from public, anon;
grant execute on function public.trocas_report_user(uuid, trocas_report_reason, text, uuid) to authenticated;

-- ============================================================
-- View: lista de bloqueados com profile join
-- ============================================================

create or replace view public.trocas_my_blocks as
select
  b.blocker_id,
  b.blocked_id,
  b.created_at,
  p.username,
  p.full_name,
  p.avatar_url,
  p.city,
  p.state
from public.trocas_blocks b
join public.trocas_profiles p on p.id = b.blocked_id;

-- A view herda o RLS da tabela base. RLS de trocas_blocks limita ao próprio
-- usuário (blocker_id = auth.uid()), então isso é seguro.
grant select on public.trocas_my_blocks to authenticated;

-- ============================================================
-- Atualiza find_matches: filtra blocks (em qualquer direção)
-- ============================================================

drop function if exists public.trocas_find_matches(numeric, int, text, text, boolean);

create or replace function public.trocas_find_matches(
  p_radius_km numeric default 50,
  p_limit int default 50,
  p_search text default null,
  p_state text default null,
  p_only_with_matches boolean default true
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
  has_my_location boolean;
begin
  if me is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select location into my_location from trocas_profiles where id = me;
  has_my_location := my_location is not null;

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
  blocked_ids as (
    -- quem eu bloqueei OU quem me bloqueou
    select blocked_id as id from trocas_blocks where blocker_id = me
    union
    select blocker_id as id from trocas_blocks where blocked_id = me
  ),
  candidates as (
    select
      p.id,
      p.username,
      p.full_name,
      p.avatar_url,
      p.city,
      p.state,
      p.created_at,
      case
        when has_my_location and p.location is not null
        then round((st_distance(p.location, my_location) / 1000.0)::numeric, 1)
        else null
      end as distance_km
    from trocas_profiles p
    where p.id <> me
      and p.id not in (select id from blocked_ids)
      and (p_state is null or p.state = p_state)
      and (
        p_search is null
        or p.username ilike '%' || p_search || '%'
        or p.full_name ilike '%' || p_search || '%'
      )
      and (
        not has_my_location
        or p.location is null
        or st_dwithin(p.location, my_location, p_radius_km * 1000)
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
      c.created_at,
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
    case
      when least(s.i_can_give_raw, s.i_can_get_raw) = 0 then 0
      when s.distance_km is null then least(s.i_can_give_raw, s.i_can_get_raw)::numeric
      else round(
        least(s.i_can_give_raw, s.i_can_get_raw)::numeric
        / (1 + s.distance_km / 10.0),
        2
      )
    end as match_score
  from scored s
  where (not p_only_with_matches) or least(s.i_can_give_raw, s.i_can_get_raw) > 0
  order by
    case when p_only_with_matches then
      case
        when least(s.i_can_give_raw, s.i_can_get_raw) = 0 then 0
        when s.distance_km is null then least(s.i_can_give_raw, s.i_can_get_raw)::numeric
        else round(
          least(s.i_can_give_raw, s.i_can_get_raw)::numeric
          / (1 + s.distance_km / 10.0),
          2
        )
      end
    else null end desc nulls last,
    case when not p_only_with_matches then s.distance_km else null end asc nulls last,
    s.created_at desc
  limit p_limit;
end $$;

revoke execute on function public.trocas_find_matches(numeric, int, text, text, boolean) from public, anon;
grant execute on function public.trocas_find_matches(numeric, int, text, text, boolean) to authenticated;

-- ============================================================
-- Atualiza open_chat: falha se há bloqueio em qualquer direção
-- ============================================================

create or replace function public.trocas_open_chat(other_user uuid)
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
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if me = other_user then
    raise exception 'cannot open chat with self' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.trocas_profiles where id = other_user) then
    raise exception 'other user not found' using errcode = 'P0002';
  end if;

  if public.trocas_blocked_pair(me, other_user) then
    raise exception 'blocked' using errcode = 'P0003';
  end if;

  if me < other_user then
    a := me; b := other_user;
  else
    a := other_user; b := me;
  end if;

  insert into public.trocas_chats (user_a, user_b)
  values (a, b)
  on conflict (user_a, user_b) do update set last_message_at = trocas_chats.last_message_at
  returning id into chat_id;

  return chat_id;
end $$;

revoke execute on function public.trocas_open_chat(uuid) from public, anon;
grant execute on function public.trocas_open_chat(uuid) to authenticated;

-- ============================================================
-- Atualiza RLS de messages.insert: bloqueia envio se há bloqueio ativo
-- ============================================================

drop policy if exists "trocas_messages send as self" on public.trocas_messages;

create policy "trocas_messages send as self"
  on public.trocas_messages for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.trocas_chats c
      where c.id = chat_id
        and auth.uid() in (c.user_a, c.user_b)
        and not public.trocas_blocked_pair(c.user_a, c.user_b)
    )
  );
