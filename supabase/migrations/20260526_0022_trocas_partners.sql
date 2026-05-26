-- Sistema de parcerias com influencers (Affiliate / Partners).
--
-- Diferente do referral interno (user→user), partner é uma entidade externa:
-- influencer não tem conta no app, ganha comissão por venda de Premium
-- (R$10 fixo por default), e tem dashboard externo via magic-link.
--
-- Esta migration cobre a Etapa 1: cadastro de partners + atribuição de signups
-- via cookie tc_partner. Conversão de vendas e dashboard vêm nas próximas.

-- ============================================================
-- Tabela: trocas_partners
-- ============================================================

create table public.trocas_partners (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug ~ '^[a-z0-9_-]{2,30}$'),
  name text not null check (char_length(name) between 1 and 100),
  instagram text,
  email text,
  pix_key text,
  -- Comissão em centavos por venda confirmada de Premium (default R$10,00).
  commission_cents int not null default 1000 check (commission_cents >= 0),
  -- Token rotativo pra dashboard /parceiro/[slug]?t=token.
  dashboard_token text not null default encode(gen_random_bytes(24), 'base64'),
  dashboard_token_expires_at timestamptz not null default (now() + interval '90 days'),
  status text not null default 'active' check (status in ('active', 'paused', 'terminated')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index trocas_partners_status_idx on public.trocas_partners (status) where status = 'active';

create trigger trocas_partners_set_updated_at
  before update on public.trocas_partners
  for each row execute function public.trocas_set_updated_at();

alter table public.trocas_partners enable row level security;

-- Sem SELECT público — info do partner é sensível (pix, email).
-- Acesso é via RPCs específicas (resolução de slug, dashboard com token).
revoke all on public.trocas_partners from public, anon, authenticated;

-- ============================================================
-- View pública mínima: só pra resolver slug → nome no checkout
-- (mostrar "você está usando o cupom de @mariah").
-- ============================================================

create or replace view public.trocas_partner_public as
select id, slug, name, instagram, status
from public.trocas_partners
where status = 'active';

grant select on public.trocas_partner_public to anon, authenticated;

-- ============================================================
-- Tabela: trocas_partner_attributions
-- ============================================================
-- Uma linha por user_id. Quem ganha o crédito do signup do user.
-- created_at = quando atribuímos.
-- Source: 'cookie' (via ?p=slug) ou 'coupon' (digitou no checkout).
-- Last-touch: se já existe, sobrescreve com a nova fonte.

create table public.trocas_partner_attributions (
  user_id uuid primary key references public.trocas_profiles(id) on delete cascade,
  partner_id uuid not null references public.trocas_partners(id) on delete cascade,
  source text not null check (source in ('cookie', 'coupon')),
  created_at timestamptz not null default now()
);

create index trocas_partner_attributions_partner_idx
  on public.trocas_partner_attributions (partner_id, created_at desc);

alter table public.trocas_partner_attributions enable row level security;

-- Sem SELECT pra users comuns. Acesso só via dashboard (com token) ou admin.
revoke all on public.trocas_partner_attributions from public, anon, authenticated;

-- ============================================================
-- RPC: admin cria/atualiza partner (chamado por você via MCP SQL)
-- ============================================================
-- Não exposto a anon/authenticated. Você executa via service_role
-- (MCP do Supabase já roda com privilégio admin).

create or replace function public.trocas_admin_create_partner(
  p_slug text,
  p_name text,
  p_instagram text default null,
  p_email text default null,
  p_pix_key text default null,
  p_commission_cents int default 1000
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare partner_id uuid;
begin
  insert into public.trocas_partners
    (slug, name, instagram, email, pix_key, commission_cents)
  values
    (lower(p_slug), p_name, p_instagram, p_email, p_pix_key, p_commission_cents)
  returning id into partner_id;
  return partner_id;
end $$;

revoke execute on function public.trocas_admin_create_partner(text, text, text, text, text, int)
  from public, anon, authenticated;

-- ============================================================
-- RPC: atribuir signup ao partner (chamado pelo signupAction)
-- ============================================================
-- Last-touch: se já existe atribuição, sobrescreve.
-- Falha silenciosa se slug inválido ou inexistente — não quebra signup.

create or replace function public.trocas_attribute_signup(
  p_slug text,
  p_source text default 'cookie'
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  partner_uuid uuid;
begin
  if me is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if p_source not in ('cookie', 'coupon') then
    return false;
  end if;

  select id into partner_uuid
  from public.trocas_partners
  where slug = lower(p_slug) and status = 'active';

  if partner_uuid is null then
    return false;
  end if;

  insert into public.trocas_partner_attributions (user_id, partner_id, source)
  values (me, partner_uuid, p_source)
  on conflict (user_id) do update
    set partner_id = excluded.partner_id,
        source = excluded.source,
        created_at = now();

  return true;
end $$;

revoke execute on function public.trocas_attribute_signup(text, text) from public, anon;
grant execute on function public.trocas_attribute_signup(text, text) to authenticated;
