import { formatHour } from "@/lib/chat/format";
import { StickerMini } from "./sticker-mini";

interface Props {
  codes: string[];
  createdAt: string;
  isMine: boolean;
}

export function StickerCardMessage({ codes, createdAt, isMine }: Props) {
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-lg p-2 ${
          isMine
            ? "bg-primary text-primary-foreground"
            : "bg-card border border-border"
        }`}
      >
        <p className="px-1 pb-1.5 text-xs opacity-80">
          {codes.length} {codes.length === 1 ? "figurinha" : "figurinhas"}
        </p>
        <div className="grid grid-cols-5 gap-1">
          {codes.map((c) => (
            <StickerMini key={c} code={c} />
          ))}
        </div>
        <p className="px-1 pt-1.5 text-right text-[10px] opacity-70">
          {formatHour(createdAt)}
        </p>
      </div>
    </div>
  );
}
