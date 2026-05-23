import { TEAM_COLORS, formatStickerNumber } from "@/lib/album/teams";
import { parseStickerCode } from "@/lib/chat/sticker-codes";

interface Props {
  code: string;
  size?: "sm" | "md";
  selected?: boolean;
  onClick?: () => void;
}

export function StickerMini({ code, size = "sm", selected = false, onClick }: Props) {
  const { team_code, number } = parseStickerCode(code);
  const colors = TEAM_COLORS[team_code] ?? { bg: "#404040", fg: "#ffffff" };
  const dimensions =
    size === "sm" ? "h-12 w-12 text-xs" : "h-16 w-16 text-base";

  const inner = (
    <div
      className={`flex flex-col items-center justify-center rounded ${dimensions} ${
        selected ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""
      }`}
      style={{ background: colors.bg, color: colors.fg }}
    >
      <span className="text-[9px] font-bold opacity-80">{team_code}</span>
      <span className="font-extrabold leading-none">{formatStickerNumber(code, number)}</span>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`${team_code} ${number}`}
        aria-pressed={selected}
        className="block"
      >
        {inner}
      </button>
    );
  }
  return inner;
}
