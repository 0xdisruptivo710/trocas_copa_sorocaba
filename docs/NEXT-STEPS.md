# Próximos passos

## ✅ Foundation completo

19 das 20 tasks do Plano 1 estão concluídas. O app já roda local (`npm run dev`) com:

- Cadastro/login (email/senha) — Google OAuth precisa do passo 1 abaixo
- Onboarding (username + GPS)
- Conta com edição de perfil, troca de avatar e logout
- Tab bar com 5 abas (Início, Explorar, Álbum, Chat, Conta)
- Middleware/proxy redireciona deslogado → `/login`

## 🔧 Pendências que dependem de você

### 1. Habilitar Google OAuth (opcional)

Siga o passo-a-passo em [`docs/oauth-setup.md`](./oauth-setup.md).
Sem isso, o botão "Entrar com Google" retorna erro — mas email/senha funciona normal.

### 2. Configurar `SUPABASE_SERVICE_ROLE_KEY` (para testes RLS)

1. Abra https://supabase.com/dashboard/project/ehlpmukjdknnyhkycncb/settings/api
2. Copie a **service_role secret** (NÃO a publishable).
3. Cole em `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```
4. Rode `npm test` — os 3 testes de RLS devem passar.

⚠️ **Nunca commite essa chave**. Está no `.gitignore` por padrão.

### 3. Deploy preview na Vercel

```bash
npm i -g vercel        # instala o CLI globalmente
vercel login           # autentica
vercel link            # vincula este diretório a um projeto
vercel env add NEXT_PUBLIC_SUPABASE_URL production preview development
vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY production preview development
vercel env add SUPABASE_SERVICE_ROLE_KEY production preview development
vercel env add NEXT_PUBLIC_SITE_URL production preview development
vercel                 # deploy preview (não-prod)
```

Anote a URL retornada. **Adicione ela no Supabase**:

- https://supabase.com/dashboard/project/ehlpmukjdknnyhkycncb/auth/url-configuration
- Em **Additional Redirect URLs**, adicione: `https://<preview>.vercel.app/callback`

Sem isso, o callback de OAuth (e o reset-password por email) vai falhar em produção.

## 📦 O que vem na sequência

Quando estiver feliz com o Foundation, peça pra eu escrever os próximos planos:

- **Plano 2 — Álbum**: seed das 994 figurinhas, página `/album` com grid, filtros (Todas/Faltando/Tenho/Repetidas/Prioridade), busca, panorama, toggle de quantidade.
- **Plano 3 — Explorar**: RPC `find_matches` (PostGIS + scoring), página `/explorar` com filtros de raio/estado/busca, cards de match com botão "Abrir chat".
- **Plano 4 — Chat**: tabelas `trocas_chats` + `trocas_messages`, RPC `open_chat`, Realtime, lista de conversas, thread infinita, mark-as-read.

Cada plano produz software funcional sozinho — dá pra pausar entre planos pra revisar UX.

## 🔎 Validação rápida do estado atual

```bash
npm run build      # deve compilar sem erros
npm test           # 1 passa, 3 skipped (até você adicionar SERVICE_ROLE)
npm run dev        # abre http://localhost:3000

# Fluxo manual:
# 1. http://localhost:3000 → redireciona pra /login
# 2. Cria conta nova
# 3. Vai pra /onboarding/perfil → preenche
# 4. Vai pra /onboarding/localizacao → autoriza GPS → confirma
# 5. Cai em /
# 6. Em /conta: troca avatar, edita bio, sai
```
