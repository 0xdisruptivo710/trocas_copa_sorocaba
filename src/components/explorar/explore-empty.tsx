import Link from "next/link";
import { Card } from "@/components/ui/card";
import { MapPinOff, Inbox } from "lucide-react";

export function NoLocationState() {
  return (
    <Card className="space-y-3 p-6 text-center">
      <MapPinOff className="mx-auto size-8 text-muted-foreground" />
      <h2 className="font-semibold">Defina sua localização</h2>
      <p className="text-sm text-muted-foreground">
        Pra encontrar colecionadores próximos, precisamos saber onde você está.
      </p>
      <Link
        href="/conta"
        className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Definir localização
      </Link>
    </Card>
  );
}

export function NoMatchesState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <Card className="space-y-2 p-6 text-center">
      <Inbox className="mx-auto size-8 text-muted-foreground" />
      <h2 className="font-semibold">Nenhum match agora</h2>
      <p className="text-sm text-muted-foreground">
        {hasFilters
          ? "Tenta aumentar o raio ou limpar os filtros."
          : "Conforme você marca figurinhas no álbum, vão aparecer colecionadores aqui."}
      </p>
      {!hasFilters && (
        <Link
          href="/album"
          className="inline-flex h-9 items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-accent"
        >
          Abrir álbum
        </Link>
      )}
    </Card>
  );
}
