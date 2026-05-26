import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getChatThread } from "@/lib/chat/data";
import { ChatThread } from "@/components/chat/chat-thread";
import { MessageComposer } from "@/components/chat/message-composer";
import { UserActionsMenu } from "@/components/perfil/user-actions-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ChatThreadPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const thread = await getChatThread(user.id, id);
  if (!thread) notFound();

  const { data: me } = await supabase
    .from("trocas_profiles")
    .select("is_premium")
    .eq("id", user.id)
    .single();
  const isPremium = me?.is_premium ?? false;

  const initials = thread.other_full_name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="flex min-h-[calc(100dvh-4rem)] flex-col">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-background/95 px-3 py-2 backdrop-blur">
        <Link
          href="/chat"
          aria-label="Voltar"
          className="-ml-1 rounded p-1 hover:bg-accent"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </Link>
        <Link href={`/u/${thread.other_username}`} className="flex flex-1 items-center gap-2">
          <Avatar className="size-8">
            <AvatarImage src={thread.other_avatar_url ?? undefined} alt={thread.other_full_name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold">{thread.other_full_name}</p>
            <p className="text-xs text-muted-foreground">@{thread.other_username}</p>
          </div>
        </Link>
        <UserActionsMenu
          otherUserId={thread.other_id}
          otherName={thread.other_username}
          chatId={thread.chat_id}
          redirectAfterBlock="/chat"
        />
      </header>

      <ChatThread
        chatId={thread.chat_id}
        meId={thread.me_id}
        otherId={thread.other_id}
        initialMessages={thread.messages}
        trades={thread.trades}
      />

      <MessageComposer chatId={thread.chat_id} isPremium={isPremium} />
    </main>
  );
}
