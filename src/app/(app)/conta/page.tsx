import { createClient } from "@/lib/supabase/server";
import { AvatarUpload } from "@/components/avatar-upload";
import { ProfileForm } from "@/components/profile-form";
import { LocationCapture } from "@/components/location-capture";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/actions/auth";
import { Card } from "@/components/ui/card";

export default async function ContaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("trocas_profiles")
    .select("username, full_name, bio, avatar_url, city, state")
    .eq("id", user!.id)
    .single();

  const initials = (profile?.full_name ?? "U")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="px-6 py-6 space-y-6">
      <h1 className="text-2xl font-semibold">Conta</h1>

      <Card className="p-6 space-y-4">
        <AvatarUpload avatarUrl={profile?.avatar_url ?? null} initials={initials} />
        <ProfileForm
          initial={{
            username: profile?.username ?? "",
            full_name: profile?.full_name ?? "",
            bio: profile?.bio ?? null,
          }}
        />
      </Card>

      <Card className="p-6 space-y-3">
        <h2 className="font-semibold">Localização</h2>
        {profile?.city && (
          <p className="text-sm text-muted-foreground">
            Atual: {profile.city}, {profile.state}
          </p>
        )}
        <LocationCapture />
      </Card>

      <form action={logoutAction}>
        <Button type="submit" variant="outline" className="w-full">
          Sair da conta
        </Button>
      </form>

      <p className="text-xs text-center text-muted-foreground">
        TrocasCopa · suporte: contato@trocascopa.com.br
      </p>
    </main>
  );
}
