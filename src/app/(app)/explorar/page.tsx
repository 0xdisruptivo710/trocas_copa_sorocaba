import { parseExploreQuery } from "@/lib/explorar/filters";
import { findMatches } from "@/lib/explorar/data";
import { ExploreFilters } from "@/components/explorar/explore-filters";
import { MatchCard } from "@/components/explorar/match-card";
import { NoLocationState, NoMatchesState } from "@/components/explorar/explore-empty";

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

  const result = await findMatches(query);

  if (result.kind === "no_location") {
    return (
      <main className="space-y-4 px-6 py-6">
        <header>
          <h1 className="text-2xl font-semibold">Explorar</h1>
        </header>
        <NoLocationState />
      </main>
    );
  }

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

  const hasFilters = query.radius !== 50 || query.state !== null || query.q !== "";

  return (
    <main className="space-y-4 px-6 py-6">
      <header>
        <h1 className="text-2xl font-semibold">Explorar</h1>
        <p className="text-sm text-muted-foreground">
          {result.matches.length === 0
            ? "Sem matches no raio escolhido"
            : `${result.matches.length} ${
                result.matches.length === 1 ? "match encontrado" : "matches encontrados"
              }`}
        </p>
      </header>

      <ExploreFilters query={query} />

      {result.matches.length === 0 ? (
        <NoMatchesState hasFilters={hasFilters} />
      ) : (
        <ul className="space-y-2">
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
