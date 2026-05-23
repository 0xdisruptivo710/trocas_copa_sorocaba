import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getPublicProfileByUsername,
  getTradePreview,
  getUserReputation,
} from "@/lib/explorar/data";
import { ProfileHeader } from "@/components/perfil/profile-header";
import { TradePreview } from "@/components/perfil/trade-preview";
import { ConversarButton } from "@/components/perfil/conversar-button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, UserPlus } from "lucide-react";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = await getPublicProfileByUsername(username);
  if (!profile) notFound();

  // Próprio perfil? Redireciona pra /conta
  if (user && profile.id === user.id) redirect("/conta");

  const reputation = await getUserReputation(profile.id);
  const preview = user ? await getTradePreview(profile.id) : null;
  const isVisitor = !user;

  return (
    <main className="space-y-6 px-6 py-6">
      <Link
        href={user ? "/explorar" : "/"}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        {user ? "Voltar" : "TrocasCopa"}
      </Link>

      <ProfileHeader
        fullName={profile.full_name}
        username={profile.username}
        avatarUrl={profile.avatar_url}
        city={profile.city}
        state={profile.state}
        bio={profile.bio}
        isPremium={profile.is_premium}
        reputation={reputation}
      />

      {isVisitor && (
        <Card className="space-y-3 border-amber-500/30 bg-amber-500/5 p-6 text-center">
          <UserPlus className="mx-auto size-8 text-amber-600" />
          <h2 className="font-semibold">
            Cadastre-se pra trocar com @{profile.username}
          </h2>
          <p className="text-sm text-muted-foreground">
            Crie sua conta grátis no TrocasCopa e veja quantos cromos vocês trocam
            direto.
          </p>
          <div className="flex gap-2">
            <Link
              href={`/cadastro?via=${profile.username}`}
              className="inline-flex h-9 flex-1 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Criar conta
            </Link>
            <Link
              href={`/login?next=/u/${profile.username}`}
              className="inline-flex h-9 flex-1 items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-accent"
            >
              Entrar
            </Link>
          </div>
        </Card>
      )}

      {user && preview && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Sua troca</h2>
          <TradePreview preview={preview} />
        </section>
      )}

      {user && <ConversarButton otherUserId={profile.id} />}
    </main>
  );
}
