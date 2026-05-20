import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { getPanorama } from "@/lib/album/data";

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
    <main className="px-6 py-6 space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">Olá,</p>
        <h1 className="text-2xl font-semibold">{firstName}</h1>
        {profile?.city && (
          <p className="text-sm text-muted-foreground">
            {profile.city}, {profile.state}
          </p>
        )}
      </header>

      <Card className="p-6 space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Seu álbum</h2>
          <span className="text-xs text-muted-foreground">
            {panorama.owned} de {panorama.total} ({panorama.percent}%)
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${panorama.percent}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <p className="font-bold text-emerald-600">{panorama.owned}</p>
            <p className="text-muted-foreground">Tenho</p>
          </div>
          <div>
            <p className="font-bold text-amber-600">{panorama.duplicates}</p>
            <p className="text-muted-foreground">Repetidas</p>
          </div>
          <div>
            <p className="font-bold text-muted-foreground">{panorama.missing}</p>
            <p className="text-muted-foreground">Faltam</p>
          </div>
        </div>

        <Link
          href="/album"
          className="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {panorama.owned === 0 ? "Começar o álbum" : "Continuar álbum"}
        </Link>
      </Card>

      <Card className="p-6 space-y-2 border-amber-500/20">
        <h3 className="font-semibold">Em breve: matches por proximidade</h3>
        <p className="text-sm text-muted-foreground">
          Termine o álbum e a gente cruza com colecionadores perto.
        </p>
      </Card>
    </main>
  );
}
