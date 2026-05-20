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
    <main className="space-y-4 px-6 py-6">
      <header>
        <h1 className="text-2xl font-semibold">Álbum</h1>
        <p className="text-sm text-muted-foreground">Copa 2026 · 994 figurinhas</p>
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
