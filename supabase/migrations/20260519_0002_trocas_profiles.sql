-- All TrocasCopa tables are prefixed with trocas_ to coexist with other apps
-- sharing this Supabase project.

create table public.trocas_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (username ~ '^[a-z0-9_]{3,30}$'),
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

create index trocas_profiles_location_gix on public.trocas_profiles using gist (location);
create index trocas_profiles_state_idx on public.trocas_profiles (state);
create index trocas_profiles_username_lower_idx on public.trocas_profiles (lower(username));

create or replace function public.trocas_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger trocas_profiles_set_updated_at
  before update on public.trocas_profiles
  for each row execute function public.trocas_set_updated_at();
