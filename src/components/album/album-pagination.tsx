import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buildAlbumUrl, type AlbumQuery } from "@/lib/album/filters";

interface Props {
  query: AlbumQuery;
  totalPages: number;
  total: number;
}

export function AlbumPagination({ query, totalPages, total }: Props) {
  if (totalPages <= 1) {
    return (
      <p className="py-2 text-center text-xs text-muted-foreground">
        {total} {total === 1 ? "figurinha" : "figurinhas"}
      </p>
    );
  }

  const current = query.page;
  const pages: (number | "...")[] = [];
  const push = (n: number | "...") => {
    if (pages[pages.length - 1] !== n) pages.push(n);
  };

  push(1);
  if (current > 3) push("...");
  for (let p = Math.max(2, current - 1); p <= Math.min(totalPages - 1, current + 1); p++) {
    push(p);
  }
  if (current < totalPages - 2) push("...");
  if (totalPages > 1) push(totalPages);

  return (
    <nav className="flex items-center justify-center gap-1 py-3" aria-label="Paginação">
      {current > 1 && (
        <Link
          href={buildAlbumUrl("/album", { ...query, page: current - 1 })}
          className="flex size-8 items-center justify-center rounded text-sm hover:bg-accent"
          aria-label="Anterior"
        >
          <ChevronLeft className="size-4" />
        </Link>
      )}

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`gap-${i}`} className="px-1 text-xs text-muted-foreground">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={buildAlbumUrl("/album", { ...query, page: p })}
            className={`flex size-8 items-center justify-center rounded text-sm ${
              p === current ? "bg-primary text-primary-foreground" : "hover:bg-accent"
            }`}
            aria-current={p === current ? "page" : undefined}
          >
            {p}
          </Link>
        ),
      )}

      {current < totalPages && (
        <Link
          href={buildAlbumUrl("/album", { ...query, page: current + 1 })}
          className="flex size-8 items-center justify-center rounded text-sm hover:bg-accent"
          aria-label="Próxima"
        >
          <ChevronRight className="size-4" />
        </Link>
      )}
    </nav>
  );
}
