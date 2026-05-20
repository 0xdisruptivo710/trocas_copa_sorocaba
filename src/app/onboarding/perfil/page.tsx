import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile-form";

export default async function OnboardingProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("trocas_profiles")
    .select("username, full_name, bio")
    .eq("id", user.id)
    .single();

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <header className="mb-8 space-y-1">
        <p className="text-sm text-muted-foreground">Passo 1 de 2</p>
        <h1 className="text-2xl font-semibold">Seu perfil</h1>
        <p className="text-sm text-muted-foreground">
          É assim que outros colecionadores vão te ver.
        </p>
      </header>
      <ProfileForm
        initial={{
          username: profile?.username ?? "",
          full_name: profile?.full_name ?? "",
          bio: profile?.bio ?? null,
        }}
        nextHref="/onboarding/localizacao"
      />
    </main>
  );
}
