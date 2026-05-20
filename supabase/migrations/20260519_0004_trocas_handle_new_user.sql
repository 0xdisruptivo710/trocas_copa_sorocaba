-- Auto-creates a trocas_profiles row whenever a new auth.users row is inserted.
-- Username is derived from email prefix (sanitized, deduped with numeric suffix).

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
  );

  return new;
end $$;

create trigger trocas_on_auth_user_created
  after insert on auth.users
  for each row execute function public.trocas_handle_new_user();
