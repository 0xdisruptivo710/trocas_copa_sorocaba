-- Public bucket for user avatars. Path convention: {user_id}/avatar.{ext}

insert into storage.buckets (id, name, public)
values ('trocas-avatars', 'trocas-avatars', true)
on conflict (id) do nothing;

create policy "trocas-avatars read public"
  on storage.objects for select using (bucket_id = 'trocas-avatars');

create policy "trocas-avatars upload own"
  on storage.objects for insert
  with check (
    bucket_id = 'trocas-avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "trocas-avatars update own"
  on storage.objects for update
  using (
    bucket_id = 'trocas-avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "trocas-avatars delete own"
  on storage.objects for delete
  using (
    bucket_id = 'trocas-avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
