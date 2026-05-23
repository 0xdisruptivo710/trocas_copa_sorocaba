create table public.trocas_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.trocas_chats(id) on delete cascade,
  sender_id uuid not null references public.trocas_profiles(id),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index trocas_messages_chat_created_idx
  on public.trocas_messages (chat_id, created_at desc);

create index trocas_messages_unread_idx
  on public.trocas_messages (chat_id) where read_at is null;

alter table public.trocas_messages enable row level security;

create policy "trocas_messages read participants"
  on public.trocas_messages for select using (
    exists (
      select 1 from public.trocas_chats c
      where c.id = chat_id and auth.uid() in (c.user_a, c.user_b)
    )
  );

create policy "trocas_messages send as self"
  on public.trocas_messages for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.trocas_chats c
      where c.id = chat_id and auth.uid() in (c.user_a, c.user_b)
    )
  );

create policy "trocas_messages mark read by receiver"
  on public.trocas_messages for update using (
    exists (
      select 1 from public.trocas_chats c
      where c.id = chat_id and auth.uid() in (c.user_a, c.user_b)
    )
  ) with check (sender_id <> auth.uid());

-- Trigger: atualiza chats.last_message_at quando uma msg é inserida
create or replace function public.trocas_bump_chat_last_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.trocas_chats
    set last_message_at = new.created_at
    where id = new.chat_id;
  return new;
end $$;

create trigger trocas_messages_bump_chat
  after insert on public.trocas_messages
  for each row execute function public.trocas_bump_chat_last_message();
