import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AvatarUpload } from "@/components/avatar-upload";
import { ProfileForm } from "@/components/profile-form";
import { LocationCapture } from "@/components/location-capture";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/actions/auth";
import { Card } from "@/components/ui/card";
import { Crown, Gift } from "lucide-react";

export default async function ContaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("trocas_profiles")
    .select("username, full_name, bio, avatar_url, city, state, is_premium")
    .eq("id", user!.id)
    .single();

  const initials = (profile?.full_name ?? "U")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="space-y-6 px-6 py-6 md:px-10 md:py-10">
      <header>
        <p className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Perfil & ajustes
        </p>
        <h1 className="font-display text-4xl font-extrabold uppercase leading-none tracking-tight md:text-6xl">
          Sua Conta
        </h1>
      </header>

      <Card className="p-6 space-y-4">
        <AvatarUpload avatarUrl={profile?.avatar_url ?? null} initials={initials} />
        {profile?.is_premium && (
          <p className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
            <Crown className="size-3" aria-hidden /> Premium · Apoiador
          </p>
        )}
        <ProfileForm
          initial={{
            username: profile?.username ?? "",
            full_name: profile?.full_name ?? "",
            bio: profile?.bio ?? null,
          }}
        />
      </Card>

      {!profile?.is_premium && (
        <Card className="space-y-3 border-amber-500/30 bg-amber-500/5 p-6">
          <div className="flex items-center gap-2">
            <Crown className="size-5 text-amber-600" aria-hidden />
            <h2 className="font-semibold">Vire Premium</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Chats ilimitados, cards de cromos no chat, propostas formais e
            atualização automática do álbum quando você concluir uma troca.
            Pagamento único <strong>R$ 24,90</strong>.
          </p>
          <Link
            href="/conta/premium"
            className="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Conhecer Premium
          </Link>
        </Card>
      )}

      <Card className="space-y-3 border-primary/30 bg-primary/5 p-6">
        <div className="flex items-center gap-2">
          <Gift className="size-5 text-primary" aria-hidden />
          <h2 className="font-semibold">Indique e ganhe R$ 5</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Convide amigos. Eles pagam R$ 19,90 no Premium (com cupom) e você ganha
          R$ 5 PIX cada um.
        </p>
        <Link
          href="/conta/indicar"
          className="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Meu cupom
        </Link>
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
        Trocas Copa Sorocaba · suporte: contato@trocascopa.com.br
      </p>
    </main>
  );
}
