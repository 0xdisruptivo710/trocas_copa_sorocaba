/**
 * Env getters with literal access to process.env.X — Next.js/Turbopack only
 * inlines NEXT_PUBLIC_* vars when accessed as `process.env.NEXT_PUBLIC_X`
 * (literal). Dynamic `process.env[key]` is NOT substituted and breaks in the
 * client bundle (returns undefined).
 */

function requireServer(value: string | undefined, name: string): string {
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

export const env = {
  SUPABASE_URL: requireServer(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    "NEXT_PUBLIC_SUPABASE_URL",
  ),
  SUPABASE_PUBLISHABLE_KEY: requireServer(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  ),
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
};
