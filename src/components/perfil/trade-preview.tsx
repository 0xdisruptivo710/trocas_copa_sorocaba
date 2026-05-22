import { Card } from "@/components/ui/card";
import { TEAM_COLORS, formatStickerNumber } from "@/lib/album/teams";
import type { TradePreview as Preview } from "@/lib/explorar/data";

interface Props {
  preview: Preview;
}

export function TradePreview({ preview }: Props) {
  const total = preview.i_give.length + preview.i_get.length;

  if (total === 0) {
    return (
      <Card className="p-6 text-center text-sm text-muted-foreground">
        Vocês não têm uma troca direta agora — talvez quando atualizar o álbum.
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TradeList
        title={`Você dá (${preview.i_give.length})`}
        tone="emerald"
        stickers={preview.i_give}
      />
      <TradeList
        title={`Você recebe (${preview.i_get.length})`}
        tone="amber"
        stickers={preview.i_get}
      />
    </div>
  );
}

function TradeList({
  title,
  tone,
  stickers,
}: {
  title: string;
  tone: "emerald" | "amber";
  stickers: { code: string; team_code: string; number: number; team_name: string }[];
}) {
  const heading = tone === "emerald" ? "text-emerald-600" : "text-amber-600";

  return (
    <Card className="space-y-2 p-4">
      <h2 className={`text-sm font-semibold ${heading}`}>{title}</h2>
      {stickers.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhuma figurinha.</p>
      ) : (
        <ul className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
          {stickers.map((s) => {
            const colors = TEAM_COLORS[s.team_code] ?? { bg: "#404040", fg: "#ffffff" };
            return (
              <li
                key={s.code}
                title={`${s.team_name} ${s.number}`}
                className="rounded p-1.5 text-center"
                style={{ background: colors.bg, color: colors.fg }}
              >
                <p className="text-[10px] font-bold opacity-80">{s.team_code}</p>
                <p className="text-base font-extrabold leading-none">
                  {formatStickerNumber(s.code, s.number)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
