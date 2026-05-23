create table public.trocas_chats (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.trocas_profiles(id) on delete cascade,
  user_b uuid not null references public.trocas_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  check (user_a < user_b),
  unique (user_a, user_b)
);

create index trocas_chats_user_a_idx on public.trocas_chats (user_a, last_message_at desc);
create index trocas_chats_user_b_idx on public.trocas_chats (user_b, last_message_at desc);

alter table public.trocas_chats enable row level security;

create policy "trocas_chats read participants"
  on public.trocas_chats for select
  using (auth.uid() in (user_a, user_b));

-- INSERT só via RPC trocas_open_chat (SECURITY DEFINER)
revoke insert, update, delete on public.trocas_chats from public, anon, authenticated;
