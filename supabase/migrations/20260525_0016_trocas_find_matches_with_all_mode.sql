-- Atualiza trocas_find_matches: adiciona parâmetro p_only_with_matches
-- (default true). Quando false, retorna TODOS colecionadores (com ou sem
-- cromos batendo) — usado pela aba "Todos" no /explorar.
--
-- Também: distância vira nullable (NULL quando user logado não tem location
-- OU quando candidato não tem location) — permite mostrar users novos
-- mesmo antes deles completarem onboarding.
--
-- Drop+create porque a assinatura mudou (Postgres não permite alterar arg).

drop function if exists public.trocas_find_matches(numeric, int, text, text);

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
      and (p_state is null or p.state = p_state)
      and (
        p_search is null
        or p.username ilike '%' || p_search || '%'
        or p.full_name ilike '%' || p_search || '%'
      )
      -- Filtro de distância só quando ambos têm localização
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
