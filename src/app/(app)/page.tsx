import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

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
        <h2 className="text-lg font-semibold">Primeiros passos</h2>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500" /> Conta criada
          </li>
          <li className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500" /> Localização salva
          </li>
          <li className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-muted" /> Registre suas figurinhas
          </li>
        </ul>
        <Link
          href="/album"
          className="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Abrir álbum
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
