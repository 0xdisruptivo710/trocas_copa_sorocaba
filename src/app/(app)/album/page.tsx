import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { parseAlbumQuery } from "@/lib/album/filters";
import { getAlbumPage, getPanorama } from "@/lib/album/data";
import { AlbumFilters } from "@/components/album/album-filters";
import { AlbumGrid } from "@/components/album/album-grid";
import { AlbumPagination } from "@/components/album/album-pagination";
import { AlbumPanorama } from "@/components/album/album-panorama";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AlbumPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sp = new URLSearchParams(
    Object.entries(params).flatMap(([k, v]) =>
      Array.isArray(v) ? v.map((vv) => [k, vv]) : v ? [[k, v]] : [],
    ) as [string, string][],
  );
  const query = parseAlbumQuery(sp);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [page, panorama] = await Promise.all([
    getAlbumPage(user.id, query),
    getPanorama(user.id),
  ]);

  return (
    <main className="space-y-6 px-6 py-6 md:px-10 md:py-10">
      <header>
        <p className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Sua coleção
        </p>
        <h1 className="font-display text-4xl font-extrabold uppercase leading-none tracking-tight md:text-6xl">
          Seu Álbum
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Marque o que você já colou e o que está repetido. O catálogo está
          organizado em seções, como num álbum de verdade.
        </p>
      </header>

      <AlbumPanorama panorama={panorama} />

      <AlbumFilters query={query} />

      <AlbumGrid stickers={page.stickers} />

      <AlbumPagination
        query={query}
        totalPages={page.totalPages}
        total={page.total}
      />
    </main>
  );
}
