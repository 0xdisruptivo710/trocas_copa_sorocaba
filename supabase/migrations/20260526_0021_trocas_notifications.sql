-- Notificações in-app: bell icon no header com badge unread.
--
-- Cobertura MVP:
--   - 'message'         → nova mensagem recebida
--   - 'proposal_new'    → recebeu uma proposta de troca
--   - 'proposal_reply'  → sua proposta foi aceita/rejeitada
--   - 'trade_completed' → troca confirmada pelos dois (futuro hook)
--
-- Realtime: tabela publicada em supabase_realtime; cliente subscreve
-- INSERT filtrado por user_id = auth.uid().

do $$
begin
  if not exists (select 1 from pg_type where typname = 'trocas_notification_kind') then
    create type trocas_notification_kind as enum (
      'message',
      'proposal_new',
      'proposal_reply',
      'trade_completed'
    );
  end if;
end $$;

create table public.trocas_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.trocas_profiles(id) on delete cascade,
  kind trocas_notification_kind not null,
  chat_id uuid references public.trocas_chats(id) on delete cascade,
  actor_id uuid references public.trocas_profiles(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index trocas_notifications_user_unread_idx
  on public.trocas_notifications (user_id, created_at desc)
  where read_at is null;
create index trocas_notifications_user_idx
  on public.trocas_notifications (user_id, created_at desc);

alter table public.trocas_notifications enable row level security;

create policy "trocas_notifications read mine"
  on public.trocas_notifications for select
  using (auth.uid() = user_id);

create policy "trocas_notifications update mine read_at"
  on public.trocas_notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- INSERT só via trigger / RPC. DELETE não exposto.
revoke insert, delete on public.trocas_notifications from public, anon, authenticated;

-- ============================================================
-- Trigger: nova mensagem cria notificação pro destinatário
-- ============================================================

create or replace function public.trocas_notify_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient uuid;
  chat_row record;
  notif_kind trocas_notification_kind;
begin
  -- Se há bloqueio em qualquer direção, NÃO cria notif.
  select * into chat_row from public.trocas_chats where id = new.chat_id;
  if chat_row is null then return new; end if;

  if public.trocas_blocked_pair(chat_row.user_a, chat_row.user_b) then
    return new;
  end if;

  recipient := case
    when new.sender_id = chat_row.user_a then chat_row.user_b
    else chat_row.user_a
  end;

  notif_kind := case
    when new.kind = 'proposal' then 'proposal_new'::trocas_notification_kind
    else 'message'::trocas_notification_kind
  end;

  insert into public.trocas_notifications (user_id, kind, chat_id, actor_id, payload)
  values (
    recipient,
    notif_kind,
    new.chat_id,
    new.sender_id,
    jsonb_build_object(
      'message_id', new.id,
      'preview', left(coalesce(new.body, ''), 80)
    )
  );

  return new;
end $$;

create trigger trocas_messages_notify
  after insert on public.trocas_messages
  for each row execute function public.trocas_notify_on_message();

-- ============================================================
-- RPC: marcar como lida (uma ou todas)
-- ============================================================

create or replace function public.trocas_mark_notification_read(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  update public.trocas_notifications
    set read_at = now()
    where id = p_id and user_id = me and read_at is null;
end $$;

revoke execute on function public.trocas_mark_notification_read(uuid) from public, anon;
grant execute on function public.trocas_mark_notification_read(uuid) to authenticated;

create or replace function public.trocas_mark_all_notifications_read()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  n int;
begin
  if me is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  with updated as (
    update public.trocas_notifications
      set read_at = now()
      where user_id = me and read_at is null
      returning 1
  )
  select count(*) into n from updated;
  return coalesce(n, 0);
end $$;

revoke execute on function public.trocas_mark_all_notifications_read() from public, anon;
grant execute on function public.trocas_mark_all_notifications_read() to authenticated;

-- ============================================================
-- Realtime
-- ============================================================

alter publication supabase_realtime add table public.trocas_notifications;
alter table public.trocas_notifications replica identity full;
