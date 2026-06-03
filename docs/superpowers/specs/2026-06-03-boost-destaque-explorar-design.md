# Spec — Boost "Destaque no Explorar"

**Data:** 2026-06-03
**Status:** aprovado p/ planejamento
**Fatia:** 1 de N da estratégia Premium "A" (Apoiador único + Boosts avulsos)

## 1. Contexto e objetivo

O Premium hoje é pagamento único (R$ 24,90) que destrava capacidade + status permanentes.
A estratégia escolhida ("A") adiciona **boosts avulsos** — compras via PIX que repetem, sem
assinatura — pra gerar receita recorrente-ish respeitando o álbum finito/sazonal da Copa.

Esta é a **primeira fatia**: o boost **Destaque no Explorar**. Quem compra aparece **no topo**
das listas de match das outras pessoas por **7 dias**, com selo ⭐. Reaproveita o fluxo
AbacatePay/billing já existente.

## 2. Não-objetivos (escopo desta fatia)

- Outros boosts (Alcance multi-cidade, Passe da Copa) — fatias futuras.
- Alerta de proximidade, badge de fundador, update em massa — fatias futuras.
- Sem assinatura/recorrência automática. Boost é compra avulsa.

## 3. Experiência do usuário

1. Em `/explorar` (e em `/conta/premium`), CTA **"Destacar meu perfil — R$ 4,90 / 7 dias"**,
   visível **para todos, inclusive Free** (funil de receita).
2. Clica → gera PIX (mesmo componente/fluxo do Premium) → paga → confirmação.
3. Passa a ver **"Destaque ativo até DD/MM"**.
4. Durante 7 dias, nas listas de Explorar de **outras** pessoas que têm troca com ele, ele
   aparece **no topo** (dentro de quem já tem match) com selo **⭐ Destaque**.
5. O boost NÃO altera a própria lista do comprador — só a visibilidade dele perante os outros.
6. Comprar de novo com boost ativo **soma +7 dias** (empilha).

## 4. Modelo de dados

### 4.1 Nova tabela `trocas_boosts`
```sql
create table trocas_boosts (
  user_id    uuid        not null references trocas_profiles(id) on delete cascade,
  kind       text        not null check (kind in ('destaque')),
  expires_at timestamptz not null,
  charge_id  text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, kind)
);
```
- PK `(user_id, kind)` → uma linha por tipo de boost por usuário; o empilhamento é um UPDATE
  do `expires_at`.
- `kind` com CHECK extensível (próximas fatias adicionam `'alcance'`, `'passe_copa'`).

### 4.2 RLS
```sql
alter table trocas_boosts enable row level security;
create policy "own boosts: select" on trocas_boosts
  for select using (user_id = auth.uid());
-- Sem policy de insert/update/delete → escrita só via service-role (markChargePaid).
```
Os selos ⭐ nos cards dos outros vêm do `trocas_find_matches` (SECURITY DEFINER), então o
cliente nunca precisa ler boosts de terceiros direto.

### 4.3 Ampliar o CHECK de `trocas_billing.product`
A constraint atual é `CHECK (product = 'premium')`. A migration troca por:
```sql
alter table trocas_billing drop constraint trocas_billing_product_check;
alter table trocas_billing add constraint trocas_billing_product_check
  check (product in ('premium', 'boost_destaque'));
```

### 4.4 RPC de concessão (atômica, com empilhamento)
```sql
create or replace function trocas_grant_boost(
  p_user_id uuid, p_kind text, p_days int, p_charge_id text
) returns void language sql security definer set search_path = public as $$
  insert into trocas_boosts (user_id, kind, expires_at, charge_id)
  values (p_user_id, p_kind, now() + make_interval(days => p_days), p_charge_id)
  on conflict (user_id, kind) do update set
    expires_at = greatest(trocas_boosts.expires_at, now()) + make_interval(days => p_days),
    charge_id  = excluded.charge_id,
    updated_at = now();
$$;
```
`greatest(expires_at, now())` garante o empilhamento correto mesmo se o boost anterior já
expirou.

## 5. Fluxo de compra — `src/lib/actions/boosts.ts` (arquivo novo)

```ts
"use server";
export async function createBoostChargeAction(
  kind: "destaque",
): Promise<CreateResult>   // mesmo shape de createPremiumChargeAction
```
- Espelha `createPremiumChargeAction`: pega user autenticado, monta `createPixCharge`
  com `description = "TrocasCopa — Destaque no Explorar (7 dias)"`,
  `amount = BOOST_DESTAQUE_CENTS`, `metadata = { user_id, product: "boost_destaque", kind }`.
- Grava em `trocas_billing` com `product = "boost_destaque"` (via service-role `admin()`,
  como o premium).
- **Sem cupom/desconto** nesta fatia (boost é avulso barato).
- Não bloqueia se já houver boost ativo (empilhamento é desejado).
- Retorna `{ ok, chargeId, brCode, brCodeBase64, amount }`.

`checkChargeStatus(chargeId)` (já existe, é product-agnóstico) é reusado pro polling.

## 6. Concessão no pagamento — `markChargePaid` (estender)

Em `src/lib/actions/premium.ts`, `markChargePaid` já marca `trocas_billing` como PAID
(idempotente) e hoje faz `if product === "premium" → is_premium`. Adicionar:
```ts
if (charge.product === "premium") { /* ...existente... */ }
else if (charge.product === "boost_destaque") {
  await sb.rpc("trocas_grant_boost", {
    p_user_id: charge.user_id, p_kind: "destaque", p_days: 7, p_charge_id: chargeId,
  });
}
```
- A query que lê a charge já seleciona `product` e `user_id`.
- **A rota do webhook (`/api/abacatepay`) não muda** — ela só chama `markChargePaid`.
- Idempotência preservada (o early-return em `status === 'PAID'` evita conceder 2x pelo mesmo
  evento).

## 7. Ranking — `trocas_find_matches` (opção (a): destacado-no-topo)

Alterar a função:
1. `RETURNS TABLE(... , is_boosted boolean)` — nova coluna no fim.
2. No `select` final, computar:
   ```sql
   exists (select 1 from trocas_boosts b
           where b.user_id = s.id and b.kind = 'destaque' and b.expires_at > now()) as is_boosted
   ```
3. No `ORDER BY`, **`is_boosted desc` como PRIMEIRA chave**, mantendo as existentes depois
   (match_score desc → distância → created_at). Continua respeitando o filtro de só mostrar
   quem tem troca real (`least(give,get) > 0` quando `p_only_with_matches`), ou seja: o boost
   reordena **dentro de quem já é match**, não fura a regra.

Camada TS:
- `src/lib/explorar/data.ts`: adicionar `is_boosted: boolean` à interface `Match` (o RPC já
  devolve o campo; `findMatches` repassa).
- `src/components/explorar/match-card.tsx`: renderizar o selo **⭐ Destaque** quando
  `match.is_boosted`.

## 8. UI

### 8.1 Refactor enxuto: extrair o checkout PIX
Hoje o passo "QR PIX + polling" vive dentro de `premium-flow.tsx`. Pra não duplicar no boost,
extrair pra `src/components/payments/pix-checkout.tsx` (props: `charge`, `onPaid`, `onCancel`),
e o `premium-flow.tsx` passa a consumir. O `BoostFlow` reusa o mesmo componente.

### 8.2 `src/components/boost/boost-flow.tsx` (novo)
- Estado `intro → pix`. No intro: descrição + botão "Destacar meu perfil — R$ 4,90".
- Chama `createBoostChargeAction("destaque")`, renderiza `<PixCheckout>`, no `onPaid` mostra
  "Destaque ativo!".

### 8.3 Pontos de entrada + status
- `/explorar`: CTA topo "Destacar meu perfil" + se houver boost ativo, "⭐ Destaque ativo até
  DD/MM". (Buscar boost ativo do próprio user numa função `getMyBoost()` em `data.ts`/`boosts`.)
- `/conta/premium`: mesma CTA do boost abaixo do bloco Premium.

## 9. Tipos hand-patched — `src/types/supabase.ts`

(Tipos são mantidos à mão; regenerar quebra arquivos.)
- `trocas_billing.product`: ampliar de `"premium"` para `"premium" | "boost_destaque"` nas
  três variações (Row/Insert/Update).
- Adicionar a tabela `trocas_boosts` (Row/Insert/Update) e a função `trocas_grant_boost` aos
  tipos, espelhando o schema acima.

## 10. Casos de borda

- **Empilhar**: tratado pela RPC (`greatest(expires_at, now()) + 7d`).
- **Boost expirado**: lazy — `trocas_find_matches` checa `expires_at > now()`. Sem cron.
- **Pagamento duplicado / webhook reentrante**: `markChargePaid` é idempotente.
- **Comprador sem localização**: o boost ainda vale; ele aparece no topo de quem tiver match
  (o ranking já lida com `distance_km` nulo).
- **Free compra boost**: permitido. Não concede nada além do destaque (não vira Premium).

## 11. Preço

- `BOOST_DESTAQUE_CENTS = 490` em `src/lib/abacate/client.ts` (junto de `PREMIUM_PRICE_CENTS`).

## 12. Arquivos tocados

- **Migration** (nova): `trocas_boosts` + RLS + RPC `trocas_grant_boost` + alterar
  `trocas_billing_product_check` + recriar `trocas_find_matches` com `is_boosted`.
- `src/lib/abacate/client.ts` — `BOOST_DESTAQUE_CENTS`.
- `src/lib/actions/boosts.ts` (novo) — `createBoostChargeAction`, `getMyBoost`.
- `src/lib/actions/premium.ts` — estender `markChargePaid`.
- `src/lib/explorar/data.ts` — `Match.is_boosted`.
- `src/components/payments/pix-checkout.tsx` (novo, refactor) + `premium-flow.tsx` (consumir).
- `src/components/boost/boost-flow.tsx` (novo).
- `src/components/explorar/match-card.tsx` — selo ⭐.
- `src/app/(app)/explorar/page.tsx` e `/conta/premium/page.tsx` — CTAs/status.
- `src/types/supabase.ts` — tipos.

## 13. Testes

- **SQL/RLS**: usuário só lê o próprio boost; insert direto por usuário comum é negado.
- **Ranking**: dado 2 candidatos com match equivalente, o que tem boost ativo vem primeiro;
  boost expirado não afeta a ordem.
- **Concessão**: `trocas_grant_boost` empilha corretamente (ativo no futuro → soma; expirado →
  reinicia a partir de agora).
- Verificação manual: comprar em devMode → simular pagamento → confirmar `trocas_boosts` e o
  selo no Explorar de outra conta.

## 14. Decisões cravadas

- Ranking: **(a) destacado-no-topo** (sort `is_boosted desc` primeiro).
- Action em **arquivo novo** `boosts.ts`.
- Boosts vendáveis a **todos (inclusive Free)**.
- Duração 7 dias, R$ 4,90, empilhável.
