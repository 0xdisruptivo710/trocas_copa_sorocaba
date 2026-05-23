import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PremiumFlow } from "@/components/premium/premium-flow";

export default async function PremiumPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("trocas_profiles")
    .select("is_premium")
    .eq("id", user.id)
    .single();

  return (
    <main className="space-y-4 px-6 py-6">
      <Link
        href="/conta"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Voltar
      </Link>

      {profile?.is_premium ? (
        <div className="space-y-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-6">
          <h1 className="text-xl font-semibold">Você já é Premium ⭐</h1>
          <p className="text-sm text-muted-foreground">
            Tudo destravado: chats ilimitados, cards de cromos, propostas formais.
            Obrigado por apoiar o app.
          </p>
        </div>
      ) : (
        <PremiumFlow />
      )}
    </main>
  );
}
