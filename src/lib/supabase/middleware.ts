import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/supabase";
import { env } from "@/lib/env";

const AUTH_PATHS = ["/login", "/cadastro", "/esqueci-senha", "/callback"];
const PUBLIC_PATH_PREFIXES = ["/u/"];
const PUBLIC_FILE_PREFIXES = ["/_next", "/icon", "/manifest", "/api/abacatepay"];

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

  const isAuthRoute = AUTH_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
  const isPublicPath = PUBLIC_PATH_PREFIXES.some((p) => path.startsWith(p));
  const isPublicFile = PUBLIC_FILE_PREFIXES.some((p) => path.startsWith(p)) || path === "/manifest.webmanifest";

  if (!user && !isAuthRoute && !isPublicPath && !isPublicFile) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute && !path.startsWith("/callback")) {
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}
