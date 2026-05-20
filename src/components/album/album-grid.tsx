import { StickerCard } from "./sticker-card";
import type { StickerRow } from "@/lib/album/data";

export function AlbumGrid({ stickers }: { stickers: StickerRow[] }) {
  if (stickers.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Nenhuma figurinha encontrada com esses filtros.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {stickers.map((s) => (
        <StickerCard
          key={s.code}
          code={s.code}
          teamCode={s.team_code}
          teamName={s.team_name}
          number={s.number}
          ownedCount={s.owned_count}
          isPriority={s.is_priority}
        />
      ))}
    </div>
  );
}
