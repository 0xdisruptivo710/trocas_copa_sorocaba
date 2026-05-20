alter table public.trocas_profiles enable row level security;

create policy "trocas_profiles read all"
  on public.trocas_profiles for select using (true);

create policy "trocas_profiles insert self"
  on public.trocas_profiles for insert with check (auth.uid() = id);

create policy "trocas_profiles update self"
  on public.trocas_profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Public-safe view (omits location, location_updated_at, updated_at)
create view public.trocas_public_profiles
with (security_invoker = on) as
select
  id, username, full_name, avatar_url, bio, city, state, is_premium, created_at
from public.trocas_profiles;

grant select on public.trocas_public_profiles to anon, authenticated;
