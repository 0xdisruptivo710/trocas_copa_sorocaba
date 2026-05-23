create or replace function public.trocas_open_chat(other_user uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  a uuid;
  b uuid;
  chat_id uuid;
begin
  if me is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if me = other_user then
    raise exception 'cannot open chat with self' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.trocas_profiles where id = other_user) then
    raise exception 'other user not found' using errcode = 'P0002';
  end if;

  if me < other_user then
    a := me; b := other_user;
  else
    a := other_user; b := me;
  end if;

  insert into public.trocas_chats (user_a, user_b)
  values (a, b)
  on conflict (user_a, user_b) do update set last_message_at = trocas_chats.last_message_at
  returning id into chat_id;

  return chat_id;
end $$;

revoke execute on function public.trocas_open_chat(uuid) from public, anon;
grant execute on function public.trocas_open_chat(uuid) to authenticated;
