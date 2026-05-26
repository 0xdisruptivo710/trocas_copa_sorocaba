"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import { Search, Sparkles, Users, List, Map as MapIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  RADIUS_OPTIONS,
  buildExploreUrl,
  type ExploreQuery,
} from "@/lib/explorar/filters";

export function ExploreFilters({ query }: { query: ExploreQuery }) {
  const router = useRouter();
  const [q, setQ] = useState(query.q);
  const [, start] = useTransition();

  useEffect(() => {
    if (q === query.q) return;
    const t = setTimeout(() => {
      start(() => {
        router.push(buildExploreUrl("/explorar", { ...query, q }));
      });
    }, 300);
    return () => clearTimeout(t);
  }, [q, query, router]);

  const radiusHref = (r: number) =>
    buildExploreUrl("/explorar", { ...query, radius: r as ExploreQuery["radius"] });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Tab switcher Matches / Todos */}
        <div className="inline-flex rounded-lg border bg-card p-1 shadow-sm">
          <Link
            href={buildExploreUrl("/explorar", { ...query, mode: "matches" })}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-display text-xs font-bold transition-all ${
              query.mode === "matches"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="size-3.5" aria-hidden />
            Matches
          </Link>
          <Link
            href={buildExploreUrl("/explorar", { ...query, mode: "todos" })}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-display text-xs font-bold transition-all ${
              query.mode === "todos"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="size-3.5" aria-hidden />
            Todos
          </Link>
        </div>

        {/* Toggle Lista / Mapa */}
        <div className="inline-flex rounded-lg border bg-card p-1 shadow-sm">
          <Link
            href={buildExploreUrl("/explorar", { ...query, view: "lista" })}
            aria-label="Ver como lista"
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-display text-xs font-bold transition-all ${
              query.view === "lista"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <List className="size-3.5" aria-hidden />
            Lista
          </Link>
          <Link
            href={buildExploreUrl("/explorar", { ...query, view: "mapa" })}
            aria-label="Ver no mapa"
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-display text-xs font-bold transition-all ${
              query.view === "mapa"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MapIcon className="size-3.5" aria-hidden />
            Mapa
          </Link>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar nome ou @username"
          className="pl-9"
        />
      </div>

      <div className="-mx-6 overflow-x-auto px-6">
        <div className="flex w-max items-center gap-2">
          <span className="font-display text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Raio
          </span>
          {RADIUS_OPTIONS.map((r) => {
            const active = query.radius === r;
            return (
              <Link
                key={r}
                href={radiusHref(r)}
                className={`whitespace-nowrap rounded-full border px-3 py-1 font-display text-xs font-semibold ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-accent/30"
                }`}
              >
                {r} km
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
