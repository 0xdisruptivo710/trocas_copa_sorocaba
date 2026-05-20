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
