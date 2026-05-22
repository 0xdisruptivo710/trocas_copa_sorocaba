-- RPC PostGIS: cruza coleção (dupes/missing) entre o user logado e candidatos
-- num raio de N km, ponderando por distância.
--
-- match_score = min(i_can_give, i_can_get) / (1 + distance_km / 10)

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

-- Não permitir chamadas anônimas; só usuários logados
revoke execute on function public.trocas_find_matches(numeric, int, text, text) from public, anon;
grant execute on function public.trocas_find_matches(numeric, int, text, text) to authenticated;
