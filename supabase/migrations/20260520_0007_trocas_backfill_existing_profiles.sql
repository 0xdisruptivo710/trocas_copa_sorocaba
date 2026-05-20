-- Backfill trocas_profiles for users that existed before the trigger was installed.
-- This Supabase project is shared with other apps, so there were ~50 users in
-- auth.users when trocas_handle_new_user was deployed. Without backfill, those
-- users have no profile row and the /onboarding flow can't progress (the
-- UPDATE in updateProfileAction touches 0 rows).
--
-- Also makes trocas_handle_new_user idempotent (ON CONFLICT DO NOTHING) for
-- safety on re-runs.

do $$
declare
  u record;
  base_username text;
  candidate text;
  suffix int;
begin
  for u in
    select id, email, raw_user_meta_data
    from auth.users
    where id not in (select id from public.trocas_profiles)
  loop
    base_username := lower(regexp_replace(split_part(coalesce(u.email, ''), '@', 1), '[^a-z0-9_]', '', 'g'));
    if char_length(base_username) < 3 then
      base_username := 'user' || substr(u.id::text, 1, 6);
    elsif char_length(base_username) > 26 then
      base_username := substr(base_username, 1, 26);
    end if;

    candidate := base_username;
    suffix := 0;
    while exists (select 1 from public.trocas_profiles where username = candidate) loop
      suffix := suffix + 1;
      candidate := base_username || suffix::text;
    end loop;

    insert into public.trocas_profiles (id, username, full_name)
    values (
      u.id,
      candidate,
      coalesce(
        u.raw_user_meta_data->>'full_name',
        u.raw_user_meta_data->>'name',
        candidate
      )
    )
    on conflict (id) do nothing;
  end loop;
end $$;

create or replace function public.trocas_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  candidate text;
  suffix int := 0;
begin
  base_username := lower(regexp_replace(split_part(coalesce(new.email, ''), '@', 1), '[^a-z0-9_]', '', 'g'));
  if char_length(base_username) < 3 then
    base_username := 'user' || substr(new.id::text, 1, 6);
  elsif char_length(base_username) > 26 then
    base_username := substr(base_username, 1, 26);
  end if;

  candidate := base_username;

  while exists (select 1 from public.trocas_profiles where username = candidate) loop
    suffix := suffix + 1;
    candidate := base_username || suffix::text;
  end loop;

  insert into public.trocas_profiles (id, username, full_name)
  values (
    new.id,
    candidate,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      candidate
    )
  )
  on conflict (id) do nothing;

  return new;
end $$;
