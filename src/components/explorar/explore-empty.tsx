import Link from "next/link";
import { Card } from "@/components/ui/card";
import { MapPinOff, Users, Share2 } from "lucide-react";

export function NoLocationState() {
  return (
    <Card className="space-y-3 p-6 text-center">
      <MapPinOff className="mx-auto size-8 text-muted-foreground" />
      <h2 className="font-display text-lg font-bold">Defina sua localização</h2>
      <p className="text-sm text-muted-foreground">
        Pra encontrar colecionadores próximos em Sorocaba e região, precisamos
        saber onde você está.
      </p>
      <Link
        href="/conta"
        className="inline-flex h-9 items-center justify-center rounded-md bg-gradient-to-r from-primary via-primary to-accent/80 px-4 font-display text-sm font-bold text-primary-foreground shadow-sm shadow-primary/30 hover:brightness-105"
      >
        Definir localização
      </Link>
    </Card>
  );
}

export function NoMatchesState({ hasFilters }: { hasFilters: boolean }) {
  if (hasFilters) {
    return (
      <Card className="space-y-2 p-6 text-center">
        <Users className="mx-auto size-8 text-muted-foreground" />
        <h2 className="font-display text-lg font-bold">
          Nenhum colecionador com esses filtros
        </h2>
        <p className="text-sm text-muted-foreground">
          Tenta aumentar o raio (até 50km) ou limpar a busca.
        </p>
      </Card>
    );
  }

  return (
    <Card className="space-y-4 p-6">
      <div className="text-center">
        <Users className="mx-auto size-8 text-muted-foreground" />
        <h2 className="mt-2 font-display text-lg font-bold">
          Sem matches por enquanto
        </h2>
      </div>

      <div className="space-y-3 text-sm text-muted-foreground">
        <p>
          Pra ter matches, <strong className="text-foreground">duas coisas precisam acontecer</strong>:
        </p>
        <ol className="ml-5 list-decimal space-y-1.5">
          <li>
            Você ter marcado <strong className="text-foreground">cromos repetidos</strong> e{" "}
            <strong className="text-foreground">cromos que faltam</strong> no seu álbum.
          </li>
          <li>
            Pelo menos <strong className="text-foreground">um outro colecionador da região</strong> ter feito o mesmo
            — e os cromos baterem.
          </li>
        </ol>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Link
          href="/album"
          className="inline-flex h-9 items-center justify-center rounded-md bg-gradient-to-r from-primary via-primary to-accent/80 px-4 font-display text-sm font-bold text-primary-foreground shadow-sm shadow-primary/30 hover:brightness-105"
        >
          Marcar meus cromos
        </Link>
        <Link
          href="/conta/indicar"
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border px-4 font-display text-sm font-semibold hover:bg-accent/30"
        >
          <Share2 className="size-3.5" />
          Convidar amigos
        </Link>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Quanto mais gente da sua região, mais matches.
      </p>
    </Card>
  );
}
