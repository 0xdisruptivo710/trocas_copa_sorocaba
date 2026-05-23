import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listChats } from "@/lib/chat/data";
import { ChatListItem } from "@/components/chat/chat-list-item";
import { Card } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";

export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const chats = await listChats(user.id);

  return (
    <main className="space-y-4 px-6 py-6">
      <header>
        <h1 className="text-2xl font-semibold">Chat</h1>
        <p className="text-sm text-muted-foreground">
          {chats.length === 0
            ? "Suas conversas aparecem aqui"
            : `${chats.length} ${chats.length === 1 ? "conversa" : "conversas"}`}
        </p>
      </header>

      {chats.length === 0 ? (
        <Card className="space-y-2 p-6 text-center">
          <MessageCircle className="mx-auto size-8 text-muted-foreground" />
          <h2 className="font-semibold">Sem conversas ainda</h2>
          <p className="text-sm text-muted-foreground">
            Abre o perfil de um match em Explorar e clica em &quot;Conversar&quot;.
          </p>
        </Card>
      ) : (
        <ul className="space-y-2">
          {chats.map((c) => (
            <li key={c.chat_id}>
              <ChatListItem item={c} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
