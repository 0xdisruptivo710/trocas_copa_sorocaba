-- Etapa 2 do sistema de Partners: conversão de vendas + cupom de desconto.
--
-- Conversão é criada por trigger quando trocas_billing.status passa pra PAID
-- e existe atribuição do user a um partner. Comissão é congelada no momento
-- da conversão (snapshot do commission_cents do partner) pra não mudar
-- retroativamente se você editar o partner depois.
--
-- Cupom: chamado da camada Next (premium.ts) quando o user digita o slug do
-- partner como cupom. Funciona como atribuição com source='coupon' — sobrescreve
-- atribuição por cookie (mesma regra last-touch + intenção explícita).

-- ============================================================
-- trocas_partner_conversions
-- ============================================================

create table public.trocas_partner_conversions (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.trocas_partners(id) on delete restrict,
  billing_id uuid not null references public.trocas_billing(id) on delete cascade,
  user_id uuid not null references public.trocas_profiles(id) on delete cascade,
  -- Valor da venda no momento (em centavos). amount_cents do billing.
  amount_cents int not null,
  -- Comissão (centavos) congelada no momento da conversão.
  commission_cents int not null,
  -- pending = aguardando aprovação (ex: janela de reembolso)
  -- approved = liberada pra próximo pagamento
  -- paid     = já paga via trocas_partner_payouts
  -- voided   = cancelada (reembolso, fraude, etc)
  status text not null default 'approved' check (status in ('pending', 'approved', 'paid', 'voided')),
  payout_id uuid,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  -- Garante 1 conversão por venda (idempotência do trigger).
  unique (billing_id)
);

create index trocas_partner_conversions_partner_idx
  on public.trocas_partner_conversions (partner_id, status, created_at desc);

alter table public.trocas_partner_conversions enable row level security;
revoke all on public.trocas_partner_conversions from public, anon, authenticated;

-- ============================================================
-- Trigger: criar conversion quando billing fica PAID
-- ============================================================

create or replace function public.trocas_create_partner_conversion_on_paid()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  attr_partner uuid;
  comm int;
begin
  -- Só dispara na transição pra PAID.
  if new.status <> 'PAID' then return new; end if;
  if old.status = 'PAID' then return new; end if;

  -- Só conta vendas de Premium (futuro: outros produtos).
  if new.product <> 'premium' then return new; end if;

  -- Tem atribuição? Se não, sem partner — nada a fazer.
  select partner_id into attr_partner
  from public.trocas_partner_attributions
  where user_id = new.user_id;

  if attr_partner is null then return new; end if;

  -- Partner ainda ativo? Se foi terminado, não gera comissão nova.
  select commission_cents into comm
  from public.trocas_partners
  where id = attr_partner and status = 'active';

  if comm is null then return new; end if;

  -- Idempotência: unique (billing_id) garante uma conversion só.
  insert into public.trocas_partner_conversions
    (partner_id, billing_id, user_id, amount_cents, commission_cents)
  values
    (attr_partner, new.id, new.user_id, new.amount_cents, comm)
  on conflict (billing_id) do nothing;

  return new;
end $$;

create trigger trocas_billing_create_conversion
  after update of status on public.trocas_billing
  for each row
  execute function public.trocas_create_partner_conversion_on_paid();

-- ============================================================
-- trocas_partner_payouts (registro dos PIX manuais que você faz)
-- ============================================================

create table public.trocas_partner_payouts (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.trocas_partners(id) on delete restrict,
  amount_cents int not null check (amount_cents > 0),
  reference_month date,
  pix_txid text,
  notes text,
  created_at timestamptz not null default now()
);

create index trocas_partner_payouts_partner_idx
  on public.trocas_partner_payouts (partner_id, created_at desc);

alter table public.trocas_partner_payouts enable row level security;
revoke all on public.trocas_partner_payouts from public, anon, authenticated;

-- ============================================================
-- RPC admin: registrar payout manual + marcar conversões como pagas
-- ============================================================

create or replace function public.trocas_admin_record_payout(
  p_partner_id uuid,
  p_amount_cents int,
  p_reference_month date default null,
  p_pix_txid text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare payout_id uuid;
begin
  insert into public.trocas_partner_payouts
    (partner_id, amount_cents, reference_month, pix_txid, notes)
  values
    (p_partner_id, p_amount_cents, p_reference_month, p_pix_txid, p_notes)
  returning id into payout_id;

  -- Marca todas as conversions 'approved' do partner como 'paid',
  -- vinculadas a esse payout.
  update public.trocas_partner_conversions
    set status = 'paid',
        payout_id = payout_id,
        paid_at = now()
    where partner_id = p_partner_id and status = 'approved';

  return payout_id;
end $$;

revoke execute on function public.trocas_admin_record_payout(uuid, int, date, text, text)
  from public, anon, authenticated;
