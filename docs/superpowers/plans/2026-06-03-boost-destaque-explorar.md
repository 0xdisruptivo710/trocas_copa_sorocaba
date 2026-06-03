# Boost "Destaque no Explorar" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vender um boost avulso de R$ 4,90 (PIX, 7 dias) que faz o comprador aparecer no topo das listas de match do Explorar das outras pessoas, com selo ⭐.

**Architecture:** Reaproveita o fluxo AbacatePay/billing existente (`product = "boost_destaque"`). Concessão atômica via RPC após o webhook. Visibilidade resolvida no `trocas_find_matches` (nova coluna `is_boosted`, ordenada primeiro). Expiração lazy (sem cron). UI compartilha o checkout PIX com o Premium.

**Tech Stack:** Next 16 (App Router, Server Actions), Supabase (Postgres + RLS + RPC), AbacatePay (PIX), vitest (integração contra Supabase real via `.env.local`).

**Spec:** `docs/superpowers/specs/2026-06-03-boost-destaque-explorar-design.md`

**Convenção de migration/teste:** migrations ficam em `supabase/migrations/AAAAMMDD_NNNN_*.sql`. Aplicar no projeto remoto via Supabase MCP `apply_migration` **ou** SQL Editor do dashboard. Os testes vitest rodam contra o Supabase real (precisa `SUPABASE_SERVICE_ROLE_KEY` + `NEXT_PUBLIC_SUPABASE_*` no `.env.local`); rodar `npm test` com o migration **já aplicado**.

---

## Task 1: Migration — tabela `trocas_boosts`, RLS, RPC, CHECK de billing, `trocas_find_matches`

**Files:**
- Create: `supabase/migrations/20260603_0025_trocas_boosts.sql`
- Create (test): `src/tests/boosts.test.ts`

- [ ] **Step 1: Escrever o teste de integração que falha (grant + empilhamento + RLS)**

`src/tests/boosts.test.ts`:
```ts
import { readFileSync } from "node:fs";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

function loadEnv() {
  try {
    for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/i);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch { /* ignore */ }
}
loadEnv();

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const HAS_SERVICE = SERVICE.length > 0;
const rand = () => Math.random().toString(36).slice(2, 10);

describe.skipIf(!HAS_SERVICE)("trocas_boosts", () => {
  let admin: SupabaseClient<Database>;
  let user: { id: string; email: string };

  beforeAll(async () => {
    admin = createClient<Database>(URL, SERVICE, { auth: { persistSession: false } });
    const u = await admin.auth.admin.createUser({
      email: `boost-${rand()}@trocas-test.local`,
      password: "pwd12345",
      email_confirm: true,
    });
    if (u.error) throw u.error;
    user = { id: u.data.user!.id, email: u.data.user!.email! };
  });

  afterAll(async () => {
    if (user?.id) await admin.auth.admin.deleteUser(user.id);
  });

  it("trocas_grant_boost concede 7 dias e empilha em compra repetida", async () => {
    const g1 = await admin.rpc("trocas_grant_boost", {
      p_user_id: user.id, p_kind: "destaque", p_days: 7, p_charge_id: "ch_1",
    });
    expect(g1.error).toBeNull();

    const { data: b1 } = await admin
      .from("trocas_boosts").select("expires_at")
      .eq("user_id", user.id).eq("kind", "destaque").single();
    const exp1 = new Date(b1!.expires_at).getTime();
    expect(exp1).toBeGreaterThan(Date.now() + 6 * 864e5); // ~7 dias

    await admin.rpc("trocas_grant_boost", {
      p_user_id: user.id, p_kind: "destaque", p_days: 7, p_charge_id: "ch_2",
    });
    const { data: b2 } = await admin
      .from("trocas_boosts").select("expires_at, charge_id")
      .eq("user_id", user.id).eq("kind", "destaque").single();
    expect(new Date(b2!.expires_at).getTime()).toBeGreaterThan(exp1 + 6 * 864e5); // empilhou
    expect(b2!.charge_id).toBe("ch_2");
  });

  it("RLS: usuário só lê o próprio boost; não insere direto", async () => {
    const client = createClient<Database>(URL, ANON, { auth: { persistSession: false } });
    await client.auth.signInWithPassword({ email: user.email, password: "pwd12345" });

    // lê o próprio: ok
    const ownRead = await client.from("trocas_boosts").select("kind").eq("user_id", user.id);
    expect(ownRead.error).toBeNull();

    // insert direto: bloqueado por RLS (sem policy de insert)
    const ins = await client.from("trocas_boosts").insert({
      user_id: user.id, kind: "destaque",
      expires_at: new Date(Date.now() + 864e5).toISOString(),
    });
    expect(ins.error).not.toBeNull();
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npm test -- boosts`
Expected: FAIL — RPC `trocas_grant_boost` não existe / relação `trocas_boosts` não existe.

- [ ] **Step 3: Escrever a migration**

`supabase/migrations/20260603_0025_trocas_boosts.sql`:
```sql
-- Boost "Destaque no Explorar": tabela + RLS + RPC de concessão +
-- ampliação do CHECK de product + recriação de trocas_find_matches.

-- 1) Tabela de boosts (PK user_id+kind => 1 linha por tipo; empilhar = UPDATE)
create table if not exists public.trocas_boosts (
  user_id    uuid        not null references public.trocas_profiles(id) on delete cascade,
  kind       text        not null check (kind in ('destaque')),
  expires_at timestamptz not null,
  charge_id  text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, kind)
);

alter table public.trocas_boosts enable row level security;
drop policy if exists "own boosts: select" on public.trocas_boosts;
create policy "own boosts: select" on public.trocas_boosts
  for select using (user_id = auth.uid());
-- sem policy de insert/update/delete => escrita só via service-role (markChargePaid)

-- 2) Ampliar o CHECK de product (hoje só aceita 'premium')
alter table public.trocas_billing drop constraint if exists trocas_billing_product_check;
alter table public.trocas_billing add constraint trocas_billing_product_check
  check (product in ('premium', 'boost_destaque'));

-- 3) Concessão atômica com empilhamento
create or replace function public.trocas_grant_boost(
  p_user_id uuid, p_kind text, p_days int, p_charge_id text
) returns void language sql security definer set search_path = public as $$
  insert into public.trocas_boosts (user_id, kind, expires_at, charge_id)
  values (p_user_id, p_kind, now() + make_interval(days => p_days), p_charge_id)
  on conflict (user_id, kind) do update set
    expires_at = greatest(public.trocas_boosts.expires_at, now()) + make_interval(days => p_days),
    charge_id  = excluded.charge_id,
    updated_at = now();
$$;

-- 4) Recriar trocas_find_matches adicionando is_boosted (destacado-no-topo)
create or replace function public.trocas_find_matches(
  p_radius_km numeric default 50, p_limit integer default 50,
  p_search text default null, p_state text default null,
  p_only_with_matches boolean default true)
returns table(other_user uuid, username text, full_name text, avatar_url text,
  city text, state character, distance_km numeric, i_can_give integer,
  i_can_get integer, match_score numeric, lat_approx double precision,
  lng_approx double precision, is_boosted boolean)
language plpgsql security definer set search_path to 'public' as $function$
declare
  me uuid := auth.uid();
  my_location geography;
  has_my_location boolean;
begin
  if me is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  select location into my_location from trocas_profiles where id = me;
  has_my_location := my_location is not null;

  return query
  with my_dupes as (
    select sticker_code from trocas_user_stickers where user_id = me and owned_count >= 2
  ),
  my_missing as (
    select s.code as sticker_code from trocas_stickers s
    left join trocas_user_stickers us on us.user_id = me and us.sticker_code = s.code
    where coalesce(us.owned_count, 0) = 0
  ),
  blocked_ids as (
    select blocked_id as id from trocas_blocks where blocker_id = me
    union
    select blocker_id as id from trocas_blocks where blocked_id = me
  ),
  candidates as (
    select p.id, p.username, p.full_name, p.avatar_url, p.city, p.state, p.created_at, p.location,
      case when has_my_location and p.location is not null
        then round((st_distance(p.location, my_location) / 1000.0)::numeric, 1)
        else null end as distance_km
    from trocas_profiles p
    where p.id <> me
      and p.id not in (select id from blocked_ids)
      and (p_state is null or p.state = p_state)
      and (p_search is null or p.username ilike '%' || p_search || '%' or p.full_name ilike '%' || p_search || '%')
      and (not has_my_location or p.location is null or st_dwithin(p.location, my_location, p_radius_km * 1000))
  ),
  scored as (
    select c.id, c.username, c.full_name, c.avatar_url, c.city, c.state, c.distance_km, c.created_at, c.location,
      (select count(*) from my_dupes md
        where not exists (
          select 1 from trocas_user_stickers other_us
          where other_us.user_id = c.id and other_us.sticker_code = md.sticker_code and other_us.owned_count >= 1
        ))::int as i_can_give_raw,
      (select count(*) from my_missing mm
        join trocas_user_stickers other_us on other_us.user_id = c.id and other_us.sticker_code = mm.sticker_code
        where other_us.owned_count >= 2)::int as i_can_get_raw
    from candidates c
  )
  select s.id, s.username, s.full_name, s.avatar_url, s.city, s.state, s.distance_km,
    s.i_can_give_raw, s.i_can_get_raw,
    case
      when least(s.i_can_give_raw, s.i_can_get_raw) = 0 then 0
      when s.distance_km is null then least(s.i_can_give_raw, s.i_can_get_raw)::numeric
      else round(least(s.i_can_give_raw, s.i_can_get_raw)::numeric / (1 + s.distance_km / 10.0), 2)
    end as match_score,
    case when s.location is not null then st_y(st_snaptogrid(s.location::geometry, 0.005)) else null end as lat_approx,
    case when s.location is not null then st_x(st_snaptogrid(s.location::geometry, 0.005)) else null end as lng_approx,
    exists (select 1 from trocas_boosts b
            where b.user_id = s.id and b.kind = 'destaque' and b.expires_at > now()) as is_boosted
  from scored s
  where (not p_only_with_matches) or least(s.i_can_give_raw, s.i_can_get_raw) > 0
  order by
    exists (select 1 from trocas_boosts b
            where b.user_id = s.id and b.kind = 'destaque' and b.expires_at > now()) desc,
    case when p_only_with_matches then
      case
        when least(s.i_can_give_raw, s.i_can_get_raw) = 0 then 0
        when s.distance_km is null then least(s.i_can_give_raw, s.i_can_get_raw)::numeric
        else round(least(s.i_can_give_raw, s.i_can_get_raw)::numeric / (1 + s.distance_km / 10.0), 2)
      end
    else null end desc nulls last,
    case when not p_only_with_matches then s.distance_km else null end asc nulls last,
    s.created_at desc
  limit p_limit;
end $function$;
```

- [ ] **Step 4: Aplicar a migration no projeto remoto**

Aplicar `20260603_0025_trocas_boosts.sql` via Supabase MCP `apply_migration` (name: `trocas_boosts`) ou colando no SQL Editor do dashboard.
Verificar: `select to_regclass('public.trocas_boosts');` retorna a tabela; `select proname from pg_proc where proname='trocas_grant_boost';` retorna 1 linha.

- [ ] **Step 5: Rodar o teste e confirmar que passa**

Run: `npm test -- boosts`
Expected: PASS (grant/empilhamento + RLS).

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260603_0025_trocas_boosts.sql src/tests/boosts.test.ts
git commit -m "feat(boost): migration trocas_boosts + RPC + ranking is_boosted"
```

---

## Task 2: Tipos hand-patched (`src/types/supabase.ts`)

Tipos são mantidos à mão (regenerar quebra). Ler o arquivo e aplicar 3 mudanças.

**Files:**
- Modify: `src/types/supabase.ts`

- [ ] **Step 1: Ampliar `trocas_billing.product`**

Nas três variações de `trocas_billing` (Row, Insert, Update), trocar o tipo do campo `product` de `"premium"` para `"premium" | "boost_destaque"`.

- [ ] **Step 2: Adicionar a tabela `trocas_boosts`**

Dentro de `Database["public"]["Tables"]`, adicionar (seguindo o formato das outras tabelas):
```ts
trocas_boosts: {
  Row: {
    user_id: string;
    kind: "destaque";
    expires_at: string;
    charge_id: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    user_id: string;
    kind: "destaque";
    expires_at: string;
    charge_id?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    user_id?: string;
    kind?: "destaque";
    expires_at?: string;
    charge_id?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
};
```

- [ ] **Step 3: Adicionar a função `trocas_grant_boost` e ampliar o retorno de `trocas_find_matches`**

Em `Database["public"]["Functions"]`:
- Adicionar `trocas_grant_boost: { Args: { p_user_id: string; p_kind: string; p_days: number; p_charge_id: string }; Returns: undefined };`
- No `Returns` de `trocas_find_matches` (array de objetos), adicionar `is_boosted: boolean` a cada item.

- [ ] **Step 4: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: exit 0 (o único erro pré-existente conhecido em `profile.ts` já foi corrigido; não deve haver novos).

- [ ] **Step 5: Commit**

```bash
git add src/types/supabase.ts
git commit -m "types: trocas_boosts + product boost_destaque + is_boosted"
```

---

## Task 3: Constante de preço (`src/lib/abacate/client.ts`)

**Files:**
- Modify: `src/lib/abacate/client.ts` (junto de `PREMIUM_PRICE_CENTS`)

- [ ] **Step 1: Adicionar a constante**

Logo abaixo de `export const PREMIUM_DISCOUNT_CENTS = 500;`:
```ts
export const BOOST_DESTAQUE_CENTS = 490; // R$ 4,90 — Destaque no Explorar (7 dias)
export const BOOST_DESTAQUE_DAYS = 7;
```

- [ ] **Step 2: Verificar e commitar**

Run: `npx tsc --noEmit` → exit 0
```bash
git add src/lib/abacate/client.ts
git commit -m "feat(boost): preço BOOST_DESTAQUE_CENTS"
```

---

## Task 4: Action de compra (`src/lib/actions/boosts.ts`)

**Files:**
- Create: `src/lib/actions/boosts.ts`

- [ ] **Step 1: Criar a action**

`src/lib/actions/boosts.ts`:
```ts
"use server";

import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createSbjsClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { env } from "@/lib/env";
import { createPixCharge, BOOST_DESTAQUE_CENTS } from "@/lib/abacate/client";

type CreateResult =
  | { ok: true; chargeId: string; brCode: string; brCodeBase64: string; amount: number }
  | { ok: false; error: string };

function admin() {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return createSbjsClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

export async function createBoostChargeAction(
  kind: "destaque" = "destaque",
): Promise<CreateResult> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado." };

  const amount = BOOST_DESTAQUE_CENTS;

  let charge;
  try {
    charge = await createPixCharge({
      amount,
      description: "TrocasCopa — Destaque no Explorar (7 dias)",
      expiresIn: 3600,
      metadata: { user_id: user.id, product: "boost_destaque", kind },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro desconhecido";
    return { ok: false, error: `Falha ao criar PIX: ${msg}` };
  }

  const sb = admin();
  const { error: insErr } = await sb.from("trocas_billing").insert({
    user_id: user.id,
    abacate_charge_id: charge.id,
    product: "boost_destaque",
    amount_cents: amount,
    status: "PENDING",
    br_code: charge.brCode,
    br_code_base64: charge.brCodeBase64,
    expires_at: charge.expiresAt,
    metadata: { devMode: charge.devMode, kind },
  });
  if (insErr) return { ok: false, error: insErr.message };

  return {
    ok: true,
    chargeId: charge.id,
    brCode: charge.brCode,
    brCodeBase64: charge.brCodeBase64,
    amount,
  };
}

export interface MyBoost {
  kind: "destaque";
  expires_at: string;
}

export async function getMyBoost(): Promise<MyBoost | null> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("trocas_boosts")
    .select("kind, expires_at")
    .eq("user_id", user.id)
    .eq("kind", "destaque")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  return (data as MyBoost | null) ?? null;
}
```

- [ ] **Step 2: Verificar e commitar**

Run: `npx tsc --noEmit` → exit 0; `npx eslint src/lib/actions/boosts.ts` → exit 0
```bash
git add src/lib/actions/boosts.ts
git commit -m "feat(boost): createBoostChargeAction + getMyBoost"
```

---

## Task 5: Conceder o boost no pagamento (`markChargePaid`)

**Files:**
- Modify: `src/lib/actions/premium.ts` (função `markChargePaid`, perto da linha 198)

- [ ] **Step 1: Estender o branch de produto**

Em `markChargePaid`, o trecho atual é:
```ts
  if (charge.product === "premium") {
    await sb.from("trocas_profiles").update({ is_premium: true }).eq("id", charge.user_id);
  }
```
Trocar por:
```ts
  if (charge.product === "premium") {
    await sb.from("trocas_profiles").update({ is_premium: true }).eq("id", charge.user_id);
  } else if (charge.product === "boost_destaque") {
    await sb.rpc("trocas_grant_boost", {
      p_user_id: charge.user_id,
      p_kind: "destaque",
      p_days: 7,
      p_charge_id: chargeId,
    });
  }
```
(O `select` que carrega a charge já traz `product` e `user_id`; nenhuma outra mudança é necessária. A rota do webhook não muda.)

- [ ] **Step 2: Verificar e commitar**

Run: `npx tsc --noEmit` → exit 0
```bash
git add src/lib/actions/premium.ts
git commit -m "feat(boost): concede destaque no markChargePaid"
```

---

## Task 6: Expor `is_boosted` no front e selo no card

**Files:**
- Modify: `src/lib/explorar/data.ts` (interface `Match`)
- Modify: `src/components/explorar/match-card.tsx`

- [ ] **Step 1: Adicionar `is_boosted` à interface `Match`**

Em `src/lib/explorar/data.ts`, na interface `Match`, adicionar após `lng_approx`:
```ts
  /** Boost "destaque" ativo — aparece no topo e ganha selo ⭐. */
  is_boosted: boolean;
```
(`findMatches` repassa `data` do RPC sem transformar, então o campo já chega.)

- [ ] **Step 2: Renderizar o selo ⭐ no card**

Em `src/components/explorar/match-card.tsx`, dentro do `<Card>` (logo após a abertura da tag `<Card ...>`, antes do bloco do Avatar), adicionar:
```tsx
        {match.is_boosted && (
          <span className="absolute right-2 top-2 z-10 inline-flex items-center gap-0.5 rounded-full bg-amber-400/90 px-1.5 py-0.5 text-[10px] font-bold text-amber-950 shadow-sm">
            ⭐ Destaque
          </span>
        )}
```
(O `<Card>` já é `relative`, então o `absolute` funciona.)

- [ ] **Step 3: Verificar e commitar**

Run: `npx tsc --noEmit` → exit 0; `npm run build` → sucesso
```bash
git add src/lib/explorar/data.ts src/components/explorar/match-card.tsx
git commit -m "feat(boost): is_boosted no Match + selo ⭐ no card"
```

---

## Task 7: Extrair o checkout PIX compartilhado

Hoje o passo "QR + polling" vive dentro de `premium-flow.tsx`. Extrair pra reusar no boost.

**Files:**
- Create: `src/components/payments/pix-checkout.tsx`
- Modify: `src/components/premium/premium-flow.tsx`

- [ ] **Step 1: Criar o componente `PixCheckout`**

`src/components/payments/pix-checkout.tsx`:
```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Copy, Loader2 } from "lucide-react";
import { checkChargeStatus } from "@/lib/actions/premium";

export interface PixCharge {
  chargeId: string;
  brCode: string;
  brCodeBase64: string;
  amount: number;
}

interface Props {
  charge: PixCharge;
  onPaid: () => void;
  onExpired: () => void;
  onCancel: () => void;
}

export function PixCheckout({ charge, onPaid, onExpired, onCancel }: Props) {
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    pollRef.current = setInterval(async () => {
      const r = await checkChargeStatus(charge.chargeId);
      if (r.status === "PAID") {
        if (pollRef.current) clearInterval(pollRef.current);
        onPaid();
      } else if (r.status === "EXPIRED" || r.status === "CANCELLED") {
        if (pollRef.current) clearInterval(pollRef.current);
        toast.error("Cobrança expirou. Tenta de novo.");
        onExpired();
      }
    }, 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [charge.chargeId, onPaid, onExpired]);

  const reais = (charge.amount / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  const onCopy = async () => {
    await navigator.clipboard.writeText(charge.brCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card className="space-y-4 p-6">
      <header>
        <h2 className="text-lg font-semibold">Pague R$ {reais} via PIX</h2>
        <p className="text-sm text-muted-foreground">
          Aponte a câmera do banco pro QR ou copia e cola.
        </p>
      </header>

      <div className="flex justify-center">
        <Image
          src={charge.brCodeBase64}
          alt="QR Code PIX"
          width={240}
          height={240}
          unoptimized
          className="rounded-lg border bg-white"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="brcode">Código copia e cola</Label>
        <div className="flex gap-2">
          <Input id="brcode" value={charge.brCode} readOnly className="font-mono text-xs" />
          <Button type="button" variant="outline" size="icon" onClick={onCopy}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Aguardando confirmação…
      </div>

      <Button type="button" variant="ghost" className="w-full" onClick={onCancel}>
        Cancelar
      </Button>
    </Card>
  );
}
```

- [ ] **Step 2: Refatorar `premium-flow.tsx` pra usar `PixCheckout`**

Em `src/components/premium/premium-flow.tsx`:
- Remover o `useEffect` de polling (linhas ~34-55), o `pollRef`, o `onCopy`, o `copied`, e o bloco `if (step === "qrcode" && charge) { ... }` inteiro (linhas ~99-157).
- Manter a `interface Charge` (ou importar `PixCharge` de `payments/pix-checkout`; preferir importar e remover a duplicada).
- Importar: `import { PixCheckout, type PixCharge } from "@/components/payments/pix-checkout";` e `import { useCelebrate } from "@/components/motion/celebrate";` (mantido).
- Onde antes renderizava o passo qrcode, renderizar:
```tsx
  if (step === "qrcode" && charge) {
    return (
      <PixCheckout
        charge={charge}
        onPaid={() => {
          setStep("paid");
          fire(null, "large");
          toast.success("Pagamento confirmado!");
          router.refresh();
        }}
        onExpired={() => { setStep("intro"); setCharge(null); }}
        onCancel={() => { setStep("intro"); setCharge(null); }}
      />
    );
  }
```
- `setCharge` passa a usar o tipo `PixCharge` importado (mesmos campos: chargeId/brCode/brCodeBase64/amount).

- [ ] **Step 3: Verificar e commitar**

Run: `npx tsc --noEmit` → exit 0; `npm run build` → sucesso. Conferir manualmente que `/conta/premium` ainda renderiza o QR e o passo "paid".
```bash
git add src/components/payments/pix-checkout.tsx src/components/premium/premium-flow.tsx
git commit -m "refactor(payments): extrai PixCheckout compartilhado do PremiumFlow"
```

---

## Task 8: Componente `BoostFlow`

**Files:**
- Create: `src/components/boost/boost-flow.tsx`

- [ ] **Step 1: Criar o componente**

`src/components/boost/boost-flow.tsx`:
```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Check } from "lucide-react";
import { createBoostChargeAction } from "@/lib/actions/boosts";
import { PixCheckout, type PixCharge } from "@/components/payments/pix-checkout";

type Step = "intro" | "qrcode" | "paid";

export function BoostFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("intro");
  const [charge, setCharge] = useState<PixCharge | null>(null);
  const [pending, start] = useTransition();

  const onGenerate = () =>
    start(async () => {
      const r = await createBoostChargeAction("destaque");
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setCharge({ chargeId: r.chargeId, brCode: r.brCode, brCodeBase64: r.brCodeBase64, amount: r.amount });
      setStep("qrcode");
    });

  if (step === "paid") {
    return (
      <Card className="space-y-3 p-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-400/20">
          <Check className="size-6 text-amber-600" />
        </div>
        <h2 className="text-lg font-semibold">Destaque ativado! ⭐</h2>
        <p className="text-sm text-muted-foreground">
          Por 7 dias você aparece no topo do Explorar de quem tem troca com você.
        </p>
        <Button onClick={() => router.push("/explorar")} className="w-full">
          Ver o Explorar
        </Button>
      </Card>
    );
  }

  if (step === "qrcode" && charge) {
    return (
      <PixCheckout
        charge={charge}
        onPaid={() => { setStep("paid"); router.refresh(); }}
        onExpired={() => { setStep("intro"); setCharge(null); }}
        onCancel={() => { setStep("intro"); setCharge(null); }}
      />
    );
  }

  return (
    <Card className="space-y-3 p-6">
      <div className="flex items-center gap-2">
        <Sparkles className="size-5 text-amber-500" aria-hidden />
        <h2 className="text-lg font-bold">Destacar meu perfil</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Por <strong>R$ 4,90</strong> você fica <strong>7 dias</strong> no topo do Explorar de
        quem tem troca com você, com selo ⭐. Pagamento único via PIX.
      </p>
      <Button onClick={onGenerate} disabled={pending} className="w-full" size="lg" variant="festa">
        {pending ? "Gerando PIX…" : "Destacar por R$ 4,90"}
      </Button>
    </Card>
  );
}
```

- [ ] **Step 2: Verificar e commitar**

Run: `npx tsc --noEmit` → exit 0; `npm run build` → sucesso
```bash
git add src/components/boost/boost-flow.tsx
git commit -m "feat(boost): componente BoostFlow"
```

---

## Task 9: Pontos de entrada (Explorar + Conta/Premium)

**Files:**
- Modify: `src/app/(app)/explorar/page.tsx`
- Modify: `src/app/(app)/conta/premium/page.tsx`

- [ ] **Step 1: Status + CTA no topo do Explorar**

Ler `src/app/(app)/explorar/page.tsx`. No topo do componente (server component), importar `getMyBoost` e `BoostFlow`:
```tsx
import { getMyBoost } from "@/lib/actions/boosts";
import { BoostFlow } from "@/components/boost/boost-flow";
```
Buscar o boost junto dos dados já carregados: `const myBoost = await getMyBoost();`
Renderizar, logo abaixo do header/filtros e antes da lista de matches:
```tsx
        {myBoost ? (
          <p className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-sm text-amber-700">
            ⭐ Destaque ativo até{" "}
            {new Date(myBoost.expires_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
          </p>
        ) : (
          <BoostFlow />
        )}
```

- [ ] **Step 2: CTA do boost em `/conta/premium`**

Ler `src/app/(app)/conta/premium/page.tsx`. Importar `BoostFlow` e `getMyBoost`. Abaixo do bloco existente (tanto no caso `is_premium` quanto no `<PremiumFlow />`), renderizar `getMyBoost()` → status ou `<BoostFlow />` (mesmo padrão do Step 1). O boost é independente de ser Premium.

- [ ] **Step 3: Verificar e commitar**

Run: `npx tsc --noEmit` → exit 0; `npm run build` → sucesso
```bash
git add "src/app/(app)/explorar/page.tsx" "src/app/(app)/conta/premium/page.tsx"
git commit -m "feat(boost): CTA e status de Destaque no Explorar e Conta"
```

---

## Task 10: Teste de ranking + verificação manual ponta-a-ponta

**Files:**
- Modify: `src/tests/boosts.test.ts` (adicionar teste de ranking)

- [ ] **Step 1: Adicionar teste de ranking (boosted-first)**

Acrescentar ao `describe` de `src/tests/boosts.test.ts` um teste que cria viewer + 2 candidatos com match equivalente e confirma que o destacado vem primeiro:
```ts
  it("trocas_find_matches põe o destacado no topo entre matches equivalentes", async () => {
    // pega 2 sticker codes reais
    const { data: sts } = await admin.from("trocas_stickers").select("code").limit(2);
    const [s1, s2] = (sts ?? []).map((r) => r.code);
    expect(s1 && s2).toBeTruthy();

    const mk = async () => {
      const u = await admin.auth.admin.createUser({
        email: `m-${rand()}@trocas-test.local`, password: "pwd12345", email_confirm: true,
      });
      return u.data.user!.id;
    };
    const viewer = await mk();
    const candA = await mk();
    const candB = await mk();
    const cleanup = [viewer, candA, candB];

    try {
      // viewer: tem s1 repetida (dá), não tem s2 (recebe)
      await admin.from("trocas_user_stickers").insert([
        { user_id: viewer, sticker_code: s1, owned_count: 2 },
      ]);
      // candA e candB: faltam s1 (recebem do viewer) e têm s2 repetida (dão pro viewer)
      for (const c of [candA, candB]) {
        await admin.from("trocas_user_stickers").insert([
          { user_id: c, sticker_code: s2, owned_count: 2 },
        ]);
      }
      // boost só no candB
      await admin.rpc("trocas_grant_boost", { p_user_id: candB, p_kind: "destaque", p_days: 7, p_charge_id: "ch_rank" });

      // chama como viewer (precisa estar autenticado p/ auth.uid())
      const client = createClient<Database>(URL, ANON, { auth: { persistSession: false } });
      const vEmail = (await admin.auth.admin.getUserById(viewer)).data.user!.email!;
      await client.auth.signInWithPassword({ email: vEmail, password: "pwd12345" });

      const { data: matches, error } = await client.rpc("trocas_find_matches", {
        p_radius_km: 100000, p_limit: 50, p_search: null, p_state: null, p_only_with_matches: true,
      });
      expect(error).toBeNull();
      const ids = (matches ?? []).map((m) => m.other_user);
      const ia = ids.indexOf(candA);
      const ib = ids.indexOf(candB);
      expect(ib).toBeGreaterThanOrEqual(0); // candB aparece
      expect(ib).toBeLessThan(ia === -1 ? Number.MAX_SAFE_INTEGER : ia); // destacado antes
      expect((matches ?? []).find((m) => m.other_user === candB)?.is_boosted).toBe(true);
    } finally {
      for (const id of cleanup) await admin.auth.admin.deleteUser(id);
    }
  });
```
(Nota: sem localização nos perfis de teste, `distance_km` é null e o score vira `least(give,get)` — A e B empatam, então o desempate é o `is_boosted`.)

- [ ] **Step 2: Rodar o teste**

Run: `npm test -- boosts`
Expected: PASS (grant + RLS + ranking).

- [ ] **Step 3: Verificação manual ponta-a-ponta (devMode)**

1. Garantir que `ABACATEPAY_API_KEY` no ambiente é uma chave **dev** (`abc_dev_...`).
2. Em `/explorar` (ou `/conta/premium`), clicar **"Destacar por R$ 4,90"** → o QR PIX aparece.
3. Confirmar que entrou linha em `trocas_billing` com `product = 'boost_destaque'`, `status = 'PENDING'`.
4. Simular o pagamento (endpoint "Simular Pagamento" da AbacatePay em devMode, ou o webhook local `npm run abacate:trigger`).
5. Confirmar: `trocas_boosts` tem linha com `expires_at ≈ now()+7d`; a UI vira "⭐ Destaque ativo até DD/MM".
6. Em outra conta que tenha troca com a primeira, abrir `/explorar` e confirmar o selo ⭐ e a posição no topo.

- [ ] **Step 4: Commit**

```bash
git add src/tests/boosts.test.ts
git commit -m "test(boost): ranking destacado-no-topo + verificação manual"
```

---

## Notas de execução

- **Ordem importa:** Task 1 (migration aplicada) é pré-requisito de todo o resto — os testes e o `tsc` dependem dela.
- **Sem cron:** a expiração é sempre `expires_at > now()` em tempo de query.
- **Não fazer push/deploy automático** — seguir o fluxo combinado (o dono dá o push quando quiser publicar).
- **Fatias futuras** (fora deste plano): Alcance multi-cidade, Passe da Copa, badge de fundador, alerta de proximidade.
