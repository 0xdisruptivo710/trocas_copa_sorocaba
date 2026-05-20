"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { GROUP_LABELS } from "@/lib/album/teams";
import { buildAlbumUrl, type AlbumQuery, type StatusFilter } from "@/lib/album/filters";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "faltando", label: "Faltando" },
  { value: "tenho", label: "Tenho" },
  { value: "repetidas", label: "Repetidas" },
  { value: "prioridade", label: "Prioridade" },
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

  return (
    <div className="space-y-3">
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
          {GROUP_LABELS.map((g) => {
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
    </div>
  );
}
