-- A publication 'supabase_realtime' já existe por default no Supabase.
-- Adiciona apenas INSERT events em trocas_messages (não precisa de UPDATE/DELETE
-- pra MVP — read_at é fetchado quando o cliente abre a thread).
alter publication supabase_realtime add table public.trocas_messages;
