import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const PARTNER_COOKIE = "tc_partner";
const PARTNER_SLUG_RE = /^[a-z0-9_-]{2,30}$/;

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Tentativa tardia de atribuição (caso o user confirmou email só agora
      // e o signupAction não conseguiu por falta de auth.uid()).
      const store = await cookies();
      const slug = store.get(PARTNER_COOKIE)?.value?.trim().toLowerCase();
      if (slug && PARTNER_SLUG_RE.test(slug)) {
        try {
          const { data } = await supabase.rpc("trocas_attribute_signup", {
            p_slug: slug,
            p_source: "cookie",
          });
          if (data === true) store.delete(PARTNER_COOKIE);
        } catch {
          // best-effort
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}
