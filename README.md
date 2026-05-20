# TrocasCopa

PWA mobile-first para colecionadores do álbum Panini FIFA World Cup 2026 trocarem figurinhas com pessoas próximas.

## Stack

- **Frontend**: Next.js 16 (App Router, RSC, Server Actions) + Tailwind CSS 4 + shadcn/ui
- **Backend**: Supabase (Postgres + PostGIS + Auth + Realtime + Storage)
- **Deploy**: Vercel (Fluid Compute)

## Setup local

1. Clone o repositório.
2. `npm install`
3. Copie `.env.example` para `.env.local` e preencha:
   - `NEXT_PUBLIC_SUPABASE_URL` — URL do projeto Supabase
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — publishable key
   - `SUPABASE_SERVICE_ROLE_KEY` — service role (apenas para testes; pegar no Dashboard → Settings → API)
   - `NEXT_PUBLIC_SITE_URL` — `http://localhost:3000` em dev
4. `npm run dev` (porta 3000)

## Comandos

```bash
npm run dev      # dev server (Turbopack)
npm run build    # production build
npm test         # smoke tests (Vitest)
npm run lint     # ESLint
```

## OAuth (Google)

Veja `docs/oauth-setup.md` para configurar Google OAuth no Supabase + Google Cloud Console.

## Spec & Plano

- Spec do produto e PRD do banco: `docs/superpowers/specs/2026-05-19-trocascopa-design.md`
- Plano de implementação (Foundation v1): `docs/superpowers/plans/2026-05-19-trocascopa-foundation.md`

## Convenções

Tabelas e funções do projeto são prefixadas com `trocas_` porque o Supabase é compartilhado com outras aplicações. Storage bucket: `trocas-avatars`.
