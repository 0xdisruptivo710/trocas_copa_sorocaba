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

-- Seed FWC (0..19)
insert into public.trocas_stickers (code, team_code, number)
select 'FWC-' || n::text, 'FWC', n
from generate_series(0, 19) as g(n);

-- Seed all teams (1..20)
insert into public.trocas_stickers (code, team_code, number)
select t.code || '-' || n::text, t.code, n
from public.trocas_teams t
cross join generate_series(1, 20) as g(n)
where t.kind = 'team';

-- Seed Coca-Cola (1..14)
insert into public.trocas_stickers (code, team_code, number)
select 'CC-' || n::text, 'CC', n
from generate_series(1, 14) as g(n);
