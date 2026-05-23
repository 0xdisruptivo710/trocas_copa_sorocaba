import { formatHour } from "@/lib/chat/format";

interface Props {
  body: string;
  createdAt: string;
  isMine: boolean;
}

export function MessageBubble({ body, createdAt, isMine }: Props) {
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 ${
          isMine
            ? "bg-primary text-primary-foreground"
            : "bg-card border border-border"
        }`}
      >
        <p className="whitespace-pre-wrap break-words text-sm">{body}</p>
        <p
          className={`mt-1 text-right text-[10px] ${
            isMine ? "text-primary-foreground/70" : "text-muted-foreground"
          }`}
        >
          {formatHour(createdAt)}
        </p>
      </div>
    </div>
  );
}
