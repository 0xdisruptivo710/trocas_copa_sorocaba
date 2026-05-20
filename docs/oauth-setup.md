# Google OAuth Setup

Para habilitar login com Google no TrocasCopa, configure as credenciais em duas plataformas:

## 1. Google Cloud Console

1. Acesse https://console.cloud.google.com/apis/credentials
2. **Create Credentials** → **OAuth client ID** → **Web application**
3. Configure:
   - **Authorized JavaScript origins**:
     - `http://localhost:3000`
     - `https://<seu-dominio-vercel>.vercel.app` (depois do primeiro deploy)
   - **Authorized redirect URIs**:
     - `https://ehlpmukjdknnyhkycncb.supabase.co/auth/v1/callback`
4. Copie o **Client ID** e **Client Secret**.

## 2. Supabase Dashboard

1. Acesse https://supabase.com/dashboard/project/ehlpmukjdknnyhkycncb/auth/providers
2. Encontre **Google** na lista → **Enable**
3. Cole **Client ID** e **Client Secret** → **Save**

Em **Authentication → URL Configuration**:
- **Site URL**: `http://localhost:3000` (dev) ou seu domínio de produção
- **Additional Redirect URLs** (adicione todos os ambientes):
  - `http://localhost:3000/callback`
  - `https://<preview>.vercel.app/callback`
  - `https://<seu-dominio-prod>/callback`

## Teste

Após salvar, a URL de autorização do Google deve estar acessível via:

```
https://ehlpmukjdknnyhkycncb.supabase.co/auth/v1/authorize?provider=google
```

E o botão "Entrar com Google" no TrocasCopa deve abrir o consent screen do Google.

## Troubleshooting

- **`redirect_uri_mismatch`** — a URL exata `https://ehlpmukjdknnyhkycncb.supabase.co/auth/v1/callback` precisa estar em Authorized redirect URIs no Google Cloud.
- **`Invalid OAuth credentials`** — verifique se copiou Client Secret sem espaços.
- **OAuth funciona local mas não em prod** — adicione o domínio de produção em ambas as Authorized origins e Additional Redirect URLs (no Supabase).
