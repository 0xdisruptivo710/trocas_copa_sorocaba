-- Etapa 3 do sistema de Partners: dashboard público com magic-link.
--
-- A página /parceiro/[slug]?t=token chama esta RPC sem auth. Validação
-- é por (slug, dashboard_token) + expiração. Retorna jsonb com:
--   - partner: dados básicos
--   - stats: cadastros gerados, conversões, R$ pending/paid
--   - recent_conversions: últimas 30
--   - payouts: histórico de PIX

create or replace function public.trocas_partner_dashboard(
  p_slug text,
  p_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  partner_row record;
  result jsonb;
begin
  select * into partner_row
  from public.trocas_partners
  where slug = lower(p_slug)
    and dashboard_token = p_token
    and dashboard_token_expires_at > now()
    and status = 'active';

  if partner_row is null then
    return null;
  end if;

  with stats as (
    select
      (select count(*) from public.trocas_partner_attributions
        where partner_id = partner_row.id) as signups_total,
      (select count(*) from public.trocas_partner_attributions
        where partner_id = partner_row.id and created_at >= now() - interval '30 days') as signups_30d,
      (select count(*) from public.trocas_partner_conversions
        where partner_id = partner_row.id and status in ('approved','paid')) as conversions_total,
      (select count(*) from public.trocas_partner_conversions
        where partner_id = partner_row.id and status in ('approved','paid')
          and created_at >= now() - interval '30 days') as conversions_30d,
      (select coalesce(sum(commission_cents), 0) from public.trocas_partner_conversions
        where partner_id = partner_row.id and status = 'approved') as pending_cents,
      (select coalesce(sum(commission_cents), 0) from public.trocas_partner_conversions
        where partner_id = partner_row.id and status = 'paid') as paid_cents
  ),
  recent as (
    select jsonb_agg(
      jsonb_build_object(
        'created_at', c.created_at,
        'amount_cents', c.amount_cents,
        'commission_cents', c.commission_cents,
        'status', c.status
      ) order by c.created_at desc
    ) as items
    from (
      select created_at, amount_cents, commission_cents, status
      from public.trocas_partner_conversions
      where partner_id = partner_row.id
      order by created_at desc
      limit 30
    ) c
  ),
  payouts as (
    select jsonb_agg(
      jsonb_build_object(
        'created_at', p.created_at,
        'amount_cents', p.amount_cents,
        'reference_month', p.reference_month,
        'pix_txid', p.pix_txid
      ) order by p.created_at desc
    ) as items
    from (
      select created_at, amount_cents, reference_month, pix_txid
      from public.trocas_partner_payouts
      where partner_id = partner_row.id
      order by created_at desc
      limit 24
    ) p
  )
  select jsonb_build_object(
    'partner', jsonb_build_object(
      'slug', partner_row.slug,
      'name', partner_row.name,
      'instagram', partner_row.instagram,
      'commission_cents', partner_row.commission_cents
    ),
    'stats', jsonb_build_object(
      'signups_total', s.signups_total,
      'signups_30d', s.signups_30d,
      'conversions_total', s.conversions_total,
      'conversions_30d', s.conversions_30d,
      'pending_cents', s.pending_cents,
      'paid_cents', s.paid_cents
    ),
    'recent_conversions', coalesce(r.items, '[]'::jsonb),
    'payouts', coalesce(p.items, '[]'::jsonb)
  )
  into result
  from stats s
  left join recent r on true
  left join payouts p on true;

  return result;
end $$;

-- Pública — autenticação é via token no argumento.
revoke execute on function public.trocas_partner_dashboard(text, text) from public, authenticated;
grant execute on function public.trocas_partner_dashboard(text, text) to anon, authenticated;
