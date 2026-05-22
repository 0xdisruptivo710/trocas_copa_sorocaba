import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getPublicProfileByUsername,
  getTradePreview,
} from "@/lib/explorar/data";
import { ProfileHeader } from "@/components/perfil/profile-header";
import { TradePreview } from "@/components/perfil/trade-preview";
import { ChevronLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getPublicProfileByUsername(username);
  if (!profile) notFound();

  if (profile.id === user.id) redirect("/conta");

  const preview = await getTradePreview(profile.id);

  return (
    <main className="space-y-6 px-6 py-6">
      <Link
        href="/explorar"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Voltar
      </Link>

      <ProfileHeader
        fullName={profile.full_name}
        username={profile.username}
        avatarUrl={profile.avatar_url}
        city={profile.city}
        state={profile.state}
        bio={profile.bio}
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Sua troca</h2>
        <TradePreview preview={preview} />
      </section>

      <section className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm">
        <p className="font-medium">Chat em breve (Plano 4)</p>
        <p className="text-muted-foreground">
          Por enquanto você consegue ver os matches e o preview da troca. O chat
          direto chega na próxima fase.
        </p>
      </section>
    </main>
  );
}
