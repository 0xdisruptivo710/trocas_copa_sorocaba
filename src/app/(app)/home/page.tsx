import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { getPanorama } from "@/lib/album/data";
import { ArrowRight, Sparkles } from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("trocas_profiles")
    .select("full_name, username, city, state")
    .eq("id", user!.id)
    .single();

  const panorama = await getPanorama(user!.id);
  const firstName = profile?.full_name?.split(" ")[0] ?? profile?.username ?? "Você";

  return (
    <main className="space-y-6 px-6 py-6">
      <header>
        <p className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Olá,
        </p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          {firstName}
        </h1>
        {profile?.city && (
          <p className="text-sm text-muted-foreground">
            {profile.city}, {profile.state}
          </p>
        )}
      </header>

      <Card className="space-y-3 border-border/60 bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-[var(--shadow-cromo)]">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg font-bold">Seu álbum</h2>
          <span className="text-xs text-muted-foreground tabular-nums">
            <span className="font-display font-bold text-foreground">
              {panorama.owned}
            </span>{" "}
            de {panorama.total}{" "}
            <span className="ml-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-display font-bold text-primary">
              {panorama.percent}%
            </span>
          </span>
        </div>

        <div className="relative h-2.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-accent transition-all duration-500"
            style={{ width: `${panorama.percent}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <p className="font-display text-lg font-extrabold tabular-nums text-primary">
              {panorama.owned}
            </p>
            <p className="text-[10px] text-muted-foreground">Tenho</p>
          </div>
          <div>
            <p className="font-display text-lg font-extrabold tabular-nums text-accent-foreground">
              {panorama.duplicates}
            </p>
            <p className="text-[10px] text-muted-foreground">Repetidas</p>
          </div>
          <div>
            <p className="font-display text-lg font-extrabold tabular-nums text-muted-foreground">
              {panorama.missing}
            </p>
            <p className="text-[10px] text-muted-foreground">Faltam</p>
          </div>
        </div>

        <Link
          href="/album"
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-primary via-primary to-accent/80 px-4 font-display text-sm font-bold text-primary-foreground shadow-sm shadow-primary/30 transition-all hover:shadow-md hover:shadow-primary/40 hover:brightness-105"
        >
          {panorama.owned === 0 ? "Começar o álbum" : "Continuar álbum"}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </Card>

      <Card className="space-y-2 border-accent/20 bg-accent/5 p-6">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-accent-foreground" aria-hidden />
          <h3 className="font-display font-bold">Encontre quem tá perto</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Bora explorar matches com base na sua localização.
        </p>
        <Link
          href="/explorar"
          className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-accent/40 bg-background px-3 text-sm font-display font-semibold text-foreground hover:bg-accent/10"
        >
          Explorar matches
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </Card>
    </main>
  );
}
