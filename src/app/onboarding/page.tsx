import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingIndex() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("trocas_profiles")
    .select("username, location")
    .eq("id", user.id)
    .single();

  if (!profile?.username || profile.username.startsWith("user")) {
    redirect("/onboarding/perfil");
  }
  if (!profile.location) {
    redirect("/onboarding/localizacao");
  }
  redirect("/");
}
