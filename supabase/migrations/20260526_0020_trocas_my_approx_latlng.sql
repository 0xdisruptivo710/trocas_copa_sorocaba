-- Retorna lat/lng do user logado, snap a ~500m de grade (mesma obfuscação
-- usada pelos pins de outros users em find_matches). Usado pra centrar o mapa
-- no /explorar.

create or replace function public.trocas_my_approx_latlng()
returns table(lat double precision, lng double precision)
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  loc geography;
begin
  if me is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select location into loc from trocas_profiles where id = me;

  if loc is null then
    return query select null::double precision, null::double precision;
  else
    return query select
      st_y(st_snaptogrid(loc::geometry, 0.005))::double precision,
      st_x(st_snaptogrid(loc::geometry, 0.005))::double precision;
  end if;
end $$;

revoke execute on function public.trocas_my_approx_latlng() from public, anon;
grant execute on function public.trocas_my_approx_latlng() to authenticated;
