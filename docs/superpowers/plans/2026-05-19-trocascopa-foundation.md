# TrocasCopa — Plano 1: Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar a base do TrocasCopa — projeto Next.js 16 inicializado, Supabase configurado com `profiles` + RLS, fluxo de auth (email/senha + Google), onboarding com captura de GPS, página de conta e app shell com tabs. Ao fim deste plano, um usuário consegue criar conta, completar perfil com localização, ver `/conta` e fazer logout.

**Architecture:** Next.js 16 App Router + Server Components + Server Actions na Vercel. Supabase Postgres + PostGIS + Auth + Storage. Tailwind + shadcn/ui. PWA mobile-first.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui, `@supabase/ssr`, `@supabase/supabase-js`, PostGIS, Vitest (smoke tests).

**Plano subsequente:** Plano 2 (Álbum), Plano 3 (Explorar + Geo), Plano 4 (Chat + Realtime). Este plano não toca essas features além do scaffolding das páginas-placeholder.

**Referência:** spec em `docs/superpowers/specs/2026-05-19-trocascopa-design.md`.

---

## Estrutura de arquivos esperada ao fim do plano

```
trocas_copa/
├── docs/superpowers/
│   ├── specs/2026-05-19-trocascopa-design.md
│   └── plans/2026-05-19-trocascopa-foundation.md
├── public/
│   ├── manifest.webmanifest
│   ├── icon-192.png  (placeholder)
│   └── icon-512.png  (placeholder)
├── supabase/
│   └── migrations/
│       ├── 20260519_0001_extensions.sql
│       ├── 20260519_0002_profiles.sql
│       ├── 20260519_0003_profiles_rls.sql
│       ├── 20260519_0004_public_profiles_view.sql
│       ├── 20260519_0005_handle_new_user.sql
│       └── 20260519_0006_storage_avatars.sql
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                 (Início)
│   │   ├── globals.css
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── cadastro/page.tsx
│   │   │   ├── esqueci-senha/page.tsx
│   │   │   ├── callback/route.ts    (OAuth callback)
│   │   │   └── layout.tsx
│   │   ├── (app)/
│   │   │   ├── layout.tsx           (com TabBar)
│   │   │   ├── explorar/page.tsx    (placeholder)
│   │   │   ├── album/page.tsx       (placeholder)
│   │   │   ├── chat/page.tsx        (placeholder)
│   │   │   └── conta/page.tsx
│   │   ├── onboarding/
│   │   │   ├── page.tsx             (redireciona pro step atual)
│   │   │   ├── perfil/page.tsx
│   │   │   └── localizacao/page.tsx
│   │   └── api/
│   │       └── (vazio neste plano)
│   ├── components/
│   │   ├── ui/                      (shadcn)
│   │   ├── tab-bar.tsx
│   │   ├── auth-form.tsx
│   │   ├── profile-form.tsx
│   │   ├── location-capture.tsx
│   │   └── avatar-upload.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts            (browser)
│   │   │   ├── server.ts            (RSC + Server Actions)
│   │   │   └── middleware.ts        (refresh session)
│   │   ├── actions/
│   │   │   ├── auth.ts              (login, signup, logout, oauth)
│   │   │   └── profile.ts           (update, upload avatar, set location)
│   │   └── env.ts                   (validação de envs)
│   ├── types/
│   │   └── supabase.ts              (gerado pela CLI)
│   ├── middleware.ts
│   └── tests/
│       └── rls-profiles.test.ts
├── .env.local                       (não commitado)
├── .env.example
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── components.json                  (shadcn)
└── vitest.config.ts
```

---

## Fase 1 — Bootstrap do projeto

### Task 1: Inicializar Next.js 16 + Git

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `.gitignore`

- [ ] **Step 1.1: Verificar que o diretório está vazio**

```bash
cd /c/Users/Usuario/Desktop/Projetos/trocas_copa
ls -la
```

Expected: só `.` e `..` (plus o diretório `docs/`).

- [ ] **Step 1.2: Inicializar git**

```bash
git init -b main
```

Expected: `Initialized empty Git repository`.

- [ ] **Step 1.3: Rodar create-next-app**

```bash
npx create-next-app@latest . --typescript --tailwind --app --src-dir --turbopack --import-alias "@/*" --use-npm --yes
```

Expected: Projeto criado em ~30s. Não aceita flags conflitantes — se reclamar de diretório não vazio (por causa de `docs/`), use:

```bash
npx create-next-app@latest temp-tcopa --typescript --tailwind --app --src-dir --turbopack --import-alias "@/*" --use-npm --yes
mv temp-tcopa/* temp-tcopa/.* . 2>/dev/null || true
rm -rf temp-tcopa
```

- [ ] **Step 1.4: Confirmar versões**

```bash
npm pkg get dependencies.next dependencies.react
```

Expected: `next` ≥ 16.0.0, `react` ≥ 19.

Se a versão for menor, force:
```bash
npm install next@latest react@latest react-dom@latest
```

- [ ] **Step 1.5: Rodar dev server e abrir**

```bash
npm run dev
```

Abra http://localhost:3000 — deve ver a página de boas-vindas do Next.js. Pare o server com Ctrl+C.

- [ ] **Step 1.6: Commit**

```bash
git add .
git commit -m "chore: bootstrap Next.js 16 with TypeScript, Tailwind, App Router"
```

---

### Task 2: Instalar e configurar shadcn/ui

**Files:**
- Create: `components.json`, `src/components/ui/button.tsx`, `src/components/ui/input.tsx`, `src/components/ui/label.tsx`, `src/components/ui/card.tsx`, `src/components/ui/avatar.tsx`, `src/components/ui/sonner.tsx`, `src/lib/utils.ts`
- Modify: `src/app/globals.css` (CSS vars do shadcn), `tailwind.config.ts`

- [ ] **Step 2.1: Inicializar shadcn/ui**

```bash
npx shadcn@latest init -d
```

Quando perguntado:
- Style: **New York**
- Base color: **Slate**
- CSS variables: **Yes**

Espera: cria `components.json`, atualiza `globals.css` com tokens, cria `src/lib/utils.ts`.

- [ ] **Step 2.2: Adicionar componentes base**

```bash
npx shadcn@latest add button input label card avatar sonner skeleton dropdown-menu form
```

Espera: arquivos em `src/components/ui/`.

- [ ] **Step 2.3: Verificar build**

```bash
npm run build
```

Expected: build conclui sem erros.

- [ ] **Step 2.4: Commit**

```bash
git add .
git commit -m "chore: add shadcn/ui with base components"
```

---

### Task 3: Configurar layout base, fontes e PWA manifest

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `public/manifest.webmanifest`, `src/app/icon.png` (placeholder), `public/icon-192.png`, `public/icon-512.png`

- [ ] **Step 3.1: Atualizar `src/app/layout.tsx`**

```tsx
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'TrocasCopa',
  description: 'Troque figurinhas da Copa 2026 com colecionadores perto de você.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'TrocasCopa', statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="min-h-dvh bg-background font-sans antialiased">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
```

- [ ] **Step 3.2: Criar manifest**

Arquivo `public/manifest.webmanifest`:

```json
{
  "name": "TrocasCopa",
  "short_name": "TrocasCopa",
  "description": "Troque figurinhas da Copa 2026",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#0a0a0a",
  "orientation": "portrait",
  "lang": "pt-BR",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

- [ ] **Step 3.3: Gerar ícones placeholder**

```bash
node -e "const fs=require('fs');const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');fs.writeFileSync('public/icon-192.png',png);fs.writeFileSync('public/icon-512.png',png);"
```

(Vai gerar 1px transparente — substituir por arte real em fase posterior.)

- [ ] **Step 3.4: Verificar build e dev**

```bash
npm run build && npm run dev
```

Abra http://localhost:3000, abra DevTools → Application → Manifest. Deve carregar `manifest.webmanifest` sem erro. Stop o server.

- [ ] **Step 3.5: Commit**

```bash
git add .
git commit -m "chore: configure root layout, fonts, and PWA manifest"
```

---

## Fase 2 — Supabase backend

### Task 4: Criar projeto Supabase e configurar envs

**Files:**
- Create: `.env.local` (gitignored), `.env.example`, `src/lib/env.ts`

- [ ] **Step 4.1: Listar organizações Supabase**

Use o MCP tool `mcp__claude_ai_Supabase__list_organizations` para descobrir o `org_id`.

- [ ] **Step 4.2: Criar projeto**

Use `mcp__claude_ai_Supabase__get_cost` com `type: "project"` e o `organization_id` para confirmar custo. Aceite com `mcp__claude_ai_Supabase__confirm_cost`. Então crie o projeto:

```
mcp__claude_ai_Supabase__create_project
  name: "trocas-copa"
  organization_id: <id>
  region: "sa-east-1"   # São Paulo
  confirm_cost_id: <returned>
```

Anote `project_id`, espere o status ficar `ACTIVE_HEALTHY` (~2min). Pode verificar com `mcp__claude_ai_Supabase__get_project`.

- [ ] **Step 4.3: Capturar URL e chave publishable**

```
mcp__claude_ai_Supabase__get_project_url        project_id
mcp__claude_ai_Supabase__get_publishable_keys   project_id
```

- [ ] **Step 4.4: Criar `.env.example`**

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- [ ] **Step 4.5: Criar `.env.local`** (não commitado — `.gitignore` já inclui)

```
NEXT_PUBLIC_SUPABASE_URL=<url do step 4.3>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key>
SUPABASE_SERVICE_ROLE_KEY=<service role — peça ao usuário pegar no dashboard >
```

> **Nota:** A `service_role_key` NÃO é retornada pelo MCP por segurança. O usuário precisa copiar do dashboard Supabase: Settings → API → service_role secret. Pause aqui e pergunte ao usuário se ainda não tem.

- [ ] **Step 4.6: Criar validador de envs**

`src/lib/env.ts`:

```ts
const required = (key: string): string => {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env: ${key}`);
  return v;
};

export const env = {
  SUPABASE_URL: required('NEXT_PUBLIC_SUPABASE_URL'),
  SUPABASE_PUBLISHABLE_KEY: required('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'),
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
};
```

- [ ] **Step 4.7: Commit**

```bash
git add .env.example src/lib/env.ts
git commit -m "chore: link Supabase project and add env scaffolding"
```

---

### Task 5: Migration — extensions + tabela `profiles`

**Files:**
- Create: `supabase/migrations/20260519_0001_extensions.sql`, `supabase/migrations/20260519_0002_profiles.sql`

- [ ] **Step 5.1: Criar migration de extensions**

Arquivo `supabase/migrations/20260519_0001_extensions.sql`:

```sql
create extension if not exists postgis;
create extension if not exists pgcrypto;
```

- [ ] **Step 5.2: Aplicar via MCP**

```
mcp__claude_ai_Supabase__apply_migration
  project_id: <id>
  name: "extensions"
  query: <conteúdo do .sql>
```

Verifique com `mcp__claude_ai_Supabase__list_extensions` — `postgis` e `pgcrypto` devem estar instaladas.

- [ ] **Step 5.3: Criar migration de profiles**

Arquivo `supabase/migrations/20260519_0002_profiles.sql`:

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (username ~ '^[a-z0-9_]{3,30}$'),
  full_name text not null check (char_length(full_name) between 2 and 100),
  avatar_url text,
  bio text check (char_length(bio) <= 280),
  city text,
  state char(2) check (state ~ '^[A-Z]{2}$'),
  location geography(Point, 4326),
  location_updated_at timestamptz,
  is_premium boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_location_gix on public.profiles using gist (location);
create index profiles_state_idx on public.profiles (state);
create index profiles_username_lower_idx on public.profiles (lower(username));

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
```

- [ ] **Step 5.4: Aplicar via MCP**

```
mcp__claude_ai_Supabase__apply_migration
  project_id: <id>
  name: "profiles"
  query: <conteúdo>
```

- [ ] **Step 5.5: Verificar com list_tables**

```
mcp__claude_ai_Supabase__list_tables  project_id: <id>  schemas: ["public"]
```

Expected: `profiles` aparece com todas as colunas e índices.

- [ ] **Step 5.6: Commit**

```bash
git add supabase/migrations/
git commit -m "feat(db): add profiles table with PostGIS location"
```

---

### Task 6: Migration — RLS e view `public_profiles`

**Files:**
- Create: `supabase/migrations/20260519_0003_profiles_rls.sql`, `supabase/migrations/20260519_0004_public_profiles_view.sql`

- [ ] **Step 6.1: Criar migration de RLS**

`supabase/migrations/20260519_0003_profiles_rls.sql`:

```sql
alter table public.profiles enable row level security;

create policy "profiles read all"
  on public.profiles for select using (true);

create policy "profiles insert self"
  on public.profiles for insert with check (auth.uid() = id);

create policy "profiles update self"
  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
```

Aplicar via MCP `apply_migration` com nome `profiles_rls`.

- [ ] **Step 6.2: Criar view pública sem location**

`supabase/migrations/20260519_0004_public_profiles_view.sql`:

```sql
create view public.public_profiles
with (security_invoker = on) as
select
  id, username, full_name, avatar_url, bio, city, state, is_premium, created_at
from public.profiles;

grant select on public.public_profiles to anon, authenticated;
```

Aplicar via MCP com nome `public_profiles_view`.

- [ ] **Step 6.3: Verificar com get_advisors**

```
mcp__claude_ai_Supabase__get_advisors
  project_id: <id>
  type: "security"
```

Expected: nenhum warning sobre `profiles` sem RLS. Se aparecer aviso sobre `public_profiles` view, ignore (intencional).

- [ ] **Step 6.4: Commit**

```bash
git add supabase/migrations/
git commit -m "feat(db): enable RLS on profiles and add public_profiles view"
```

---

### Task 7: Migration — trigger `handle_new_user`

Cria `profiles` automaticamente quando um usuário é criado em `auth.users`.

**Files:**
- Create: `supabase/migrations/20260519_0005_handle_new_user.sql`

- [ ] **Step 7.1: Criar migration**

```sql
create or replace function public.handle_new_user()
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
  -- 1. extrai base do email (parte antes do @)
  base_username := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9_]', '', 'g'));
  if char_length(base_username) < 3 then
    base_username := 'user' || substr(new.id::text, 1, 6);
  elsif char_length(base_username) > 26 then
    base_username := substr(base_username, 1, 26);
  end if;

  candidate := base_username;

  -- 2. resolve colisão de username com sufixo numérico
  while exists (select 1 from public.profiles where username = candidate) loop
    suffix := suffix + 1;
    candidate := base_username || suffix::text;
  end loop;

  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    candidate,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', candidate)
  );

  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

Aplicar via MCP com nome `handle_new_user`.

- [ ] **Step 7.2: Teste manual via SQL**

```
mcp__claude_ai_Supabase__execute_sql
  project_id: <id>
  query: "select id, username, full_name from public.profiles limit 5;"
```

Por enquanto retorna vazio — só populará quando alguém criar conta.

- [ ] **Step 7.3: Commit**

```bash
git add supabase/migrations/
git commit -m "feat(db): auto-create profile on auth.users insert"
```

---

### Task 8: Migration — Storage bucket `avatars`

**Files:**
- Create: `supabase/migrations/20260519_0006_storage_avatars.sql`

- [ ] **Step 8.1: Criar migration**

```sql
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatar read public"
  on storage.objects for select using (bucket_id = 'avatars');

create policy "avatar upload own"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatar update own"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatar delete own"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
```

Aplicar via MCP com nome `storage_avatars`.

- [ ] **Step 8.2: Commit**

```bash
git add supabase/migrations/
git commit -m "feat(storage): create avatars bucket with per-user RLS"
```

---

### Task 9: Gerar tipos TS e setup dos clientes Supabase

**Files:**
- Create: `src/types/supabase.ts`, `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`, `src/middleware.ts`
- Install: `@supabase/ssr`, `@supabase/supabase-js`

- [ ] **Step 9.1: Instalar libs**

```bash
npm install @supabase/ssr @supabase/supabase-js
```

- [ ] **Step 9.2: Gerar tipos**

```
mcp__claude_ai_Supabase__generate_typescript_types
  project_id: <id>
```

Salvar o output em `src/types/supabase.ts`.

- [ ] **Step 9.3: Criar client browser**

`src/lib/supabase/client.ts`:

```ts
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';
import { env } from '@/lib/env';

export const createClient = () =>
  createBrowserClient<Database>(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY);
```

- [ ] **Step 9.4: Criar client server (RSC + Server Actions)**

`src/lib/supabase/server.ts`:

```ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';
import { env } from '@/lib/env';

export const createClient = async () => {
  const cookieStore = await cookies();
  return createServerClient<Database>(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // chamado de RSC sem mutação — ignorar
        }
      },
    },
  });
};
```

- [ ] **Step 9.5: Criar helper de middleware (refresh session)**

`src/lib/supabase/middleware.ts`:

```ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/supabase';
import { env } from '@/lib/env';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const path = url.pathname;
  const isAuthRoute = path.startsWith('/login') || path.startsWith('/cadastro') || path.startsWith('/esqueci-senha') || path.startsWith('/callback');
  const isPublic = isAuthRoute || path === '/manifest.webmanifest' || path.startsWith('/_next') || path.startsWith('/icon');

  if (!user && !isPublic) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  if (user && isAuthRoute) {
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return response;
}
```

- [ ] **Step 9.6: Criar `src/middleware.ts`**

```ts
import { updateSession } from '@/lib/supabase/middleware';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

- [ ] **Step 9.7: Verificar build**

```bash
npm run build
```

Expected: build conclui. (Sem testes ainda — só TypeScript checa tipos.)

- [ ] **Step 9.8: Commit**

```bash
git add .
git commit -m "feat: setup Supabase clients (browser, server, middleware) and types"
```

---

## Fase 3 — Auth

### Task 10: Habilitar Google OAuth no Supabase (manual)

**Files:** documentação inline

- [ ] **Step 10.1: Pedir ao usuário para criar OAuth client no Google Cloud Console**

Pause e instrua:

> Abra https://console.cloud.google.com/apis/credentials → Create Credentials → OAuth client ID → Web application.
>
> - Authorized JavaScript origins: `http://localhost:3000`, `https://<seu-domínio-vercel>`
> - Authorized redirect URIs: `https://<project-ref>.supabase.co/auth/v1/callback`
>
> Copie o Client ID e Client Secret.

- [ ] **Step 10.2: Pedir ao usuário para colar no Supabase**

> Dashboard Supabase → Authentication → Providers → Google → Enable.
> Cole Client ID + Secret, salve.

> Em Authentication → URL Configuration:
> - Site URL: `http://localhost:3000`
> - Additional redirect URLs: `http://localhost:3000/callback`, `https://<deploy>/callback`

- [ ] **Step 10.3: Documentar no README**

Crie `README.md` (substituindo o do Next):

```markdown
# TrocasCopa

PWA para colecionadores do álbum Panini FIFA World Cup 2026.

## Setup local

1. Clone o repo.
2. `npm install`
3. Copie `.env.example` para `.env.local` e preencha com seu projeto Supabase.
4. `npm run dev`

## Provedores OAuth

Veja `docs/oauth-setup.md` para configurar Google.
```

E crie `docs/oauth-setup.md` com o passo-a-passo do step 10.1 e 10.2.

- [ ] **Step 10.4: Commit**

```bash
git add README.md docs/oauth-setup.md
git commit -m "docs: setup README and OAuth configuration guide"
```

---

### Task 11: Server Actions de auth

**Files:**
- Create: `src/lib/actions/auth.ts`, `src/app/(auth)/callback/route.ts`

- [ ] **Step 11.1: Criar `src/lib/actions/auth.ts`**

```ts
'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { env } from '@/lib/env';

type ActionResult = { error?: string };

export async function signupAction(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const fullName = String(formData.get('full_name') ?? '').trim();

  if (!email || !password || !fullName) return { error: 'Preencha todos os campos.' };
  if (password.length < 8) return { error: 'Senha precisa ter pelo menos 8 caracteres.' };

  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${origin}/callback`,
    },
  });
  if (error) return { error: error.message };

  redirect('/onboarding/perfil');
}

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: 'E-mail ou senha incorretos.' };

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function loginWithGoogleAction(): Promise<ActionResult> {
  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${origin}/callback?next=/` },
  });
  if (error) return { error: error.message };
  redirect(data.url);
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function resetPasswordAction(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get('email') ?? '').trim();
  if (!email) return { error: 'Informe o e-mail.' };

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/callback?next=/conta`,
  });
  if (error) return { error: error.message };
  return {};
}
```

- [ ] **Step 11.2: Criar callback route**

`src/app/(auth)/callback/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}
```

- [ ] **Step 11.3: Verificar tipos**

```bash
npm run build
```

Expected: passa.

- [ ] **Step 11.4: Commit**

```bash
git add .
git commit -m "feat(auth): add server actions and OAuth callback route"
```

---

### Task 12: UI de login, cadastro e reset

**Files:**
- Create: `src/app/(auth)/layout.tsx`, `src/app/(auth)/login/page.tsx`, `src/app/(auth)/cadastro/page.tsx`, `src/app/(auth)/esqueci-senha/page.tsx`, `src/components/auth-form.tsx`

- [ ] **Step 12.1: Layout do grupo (auth)**

`src/app/(auth)/layout.tsx`:

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm space-y-6">
        <header className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">TrocasCopa</h1>
          <p className="text-sm text-muted-foreground">Copa 2026 — figurinhas Panini</p>
        </header>
        {children}
      </div>
    </main>
  );
}
```

- [ ] **Step 12.2: Componente `AuthForm`**

`src/components/auth-form.tsx`:

```tsx
'use client';

import { useTransition, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Mode = 'login' | 'signup' | 'reset';

interface Props {
  mode: Mode;
  action: (formData: FormData) => Promise<{ error?: string } | void>;
  googleAction?: () => Promise<{ error?: string } | void>;
}

export function AuthForm({ mode, action, googleAction }: Props) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const submit = (formData: FormData) => {
    setError(null);
    start(async () => {
      const result = await action(formData);
      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
      } else if (mode === 'reset') {
        toast.success('Link enviado para seu e-mail.');
      }
    });
  };

  return (
    <form action={submit} className="space-y-4">
      {mode === 'signup' && (
        <div className="space-y-2">
          <Label htmlFor="full_name">Nome completo</Label>
          <Input id="full_name" name="full_name" required autoComplete="name" />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>

      {mode !== 'reset' && (
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input id="password" name="password" type="password" required minLength={8} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Aguarde…' : mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar conta' : 'Enviar link'}
      </Button>

      {googleAction && (
        <Button type="button" variant="outline" className="w-full" disabled={pending}
          onClick={() => start(() => googleAction().then((r) => r?.error && toast.error(r.error)))}>
          Entrar com Google
        </Button>
      )}
    </form>
  );
}
```

- [ ] **Step 12.3: Páginas**

`src/app/(auth)/login/page.tsx`:

```tsx
import Link from 'next/link';
import { AuthForm } from '@/components/auth-form';
import { loginAction, loginWithGoogleAction } from '@/lib/actions/auth';

export default function LoginPage() {
  return (
    <div className="space-y-4">
      <AuthForm mode="login" action={loginAction} googleAction={loginWithGoogleAction} />
      <div className="flex justify-between text-sm">
        <Link href="/esqueci-senha" className="underline text-muted-foreground">Esqueci a senha</Link>
        <Link href="/cadastro" className="underline">Criar conta</Link>
      </div>
    </div>
  );
}
```

`src/app/(auth)/cadastro/page.tsx`:

```tsx
import Link from 'next/link';
import { AuthForm } from '@/components/auth-form';
import { signupAction, loginWithGoogleAction } from '@/lib/actions/auth';

export default function SignupPage() {
  return (
    <div className="space-y-4">
      <AuthForm mode="signup" action={signupAction} googleAction={loginWithGoogleAction} />
      <p className="text-sm text-center text-muted-foreground">
        Já tem conta? <Link href="/login" className="underline">Entrar</Link>
      </p>
    </div>
  );
}
```

`src/app/(auth)/esqueci-senha/page.tsx`:

```tsx
import Link from 'next/link';
import { AuthForm } from '@/components/auth-form';
import { resetPasswordAction } from '@/lib/actions/auth';

export default function ResetPage() {
  return (
    <div className="space-y-4">
      <AuthForm mode="reset" action={resetPasswordAction} />
      <p className="text-sm text-center">
        <Link href="/login" className="underline">Voltar ao login</Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 12.4: Teste manual**

```bash
npm run dev
```

1. Acesse http://localhost:3000 — deve redirecionar para `/login`.
2. Crie conta com email/senha.
3. Verifique no Supabase Dashboard → Authentication → Users que o usuário existe.
4. Verifique via MCP que tem linha em `public.profiles`:

```
mcp__claude_ai_Supabase__execute_sql
  project_id: <id>
  query: "select id, username, full_name from public.profiles order by created_at desc limit 5;"
```

5. Faça login.
6. Stop o server.

- [ ] **Step 12.5: Commit**

```bash
git add .
git commit -m "feat(auth): login, signup, password reset pages"
```

---

## Fase 4 — Onboarding e Perfil

### Task 13: Página `/onboarding/perfil` (username + nome)

**Files:**
- Create: `src/app/onboarding/page.tsx`, `src/app/onboarding/perfil/page.tsx`, `src/components/profile-form.tsx`, `src/lib/actions/profile.ts`

- [ ] **Step 13.1: Server action de perfil**

`src/lib/actions/profile.ts`:

```ts
'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

type Result = { error?: string };

export async function updateProfileAction(formData: FormData): Promise<Result> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado.' };

  const username = String(formData.get('username') ?? '').trim().toLowerCase();
  const full_name = String(formData.get('full_name') ?? '').trim();
  const bio = String(formData.get('bio') ?? '').trim() || null;

  if (!/^[a-z0-9_]{3,30}$/.test(username)) {
    return { error: 'Username deve ter 3-30 caracteres (letras minúsculas, números, _).' };
  }
  if (full_name.length < 2) return { error: 'Nome muito curto.' };

  const { error } = await supabase
    .from('profiles')
    .update({ username, full_name, bio })
    .eq('id', user.id);

  if (error) {
    if (error.code === '23505') return { error: 'Esse username já está em uso.' };
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  return {};
}

export async function setLocationAction(latitude: number, longitude: number, city: string, state: string): Promise<Result> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado.' };

  if (!/^[A-Z]{2}$/.test(state)) return { error: 'UF inválida.' };
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return { error: 'Coordenadas inválidas.' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      location: `SRID=4326;POINT(${longitude} ${latitude})`,
      location_updated_at: new Date().toISOString(),
      city,
      state,
    })
    .eq('id', user.id);

  if (error) return { error: error.message };
  revalidatePath('/', 'layout');
  return {};
}
```

- [ ] **Step 13.2: Página de roteamento `/onboarding`**

`src/app/onboarding/page.tsx`:

```tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function OnboardingIndex() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, location')
    .eq('id', user.id)
    .single();

  if (!profile?.username || profile.username.startsWith('user')) {
    redirect('/onboarding/perfil');
  }
  if (!profile.location) {
    redirect('/onboarding/localizacao');
  }
  redirect('/');
}
```

- [ ] **Step 13.3: Form de perfil**

`src/components/profile-form.tsx`:

```tsx
'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateProfileAction } from '@/lib/actions/profile';

interface Props {
  initial: { username: string; full_name: string; bio: string | null };
  nextHref?: string;
}

export function ProfileForm({ initial, nextHref }: Props) {
  const [pending, start] = useTransition();
  const router = useRouter();

  const submit = (formData: FormData) => {
    start(async () => {
      const result = await updateProfileAction(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Perfil salvo.');
      if (nextHref) router.push(nextHref);
    });
  };

  return (
    <form action={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">Nome completo</Label>
        <Input id="full_name" name="full_name" defaultValue={initial.full_name} required minLength={2} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input id="username" name="username" defaultValue={initial.username} required pattern="^[a-z0-9_]{3,30}$" />
        <p className="text-xs text-muted-foreground">3-30 caracteres, minúsculas, números e _.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="bio">Bio (opcional)</Label>
        <Input id="bio" name="bio" defaultValue={initial.bio ?? ''} maxLength={280} />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Salvando…' : 'Salvar e continuar'}
      </Button>
    </form>
  );
}
```

- [ ] **Step 13.4: Página `/onboarding/perfil`**

`src/app/onboarding/perfil/page.tsx`:

```tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProfileForm } from '@/components/profile-form';

export default async function OnboardingProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, full_name, bio')
    .eq('id', user.id)
    .single();

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <header className="mb-8 space-y-1">
        <p className="text-sm text-muted-foreground">Passo 1 de 2</p>
        <h1 className="text-2xl font-semibold">Seu perfil</h1>
        <p className="text-sm text-muted-foreground">É assim que outros colecionadores vão te ver.</p>
      </header>
      <ProfileForm initial={profile!} nextHref="/onboarding/localizacao" />
    </main>
  );
}
```

- [ ] **Step 13.5: Commit**

```bash
git add .
git commit -m "feat(onboarding): profile setup page with username and name"
```

---

### Task 14: Captura de localização via GPS

**Files:**
- Create: `src/app/onboarding/localizacao/page.tsx`, `src/components/location-capture.tsx`

- [ ] **Step 14.1: Componente client de captura**

`src/components/location-capture.tsx`:

```tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { setLocationAction } from '@/lib/actions/profile';

interface Props { nextHref?: string }

interface ResolvedLocation {
  latitude: number;
  longitude: number;
  city: string;
  state: string;
}

async function reverseGeocode(lat: number, lng: number): Promise<{ city: string; state: string }> {
  // Usa Nominatim do OpenStreetMap (gratuito, sem chave). Em produção, considerar Google Geocoding.
  const r = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=10&accept-language=pt-BR`,
    { headers: { 'User-Agent': 'TrocasCopa/1.0' } },
  );
  if (!r.ok) throw new Error('reverse-geocode failed');
  const json = await r.json();
  const addr = json.address ?? {};
  const city =
    addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? addr.county ?? 'Cidade desconhecida';
  const stateMap: Record<string, string> = {
    'Acre':'AC','Alagoas':'AL','Amapá':'AP','Amazonas':'AM','Bahia':'BA','Ceará':'CE',
    'Distrito Federal':'DF','Espírito Santo':'ES','Goiás':'GO','Maranhão':'MA','Mato Grosso':'MT',
    'Mato Grosso do Sul':'MS','Minas Gerais':'MG','Pará':'PA','Paraíba':'PB','Paraná':'PR',
    'Pernambuco':'PE','Piauí':'PI','Rio de Janeiro':'RJ','Rio Grande do Norte':'RN',
    'Rio Grande do Sul':'RS','Rondônia':'RO','Roraima':'RR','Santa Catarina':'SC',
    'São Paulo':'SP','Sergipe':'SE','Tocantins':'TO',
  };
  const state = stateMap[addr.state] ?? 'SP';
  return { city, state };
}

export function LocationCapture({ nextHref }: Props) {
  const [pending, start] = useTransition();
  const [resolved, setResolved] = useState<ResolvedLocation | null>(null);
  const router = useRouter();

  const detect = () => {
    if (!navigator.geolocation) {
      toast.error('Seu navegador não suporta geolocalização.');
      return;
    }
    start(async () => {
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 15000 }),
        );
        const { latitude, longitude } = pos.coords;
        const { city, state } = await reverseGeocode(latitude, longitude);
        setResolved({ latitude, longitude, city, state });
        toast.success(`Localização: ${city}, ${state}`);
      } catch (e: any) {
        toast.error('Não consegui pegar sua localização. Verifique permissões.');
      }
    });
  };

  const save = () => {
    if (!resolved) return;
    start(async () => {
      const r = await setLocationAction(resolved.latitude, resolved.longitude, resolved.city, resolved.state);
      if (r.error) {
        toast.error(r.error);
        return;
      }
      toast.success('Localização salva.');
      if (nextHref) router.push(nextHref);
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Usamos sua localização só pra calcular distância com outros colecionadores. Sua posição exata nunca aparece pra terceiros — só a distância arredondada.
      </p>
      {!resolved ? (
        <Button onClick={detect} className="w-full" disabled={pending}>
          {pending ? 'Detectando…' : 'Detectar minha localização'}
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="rounded-lg border bg-card p-4 text-sm">
            <p className="font-medium">{resolved.city}, {resolved.state}</p>
            <p className="text-muted-foreground">{resolved.latitude.toFixed(4)}, {resolved.longitude.toFixed(4)}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={detect} disabled={pending}>Refazer</Button>
            <Button className="flex-1" onClick={save} disabled={pending}>
              {pending ? 'Salvando…' : 'Confirmar'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 14.2: Página `/onboarding/localizacao`**

`src/app/onboarding/localizacao/page.tsx`:

```tsx
import { LocationCapture } from '@/components/location-capture';

export default function OnboardingLocation() {
  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <header className="mb-8 space-y-1">
        <p className="text-sm text-muted-foreground">Passo 2 de 2</p>
        <h1 className="text-2xl font-semibold">Sua região</h1>
        <p className="text-sm text-muted-foreground">Encontre colecionadores perto de você.</p>
      </header>
      <LocationCapture nextHref="/" />
    </main>
  );
}
```

- [ ] **Step 14.3: Teste manual**

```bash
npm run dev
```

1. Logue.
2. Vai pra `/onboarding/perfil`, preenche.
3. Vai pra `/onboarding/localizacao`, clica em "Detectar" — autoriza o navegador.
4. Confirma. Deve ir pra `/`.
5. Verifique no banco:

```
mcp__claude_ai_Supabase__execute_sql
  project_id: <id>
  query: "select username, city, state, ST_AsText(location::geometry) from public.profiles order by updated_at desc limit 3;"
```

Espera ver `POINT(lng lat)` preenchido.

- [ ] **Step 14.4: Commit**

```bash
git add .
git commit -m "feat(onboarding): GPS capture with reverse geocode and PostGIS save"
```

---

### Task 15: Avatar upload no Storage

**Files:**
- Create: `src/components/avatar-upload.tsx`, `src/lib/actions/profile.ts` (add `setAvatarAction`)

- [ ] **Step 15.1: Adicionar action de avatar em `src/lib/actions/profile.ts`**

Append no final do arquivo:

```ts
export async function setAvatarAction(formData: FormData): Promise<Result> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado.' };

  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) return { error: 'Selecione uma imagem.' };
  if (file.size > 2 * 1024 * 1024) return { error: 'Imagem maior que 2MB.' };
  if (!file.type.startsWith('image/')) return { error: 'Arquivo inválido.' };

  const ext = file.type.split('/')[1] || 'jpg';
  const path = `${user.id}/avatar.${ext}`;

  const { error: upErr } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type });
  if (upErr) return { error: upErr.message };

  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);

  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: `${publicUrl}?v=${Date.now()}` })
    .eq('id', user.id);
  if (error) return { error: error.message };

  revalidatePath('/', 'layout');
  return {};
}
```

- [ ] **Step 15.2: Componente `AvatarUpload`**

`src/components/avatar-upload.tsx`:

```tsx
'use client';

import { useRef, useTransition } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { setAvatarAction } from '@/lib/actions/profile';

interface Props { avatarUrl: string | null; initials: string }

export function AvatarUpload({ avatarUrl, initials }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();

  const onPick = () => inputRef.current?.click();

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    start(async () => {
      const r = await setAvatarAction(fd);
      if (r.error) toast.error(r.error);
      else toast.success('Foto atualizada.');
    });
  };

  return (
    <div className="flex items-center gap-4">
      <Avatar className="size-16">
        <AvatarImage src={avatarUrl ?? undefined} alt="Avatar" />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <Button type="button" variant="outline" onClick={onPick} disabled={pending}>
        {pending ? 'Enviando…' : 'Trocar foto'}
      </Button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
    </div>
  );
}
```

- [ ] **Step 15.3: Commit**

```bash
git add .
git commit -m "feat(profile): avatar upload to Supabase Storage"
```

---

## Fase 5 — App shell + página de conta

### Task 16: Tab bar e layout principal

**Files:**
- Create: `src/app/(app)/layout.tsx`, `src/components/tab-bar.tsx`

- [ ] **Step 16.1: Tab bar**

`src/components/tab-bar.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, BookOpen, MessageCircle, User } from 'lucide-react';

const tabs = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/explorar', label: 'Explorar', icon: Search },
  { href: '/album', label: 'Álbum', icon: BookOpen },
  { href: '/chat', label: 'Chat', icon: MessageCircle },
  { href: '/conta', label: 'Conta', icon: User },
] as const;

export function TabBar() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur">
      <ul className="mx-auto flex max-w-md items-stretch justify-between">
        {tabs.map((t) => {
          const active = t.href === '/' ? path === '/' : path.startsWith(t.href);
          const Icon = t.icon;
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                className={`flex flex-col items-center gap-1 py-2 text-xs ${
                  active ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                <Icon className="size-5" aria-hidden />
                <span>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

- [ ] **Step 16.2: Instalar lucide-react**

```bash
npm install lucide-react
```

- [ ] **Step 16.3: Layout do grupo `(app)`**

`src/app/(app)/layout.tsx`:

```tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TabBar } from '@/components/tab-bar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, location')
    .eq('id', user.id)
    .single();

  // Onboarding incompleto?
  if (!profile || profile.username.startsWith('user') || !profile.location) {
    redirect('/onboarding');
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col pb-16">
      <div className="flex-1">{children}</div>
      <TabBar />
    </div>
  );
}
```

- [ ] **Step 16.4: Mover `/page.tsx` para dentro de `(app)`**

```bash
mkdir -p src/app/\(app\)
mv src/app/page.tsx src/app/\(app\)/page.tsx
```

(No PowerShell: `mv 'src/app/page.tsx' 'src/app/(app)/page.tsx'`.)

- [ ] **Step 16.5: Commit**

```bash
git add .
git commit -m "feat(shell): bottom tab navigation and auth-gated app layout"
```

---

### Task 17: Página Início com progresso

**Files:**
- Modify: `src/app/(app)/page.tsx`

- [ ] **Step 17.1: Reescrever home**

`src/app/(app)/page.tsx`:

```tsx
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username, city, state')
    .eq('id', user!.id)
    .single();

  return (
    <main className="px-6 py-6 space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">Olá,</p>
        <h1 className="text-2xl font-semibold">{profile?.full_name?.split(' ')[0]}</h1>
        {profile?.city && (
          <p className="text-sm text-muted-foreground">{profile.city}, {profile.state}</p>
        )}
      </header>

      <Card className="p-6 space-y-3">
        <h2 className="text-lg font-semibold">Primeiros passos</h2>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2"><span className="size-2 rounded-full bg-emerald-500" /> Conta criada</li>
          <li className="flex items-center gap-2"><span className="size-2 rounded-full bg-emerald-500" /> Localização salva</li>
          <li className="flex items-center gap-2"><span className="size-2 rounded-full bg-muted" /> Registre suas figurinhas</li>
        </ul>
        <Button asChild className="w-full">
          <Link href="/album">Abrir álbum</Link>
        </Button>
      </Card>

      <Card className="p-6 space-y-2 bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
        <h3 className="font-semibold">Em breve: matches por proximidade</h3>
        <p className="text-sm text-muted-foreground">Termine o álbum e a gente cruza com colecionadores perto.</p>
      </Card>
    </main>
  );
}
```

- [ ] **Step 17.2: Commit**

```bash
git add .
git commit -m "feat(home): welcome screen with onboarding progress"
```

---

### Task 18: Páginas placeholder (`/explorar`, `/album`, `/chat`) + página de conta

**Files:**
- Create: `src/app/(app)/explorar/page.tsx`, `src/app/(app)/album/page.tsx`, `src/app/(app)/chat/page.tsx`, `src/app/(app)/conta/page.tsx`

- [ ] **Step 18.1: Placeholders**

`src/app/(app)/explorar/page.tsx`:

```tsx
export default function ExplorarPage() {
  return (
    <main className="px-6 py-6">
      <h1 className="text-2xl font-semibold">Explorar</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Em construção — chega no Plano 3. Termine o álbum primeiro!
      </p>
    </main>
  );
}
```

`src/app/(app)/album/page.tsx`:

```tsx
export default function AlbumPage() {
  return (
    <main className="px-6 py-6">
      <h1 className="text-2xl font-semibold">Álbum</h1>
      <p className="mt-2 text-sm text-muted-foreground">Em construção — chega no Plano 2.</p>
    </main>
  );
}
```

`src/app/(app)/chat/page.tsx`:

```tsx
export default function ChatPage() {
  return (
    <main className="px-6 py-6">
      <h1 className="text-2xl font-semibold">Chat</h1>
      <p className="mt-2 text-sm text-muted-foreground">Em construção — chega no Plano 4.</p>
    </main>
  );
}
```

- [ ] **Step 18.2: Página `/conta`**

`src/app/(app)/conta/page.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server';
import { AvatarUpload } from '@/components/avatar-upload';
import { ProfileForm } from '@/components/profile-form';
import { LocationCapture } from '@/components/location-capture';
import { Button } from '@/components/ui/button';
import { logoutAction } from '@/lib/actions/auth';
import { Card } from '@/components/ui/card';

export default async function ContaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, full_name, bio, avatar_url, city, state')
    .eq('id', user!.id)
    .single();

  const initials = (profile?.full_name ?? 'U')
    .split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase();

  return (
    <main className="px-6 py-6 space-y-6">
      <h1 className="text-2xl font-semibold">Conta</h1>

      <Card className="p-6 space-y-4">
        <AvatarUpload avatarUrl={profile?.avatar_url ?? null} initials={initials} />
        <ProfileForm initial={{
          username: profile?.username ?? '',
          full_name: profile?.full_name ?? '',
          bio: profile?.bio ?? null,
        }} />
      </Card>

      <Card className="p-6 space-y-3">
        <h2 className="font-semibold">Localização</h2>
        {profile?.city && (
          <p className="text-sm text-muted-foreground">Atual: {profile.city}, {profile.state}</p>
        )}
        <LocationCapture />
      </Card>

      <form action={logoutAction}>
        <Button type="submit" variant="outline" className="w-full">Sair da conta</Button>
      </form>

      <p className="text-xs text-center text-muted-foreground">
        TrocasCopa · suporte: contato@trocascopa.com.br
      </p>
    </main>
  );
}
```

- [ ] **Step 18.3: Teste manual de ponta a ponta**

```bash
npm run dev
```

Cenário completo:
1. http://localhost:3000 → redireciona pra `/login`.
2. Cria conta nova (`teste@teste.com` / `senha1234` / "Tester Um").
3. Vai pra `/onboarding/perfil` → preenche username `tester1`.
4. Vai pra `/onboarding/localizacao` → autoriza GPS → confirma.
5. Cai em `/` (Início). Vê saudação com primeiro nome.
6. Navega pelas 5 tabs. Placeholders aparecem.
7. Em `/conta`, troca avatar (qualquer JPG), atualiza bio.
8. Clica em "Sair da conta" → volta pra `/login`.
9. Verifica no banco:

```
mcp__claude_ai_Supabase__execute_sql
  query: "select username, full_name, bio, avatar_url, city, state, ST_AsText(location::geometry) from public.profiles where id = (select id from auth.users where email = 'teste@teste.com');"
```

- [ ] **Step 18.4: Commit**

```bash
git add .
git commit -m "feat(app): account page with avatar, profile edit, location update, logout"
```

---

## Fase 6 — Testes de RLS + checagem final

### Task 19: Smoke test de RLS em `profiles`

**Files:**
- Create: `vitest.config.ts`, `src/tests/rls-profiles.test.ts`
- Modify: `package.json` (script `test`)

- [ ] **Step 19.1: Instalar Vitest**

```bash
npm install -D vitest @vitest/ui
```

- [ ] **Step 19.2: Adicionar script no `package.json`**

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 19.3: `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: [],
    testTimeout: 30000,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

- [ ] **Step 19.4: Escrever teste**

`src/tests/rls-profiles.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const admin = createClient<Database>(URL, SERVICE, { auth: { persistSession: false } });

let userA: { id: string; email: string };
let userB: { id: string; email: string };

const rand = () => Math.random().toString(36).slice(2, 10);

beforeAll(async () => {
  const a = await admin.auth.admin.createUser({ email: `a-${rand()}@test.local`, password: 'pwd12345', email_confirm: true });
  const b = await admin.auth.admin.createUser({ email: `b-${rand()}@test.local`, password: 'pwd12345', email_confirm: true });
  if (a.error || b.error) throw a.error ?? b.error;
  userA = { id: a.data.user!.id, email: a.data.user!.email! };
  userB = { id: b.data.user!.id, email: b.data.user!.email! };
});

afterAll(async () => {
  await admin.auth.admin.deleteUser(userA.id);
  await admin.auth.admin.deleteUser(userB.id);
});

describe('profiles RLS', () => {
  it('cria profile automaticamente quando user é criado (trigger handle_new_user)', async () => {
    const { data, error } = await admin.from('profiles').select('id, username').in('id', [userA.id, userB.id]);
    expect(error).toBeNull();
    expect(data).toHaveLength(2);
  });

  it('usuário A não consegue atualizar perfil de B', async () => {
    const clientA = createClient<Database>(URL, ANON, { auth: { persistSession: false } });
    await clientA.auth.signInWithPassword({ email: userA.email, password: 'pwd12345' });

    const { error } = await clientA
      .from('profiles')
      .update({ full_name: 'hacked' })
      .eq('id', userB.id);

    // RLS bloqueia silenciosamente — UPDATE retorna 0 linhas afetadas sem erro
    const { data: bAfter } = await admin.from('profiles').select('full_name').eq('id', userB.id).single();
    expect(bAfter?.full_name).not.toBe('hacked');
  });

  it('qualquer um pode LER perfis (público)', async () => {
    const clientA = createClient<Database>(URL, ANON, { auth: { persistSession: false } });
    await clientA.auth.signInWithPassword({ email: userA.email, password: 'pwd12345' });

    const { data, error } = await clientA.from('profiles').select('username').eq('id', userB.id).single();
    expect(error).toBeNull();
    expect(data?.username).toBeTruthy();
  });
});
```

- [ ] **Step 19.5: Rodar**

```bash
npm test
```

Expected: 3 testes passam.

Se falhar com "row violates row-level security policy" em algum INSERT, é bug — investigue.

- [ ] **Step 19.6: Commit**

```bash
git add .
git commit -m "test: smoke test for profiles RLS policies"
```

---

### Task 20: Verificação final + deploy preview na Vercel

**Files:**
- Modify: `README.md` (instruções de deploy)

- [ ] **Step 20.1: Build de produção local**

```bash
npm run build
```

Expected: build conclui. Se houver `console.error` ou warning de tipo, corrigir antes.

- [ ] **Step 20.2: Lighthouse (opcional, manual)**

Inicie `npm run start`, abra http://localhost:3000/login no Chrome → DevTools → Lighthouse → Mobile → Run.

Expected: Performance, Accessibility, Best Practices ≥ 90.

- [ ] **Step 20.3: Deploy preview na Vercel**

Antes deste passo, garanta que o Vercel CLI está instalado (`npm i -g vercel` — se ainda não, peça ao usuário).

```bash
vercel link        # vincula o projeto (primeira vez)
vercel env add NEXT_PUBLIC_SUPABASE_URL production preview development
vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY production preview development
vercel env add SUPABASE_SERVICE_ROLE_KEY production preview development
vercel env add NEXT_PUBLIC_SITE_URL production preview development
vercel
```

Anote a preview URL retornada. Abra no mobile e teste:
- Cadastro
- Onboarding com GPS
- `/conta` e logout

Adicione a preview URL no Supabase: Authentication → URL Configuration → Additional Redirect URLs.

- [ ] **Step 20.4: Atualizar README com URL do preview**

Append no `README.md`:

```markdown
## Deploy

Preview atual: https://<url-vercel>

Variáveis necessárias na Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL` (URL do preview/produção)
```

- [ ] **Step 20.5: Commit final**

```bash
git add README.md
git commit -m "docs: add deploy instructions and preview URL"
```

---

## Checklist de aceitação do Plano 1

Ao final, valide:

- [ ] `npm run build` passa sem erros.
- [ ] `npm test` passa (3 testes de RLS).
- [ ] Cadastro com email/senha cria usuário em `auth.users` E linha em `public.profiles`.
- [ ] Login com Google funciona localmente.
- [ ] `/onboarding/perfil` aceita username válido, bloqueia inválido.
- [ ] `/onboarding/localizacao` captura GPS e salva em `profile.location` (verificável via SQL).
- [ ] `/conta` exibe avatar, edita perfil, faz logout.
- [ ] Middleware redireciona deslogado → `/login` e logado em rota de auth → `/`.
- [ ] RLS bloqueia UPDATE em perfil alheio (teste smoke).
- [ ] PWA instalável (manifest válido, ícones presentes).
- [ ] Deploy preview na Vercel funcional.

---

## Próximos planos

Depois deste, na ordem sugerida:

1. **Plano 2 — Álbum:** seed das 994 figurinhas, página `/album` com grid, filtros, busca, panorama, toggle Tenho/Repetida/Prioridade.
2. **Plano 3 — Explorar:** RPC `find_matches`, página `/explorar` com filtros (raio, estado, busca), cards de match, botão "Abrir chat".
3. **Plano 4 — Chat:** `chats`, `messages`, RPC `open_chat`, Realtime, lista de conversas, thread, mark-as-read.

Cada plano produz software que roda sozinho — você pode pausar entre planos pra revisar UX.
