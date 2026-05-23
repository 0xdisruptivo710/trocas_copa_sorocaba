# Deploy na Vercel — passo a passo

Tudo que você precisa pra subir o TrocasCopa em produção.

## Pré-requisitos

- Conta na Vercel: https://vercel.com/signup (use seu GitHub pra ligar tudo de uma vez)
- Repo do TrocasCopa em GitHub/GitLab/Bitbucket (Vercel puxa de lá)
- Node 18+ local (você já tem)

## Passo 1 — Push do repo

Se ainda não fez:

```bash
git remote add origin https://github.com/<seu-usuario>/trocas-copa.git
git branch -M main
git push -u origin main
```

## Passo 2 — Criar projeto na Vercel

1. https://vercel.com/new
2. Selecione o repo `trocas-copa`
3. Framework: Vercel detecta **Next.js** automaticamente
4. Root directory: `./` (default)
5. Build Command, Install Command, Output: deixar default
6. **NÃO clique em Deploy ainda** — primeiro configure as env vars (próximo passo)

## Passo 3 — Configurar variáveis de ambiente

Em **Settings → Environment Variables**, adicione (selecione "Production", "Preview" e "Development" pra cada uma):

| Nome | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ehlpmukjdknnyhkycncb.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_WDSDse-bpqmAovgXWhYC4A_sKzIuU8E` |
| `SUPABASE_SERVICE_ROLE_KEY` | _(o JWT que você me passou — copie do `.env.local` local)_ |
| `NEXT_PUBLIC_SITE_URL` | `https://<seu-app>.vercel.app` (atualiza depois do 1º deploy) |
| `ABACATEPAY_API_KEY` | `abc_dev_5wjdAycGFHWzRLsxPnSRrRey` (use chave **prod** quando lançar) |
| `TROCAS_WEBHOOK_SECRET` | gere uma string aleatória (32+ caracteres) |

> ⚠️ Para gerar o webhook secret, no terminal:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

## Passo 4 — Deploy inicial

Clique em **Deploy**. Aguarde ~2 minutos. Você recebe uma URL tipo:
`https://trocas-copa-xyz.vercel.app`

## Passo 5 — Configurar Supabase Redirect URLs

No Supabase dashboard:
https://supabase.com/dashboard/project/ehlpmukjdknnyhkycncb/auth/url-configuration

Adicione em **Additional Redirect URLs** (uma por linha):
```
https://trocas-copa-xyz.vercel.app/callback
https://*.vercel.app/callback
```

(`https://*.vercel.app/callback` pega os preview deploys de PRs.)

Atualize o **Site URL** para sua URL definitiva quando comprar o domínio.

## Passo 6 — Atualizar NEXT_PUBLIC_SITE_URL na Vercel

Volte a Settings → Environment Variables e atualize:
```
NEXT_PUBLIC_SITE_URL=https://trocas-copa-xyz.vercel.app
```

Force um redeploy: Deployments → … → Redeploy.

## Passo 7 — Configurar webhook AbacatePay

Dashboard AbacatePay → Webhooks → Criar novo webhook:

- **URL**:
  ```
  https://trocas-copa-xyz.vercel.app/api/abacatepay?webhookSecret=<seu_TROCAS_WEBHOOK_SECRET>
  ```
- **Eventos**: marque `billing.paid` e `transparent.completed` (todos os de "pagamento aprovado")
- Salve

> O `webhookSecret` na query string + a assinatura HMAC-SHA256 no header `X-Webhook-Signature` formam dupla camada de segurança. Sem os dois bater, o endpoint retorna 401/403.

## Passo 8 — Testar end-to-end

1. Abra `https://trocas-copa-xyz.vercel.app` no celular
2. Cadastre uma conta nova (ou loga com a sua)
3. Complete onboarding (GPS + 1 cromo)
4. Vai em **Conta → Conhecer Premium → Gerar PIX**
5. Pague com QR ou copia-cola (em modo dev AbacatePay simula)
6. Webhook bate → polling detecta → tela "Bem-vindo ao Premium"
7. Volta na conta — badge ⭐ Premium aparece

## Passo 9 — Trocar pra prod no AbacatePay

Quando estiver pronto pra processar pagamentos reais:

1. Dashboard AbacatePay → **Sair do Dev Mode** (homologação da conta)
2. Gere uma chave **Produção** (sem `_dev_`)
3. Vercel → atualize `ABACATEPAY_API_KEY` pra essa nova chave
4. Crie um **novo webhook** apontando pra mesma URL (webhooks são separados entre dev e prod)
5. Redeploy

## Passo 10 — Domínio próprio (opcional)

1. Compre `trocascopa.com.br` (Registro.br ~R$ 40/ano)
2. Vercel → Settings → Domains → Add → cole o domínio
3. Configure DNS no Registro.br conforme instruções da Vercel (CNAME apontando pra `cname.vercel-dns.com`)
4. Atualize Supabase Site URL pro domínio próprio
5. Atualize `NEXT_PUBLIC_SITE_URL` na Vercel

## Troubleshooting

| Sintoma | Causa provável | Fix |
|---|---|---|
| `Missing env: NEXT_PUBLIC_SUPABASE_URL` no build | env não foi pegou na Vercel | Re-add em Settings → Env Vars com escopo Production/Preview/Development; redeploy |
| Cadastro funciona mas redireciona pra `/login` | Site URL ou Redirect URL incorretos no Supabase | Adicione URL Vercel em Additional Redirect URLs (passo 5) |
| Webhook AbacatePay sempre 401 | `webhookSecret` na URL diferente do env | Confira que o valor da query string `?webhookSecret=...` bate com `TROCAS_WEBHOOK_SECRET` na Vercel |
| Webhook 403 (Invalid signature) | Body sendo modificado por proxy/CDN | Vercel não modifica body — verifique que está pegando `raw` text (já implementado) |
| `Missing SUPABASE_SERVICE_ROLE_KEY` no webhook | env não setada | Settings → adicionar com escopo Production |
| App carrega mas matches não aparecem | RLS bloqueando | Confirme que `trocas_find_matches` foi aplicado: SQL `select count(*) from pg_proc where proname='trocas_find_matches'` deve retornar 1 |

## Custos esperados

- **Vercel**: free tier cobre o MVP (10GB-h serverless/mês, 100GB bandwidth)
- **Supabase**: free tier cobre 500MB DB + 1GB Storage + 50k MAU/mês
- **AbacatePay**: cobra **só por transação aprovada** (consultar % na hora da homologação)
- **Domínio**: R$ 40/ano se for `.com.br`
- **Total operacional pré-revenue**: ~R$ 0/mês

## Testar Premium localmente (sem deploy)

Se quiser validar o fluxo PIX antes de subir pra Vercel:

```bash
# 1. Instalar AbacatePay CLI (uma vez, requer Go: https://go.dev/dl/)
go install github.com/AbacatePay/abacatepay-cli@latest

# 2. Login (uma vez, abre navegador)
abacatepay login

# 3. Em UM terminal: roda dev server
npm run dev

# 4. Em OUTRO terminal: forward webhooks pro local
npm run abacate:listen
# (lê TROCAS_WEBHOOK_SECRET do .env.local e mantém WebSocket aberto pra AbacatePay)

# 5. Em UM TERCEIRO terminal: simula um pagamento aprovado
npm run abacate:trigger
# OU cria um PIX real (modo dev simula automaticamente):
abacatepay payments create pix
```

Fluxo esperado:
1. CLI conecta no AbacatePay via WebSocket
2. Você gera PIX em `/conta/premium` na UI
3. `abacate:trigger` (ou pagamento real) dispara `billing.paid`
4. CLI faz POST em `localhost:3000/api/abacatepay`
5. Webhook valida + marca `is_premium = true`
6. Polling do front detecta → tela "Bem-vindo ao Premium"

## Monitoramento pós-deploy

- **Vercel Analytics** (free): ative em Settings → Analytics
- **Supabase Logs**: monitore via dashboard, especialmente erros de auth e webhook
- **AbacatePay Dashboard**: vê todas as cobranças, simula pagamentos em dev mode
