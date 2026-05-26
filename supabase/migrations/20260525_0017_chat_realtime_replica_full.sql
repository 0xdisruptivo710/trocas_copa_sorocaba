-- Bug fix: Supabase Realtime + RLS exige REPLICA IDENTITY FULL pra entregar
-- eventos via postgres_changes. Com IDENTITY DEFAULT (só PK), os eventos
-- de INSERT/UPDATE são silenciosamente descartados pelo broker — mensagens
-- de chat só aparecem após refresh manual.
--
-- Trade-off: REPLICA IDENTITY FULL faz o WAL ficar maior (loga a row
-- inteira em UPDATE/DELETE). Aceitável pra trocas_messages (rows pequenas).

alter table public.trocas_messages replica identity full;
alter table public.trocas_chats replica identity full;
