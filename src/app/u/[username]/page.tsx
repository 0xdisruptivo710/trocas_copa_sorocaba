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

  const [preview, reputation] = await Promise.all([
    getTradePreview(profile.id),
    getUserReputation(profile.id),
  ]);

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
        isPremium={profile.is_premium}
        reputation={reputation}
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Sua troca</h2>
        <TradePreview preview={preview} />
      </section>

      <ConversarButton otherUserId={profile.id} />
    </main>
  );
}
