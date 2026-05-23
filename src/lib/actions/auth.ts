"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

async function consumeReferralCookie(supabase: Awaited<ReturnType<typeof createClient>>) {
  const c = await cookies();
  const code = c.get("trocas_referral")?.value;
  if (!code || !/^[a-z0-9_]{3,30}$/.test(code)) return;
  try {
    await supabase.rpc("trocas_register_referral", {
      p_referrer_username: code,
      p_source: "signup_link",
    });
  } catch {
    // best-effort — não bloqueia signup
  }
  c.delete("trocas_referral");
}

type ActionResult = { error?: string };

export async function signupAction(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (!email || !password || !fullName) return { error: "Preencha todos os campos." };
  if (password.length < 8) return { error: "Senha precisa ter pelo menos 8 caracteres." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${env.SITE_URL}/callback`,
    },
  });
  if (error) return { error: error.message };

  // Se veio com cupom de indicação na URL (cookie trocas_referral), registra
  // a referência. Best-effort — não bloqueia onboarding.
  await consumeReferralCookie(supabase);

  redirect("/onboarding/perfil");
}

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "E-mail ou senha incorretos." };

  revalidatePath("/", "layout");
  redirect("/");
}

export async function loginWithGoogleAction(): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${env.SITE_URL}/callback?next=/` },
  });
  if (error) return { error: error.message };
  redirect(data.url);
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function resetPasswordAction(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Informe o e-mail." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${env.SITE_URL}/callback?next=/conta`,
  });
  if (error) return { error: error.message };
  return {};
}
