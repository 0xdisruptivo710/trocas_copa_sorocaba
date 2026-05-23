import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/chat/format";
import type { ChatListItem as Item } from "@/lib/chat/data";

export function ChatListItem({ item }: { item: Item }) {
  const initials = item.other_full_name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const preview = item.last_message
    ? `${item.last_sender_was_me ? "Você: " : ""}${item.last_message}`
    : "Conversa aberta — diga oi!";

  return (
    <Link href={`/chat/${item.chat_id}`} className="block">
      <Card className="flex items-center gap-3 p-3 transition-colors hover:bg-accent">
        <Avatar className="size-12 shrink-0">
          <AvatarImage src={item.other_avatar_url ?? undefined} alt={item.other_full_name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-sm font-semibold">{item.other_full_name}</p>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatRelativeTime(item.last_message_at)}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-xs text-muted-foreground">{preview}</p>
            {item.unread_count > 0 && (
              <span className="shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                {item.unread_count}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
