-- Boost "Destaque no Explorar": tabela + RLS + RPC de concessão +
-- ampliação do CHECK de product + recriação de trocas_find_matches.

-- 1) Tabela de boosts (PK user_id+kind => 1 linha por tipo; empilhar = UPDATE)
create table if not exists public.trocas_boosts (
  user_id    uuid        not null references public.trocas_profiles(id) on delete cascade,
  kind       text        not null check (kind in ('destaque')),
  expires_at timestamptz not null,
  charge_id  text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, kind)
);

alter table public.trocas_boosts enable row level security;
drop policy if exists "own boosts: select" on public.trocas_boosts;
create policy "own boosts: select" on public.trocas_boosts
  for select using (user_id = auth.uid());
-- sem policy de insert/update/delete => escrita só via service-role (markChargePaid)

-- 2) Ampliar o CHECK de product (hoje só aceita 'premium')
alter table public.trocas_billing drop constraint if exists trocas_billing_product_check;
alter table public.trocas_billing add constraint trocas_billing_product_check
  check (product in ('premium', 'boost_destaque'));

-- 3) Concessão atômica com empilhamento
create or replace function public.trocas_grant_boost(
  p_user_id uuid, p_kind text, p_days int, p_charge_id text
) returns void language sql security definer set search_path = public as $$
  insert into public.trocas_boosts (user_id, kind, expires_at, charge_id)
  values (p_user_id, p_kind, now() + make_interval(days => p_days), p_charge_id)
  on conflict (user_id, kind) do update set
    expires_at = greatest(public.trocas_boosts.expires_at, now()) + make_interval(days => p_days),
    charge_id  = excluded.charge_id,
    updated_at = now();
$$;

-- 4) Recriar trocas_find_matches adicionando is_boosted (destacado-no-topo)
-- DROP obrigatório: CREATE OR REPLACE não pode mudar o tipo de retorno (estamos
-- acrescentando a coluna is_boosted ao RETURNS TABLE). DROP+CREATE roda atômico
-- dentro da transação da migration.
drop function if exists public.trocas_find_matches(numeric, integer, text, text, boolean);
create function public.trocas_find_matches(
  p_radius_km numeric default 50, p_limit integer default 50,
  p_search text default null, p_state text default null,
  p_only_with_matches boolean default true)
returns table(other_user uuid, username text, full_name text, avatar_url text,
  city text, state character, distance_km numeric, i_can_give integer,
  i_can_get integer, match_score numeric, lat_approx double precision,
  lng_approx double precision, is_boosted boolean)
language plpgsql security definer set search_path to 'public' as $function$
declare
  me uuid := auth.uid();
  my_location geography;
  has_my_location boolean;
begin
  if me is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  select location into my_location from trocas_profiles where id = me;
  has_my_location := my_location is not null;

  return query
  with my_dupes as (
    select sticker_code from trocas_user_stickers where user_id = me and owned_count >= 2
  ),
  my_missing as (
    select s.code as sticker_code from trocas_stickers s
    left join trocas_user_stickers us on us.user_id = me and us.sticker_code = s.code
    where coalesce(us.owned_count, 0) = 0
  ),
  blocked_ids as (
    select blocked_id as id from trocas_blocks where blocker_id = me
    union
    select blocker_id as id from trocas_blocks where blocked_id = me
  ),
  candidates as (
    select p.id, p.username, p.full_name, p.avatar_url, p.city, p.state, p.created_at, p.location,
      case when has_my_location and p.location is not null
        then round((st_distance(p.location, my_location) / 1000.0)::numeric, 1)
        else null end as distance_km
    from trocas_profiles p
    where p.id <> me
      and p.id not in (select id from blocked_ids)
      and (p_state is null or p.state = p_state)
      and (p_search is null or p.username ilike '%' || p_search || '%' or p.full_name ilike '%' || p_search || '%')
      and (not has_my_location or p.location is null or st_dwithin(p.location, my_location, p_radius_km * 1000))
  ),
  scored as (
    select c.id, c.username, c.full_name, c.avatar_url, c.city, c.state, c.distance_km, c.created_at, c.location,
      (select count(*) from my_dupes md
        where not exists (
          select 1 from trocas_user_stickers other_us
          where other_us.user_id = c.id and other_us.sticker_code = md.sticker_code and other_us.owned_count >= 1
        ))::int as i_can_give_raw,
      (select count(*) from my_missing mm
        join trocas_user_stickers other_us on other_us.user_id = c.id and other_us.sticker_code = mm.sticker_code
        where other_us.owned_count >= 2)::int as i_can_get_raw
    from candidates c
  )
  select s.id, s.username, s.full_name, s.avatar_url, s.city, s.state, s.distance_km,
    s.i_can_give_raw, s.i_can_get_raw,
    case
      when least(s.i_can_give_raw, s.i_can_get_raw) = 0 then 0
      when s.distance_km is null then least(s.i_can_give_raw, s.i_can_get_raw)::numeric
      else round(least(s.i_can_give_raw, s.i_can_get_raw)::numeric / (1 + s.distance_km / 10.0), 2)
    end as match_score,
    case when s.location is not null then st_y(st_snaptogrid(s.location::geometry, 0.005)) else null end as lat_approx,
    case when s.location is not null then st_x(st_snaptogrid(s.location::geometry, 0.005)) else null end as lng_approx,
    exists (select 1 from trocas_boosts b
            where b.user_id = s.id and b.kind = 'destaque' and b.expires_at > now()) as is_boosted
  from scored s
  where (not p_only_with_matches) or least(s.i_can_give_raw, s.i_can_get_raw) > 0
  order by
    exists (select 1 from trocas_boosts b
            where b.user_id = s.id and b.kind = 'destaque' and b.expires_at > now()) desc,
    case when p_only_with_matches then
      case
        when least(s.i_can_give_raw, s.i_can_get_raw) = 0 then 0
        when s.distance_km is null then least(s.i_can_give_raw, s.i_can_get_raw)::numeric
        else round(least(s.i_can_give_raw, s.i_can_get_raw)::numeric / (1 + s.distance_km / 10.0), 2)
      end
    else null end desc nulls last,
    case when not p_only_with_matches then s.distance_km else null end asc nulls last,
    s.created_at desc
  limit p_limit;
end $function$;
