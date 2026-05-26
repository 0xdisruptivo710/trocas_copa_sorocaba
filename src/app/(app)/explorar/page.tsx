import { parseExploreQuery } from "@/lib/explorar/filters";
import { findMatches } from "@/lib/explorar/data";
import { ExploreFilters } from "@/components/explorar/explore-filters";
import { MatchCard } from "@/components/explorar/match-card";
import { NoMatchesState } from "@/components/explorar/explore-empty";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ExplorarPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sp = new URLSearchParams(
    Object.entries(params).flatMap(([k, v]) =>
      Array.isArray(v) ? v.map((vv) => [k, vv]) : v ? [[k, v]] : [],
    ) as [string, string][],
  );
  const query = parseExploreQuery(sp);

  const result = await findMatches(query, {
    onlyWithMatches: query.mode === "matches",
  });

  if (result.kind === "not_authenticated") {
    return (
      <main className="px-6 py-6">
        <p className="text-sm text-muted-foreground">Não autenticado.</p>
      </main>
    );
  }

  if (result.kind === "error") {
    return (
      <main className="px-6 py-6">
        <p className="text-sm text-destructive">Erro ao buscar: {result.message}</p>
      </main>
    );
  }

  const hasFilters = query.radius !== 25 || query.q !== "";
  const totalLabel =
    result.matches.length === 1
      ? query.mode === "matches"
        ? "match encontrado"
        : "colecionador na região"
      : query.mode === "matches"
        ? "matches encontrados"
        : "colecionadores na região";

  return (
    <main className="space-y-6 px-6 py-6 md:px-10 md:py-10">
      <header>
        <p className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Trocas no mapa · {result.matches.length}{" "}
          {result.matches.length === 1 ? "pessoa" : "pessoas"}
        </p>
        <h1 className="font-display text-4xl font-extrabold uppercase leading-none tracking-tight md:text-6xl">
          Mapa de Trocas
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {result.matches.length === 0
            ? query.mode === "matches"
              ? "Sem matches no raio escolhido. Marca cromos no álbum pra começar a aparecer."
              : "Ainda sem colecionadores no raio. Aumenta o raio ou convida amigos."
            : `${result.matches.length} ${totalLabel} — aproximada por privacidade. Combinem o ponto exato no chat.`}
        </p>
      </header>

      <ExploreFilters query={query} />

      {result.matches.length === 0 ? (
        <NoMatchesState hasFilters={hasFilters} mode={query.mode} />
      ) : (
        <ul className="grid gap-2 md:grid-cols-2">
          {result.matches.map((m) => (
            <li key={m.other_user}>
              <MatchCard match={m} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
