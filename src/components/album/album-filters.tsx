"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import { Search, Globe2, Trophy, Sparkles, LayoutGrid } from "lucide-react";
import { Input } from "@/components/ui/input";
import { GROUP_LABELS } from "@/lib/album/teams";
import {
  buildAlbumUrl,
  type AlbumQuery,
  type StatusFilter,
  type CategoryFilter,
} from "@/lib/album/filters";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "faltando", label: "Faltando" },
  { value: "tenho", label: "Tenho" },
  { value: "repetidas", label: "Repetidas" },
  { value: "prioridade", label: "Prioridade" },
];

const CATEGORY_OPTIONS: {
  value: CategoryFilter;
  label: string;
  icon: typeof LayoutGrid;
}[] = [
  { value: "todas", label: "Tudo", icon: LayoutGrid },
  { value: "fifa", label: "FIFA", icon: Trophy },
  { value: "paises", label: "Países", icon: Globe2 },
  { value: "especiais", label: "Especiais", icon: Sparkles },
];

export function AlbumFilters({ query }: { query: AlbumQuery }) {
  const router = useRouter();
  const [q, setQ] = useState(query.q);
  const [, start] = useTransition();

  useEffect(() => {
    if (q === query.q) return;
    const t = setTimeout(() => {
      start(() => {
        router.push(buildAlbumUrl("/album", { ...query, q, page: 1 }));
      });
    }, 300);
    return () => clearTimeout(t);
  }, [q, query, router]);

  const baseHref = (override: Partial<AlbumQuery>) =>
    buildAlbumUrl("/album", { ...query, ...override, page: 1 });

  // Quando o user troca de categoria, reseta o filtro de grupo
  // (que só faz sentido em Países / Todas).
  const categoryHref = (cat: CategoryFilter) =>
    buildAlbumUrl("/album", { ...query, category: cat, group: "all", page: 1 });

  const showGroupRow = query.category === "todas" || query.category === "paises";

  return (
    <div className="space-y-3">
      {/* Categorias top-level */}
      <div className="flex flex-wrap gap-2">
        {CATEGORY_OPTIONS.map((opt) => {
          const active = query.category === opt.value;
          const Icon = opt.icon;
          return (
            <Link
              key={opt.value}
              href={categoryHref(opt.value)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 font-display text-xs font-bold uppercase tracking-wide transition-all ${
                active
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              <Icon className="size-3.5" aria-hidden />
              {opt.label}
            </Link>
          );
        })}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por número, código ou seleção"
          className="pl-9"
        />
      </div>

      <div className="-mx-6 overflow-x-auto px-6">
        <div className="flex w-max gap-2">
          {STATUS_OPTIONS.map((opt) => {
            const active = query.status === opt.value;
            return (
              <Link
                key={opt.value}
                href={baseHref({ status: opt.value })}
                className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-accent"
                }`}
              >
                {opt.label}
              </Link>
            );
          })}
        </div>
      </div>

      {showGroupRow && (
        <div className="-mx-6 overflow-x-auto px-6">
          <div className="flex w-max gap-2">
            <Link
              href={baseHref({ group: "all" })}
              className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs ${
                query.group === "all"
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-muted-foreground hover:bg-accent"
              }`}
            >
              Todas
            </Link>
            {GROUP_LABELS.filter((g) => g !== "FWC" && g !== "Coca-Cola").map((g) => {
              const active = query.group === g;
              return (
                <Link
                  key={g}
                  href={baseHref({ group: g })}
                  className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs ${
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-card text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {g}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
