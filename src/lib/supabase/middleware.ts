import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/supabase";
import { env } from "@/lib/env";

const AUTH_PATHS = ["/login", "/cadastro", "/esqueci-senha", "/callback"];
const PUBLIC_PATH_PREFIXES = ["/u/", "/parceiro/"];
const PUBLIC_PATHS_EXACT = ["/"];
const PUBLIC_FILE_PREFIXES = ["/_next", "/icon", "/manifest", "/api/abacatepay", "/apple-icon", "/opengraph-image"];

// Cookie de atribuição de partner (last-touch, janela 30d).
const PARTNER_COOKIE = "tc_partner";
const PARTNER_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;
const PARTNER_SLUG_RE = /^[a-z0-9_-]{2,30}$/;

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const path = url.pathname;

  // Atribuição de partner via ?p=slug — seta cookie last-touch por 30d.
  // Sem validação de existência aqui (custo de query a cada request);
  // signupAction valida na hora de gravar a atribuição.
  const partnerParam = url.searchParams.get("p")?.trim().toLowerCase();
  if (partnerParam && PARTNER_SLUG_RE.test(partnerParam)) {
    response.cookies.set(PARTNER_COOKIE, partnerParam, {
      maxAge: PARTNER_COOKIE_MAX_AGE,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  const isAuthRoute = AUTH_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
  const isPublicPath =
    PUBLIC_PATH_PREFIXES.some((p) => path.startsWith(p)) ||
    PUBLIC_PATHS_EXACT.includes(path);
  const isPublicFile =
    PUBLIC_FILE_PREFIXES.some((p) => path.startsWith(p)) ||
    path === "/manifest.webmanifest" ||
    path === "/favicon.ico";

  // User logado abrindo a landing (/) → mandamos pra app (/home)
  if (user && path === "/") {
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }

  // Visitante tentando acessar rota protegida → /login
  if (!user && !isAuthRoute && !isPublicPath && !isPublicFile) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // User logado em rota de auth (login/cadastro) → /home (exceto /callback)
  if (user && isAuthRoute && !path.startsWith("/callback")) {
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }

  return response;
}
