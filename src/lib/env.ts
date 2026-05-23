/**
 * Env getters com acesso literal — Next.js/Turbopack só substitui
 * `process.env.NEXT_PUBLIC_X` quando lido literal. Acesso dinâmico
 * (process.env[key]) NÃO funciona no bundle do cliente.
 *
 * As envs são lidas via Proxy lazy pra não explodir o build quando uma env
 * está faltando — só explode no runtime quando alguém TENTAR usar a env
 * faltante. Isso permite que páginas que não usam Supabase sejam pré-
 * renderizadas mesmo sem as envs configuradas (e dá mensagem de erro
 * útil em runtime ao invés de "Collecting page data failed").
 */

function read(name: string, value: string | undefined, fallback?: string): string {
  if (value !== undefined && value !== "") return value;
  if (fallback !== undefined) return fallback;
  throw new Error(
    `Missing env: ${name}. ` +
      `Set it in .env.local (dev) or Vercel dashboard (prod). ` +
      `If you're seeing this during build, mark the page as dynamic ` +
      `or move env access out of module top-level.`,
  );
}

class EnvBag {
  get SUPABASE_URL(): string {
    return read("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
  }
  get SUPABASE_PUBLISHABLE_KEY(): string {
    return read(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    );
  }
  get SUPABASE_SERVICE_ROLE_KEY(): string {
    return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  }
  get SITE_URL(): string {
    return read("NEXT_PUBLIC_SITE_URL", process.env.NEXT_PUBLIC_SITE_URL, "http://localhost:3000");
  }
}

export const env = new EnvBag();
