"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { MessageBubble } from "./message-bubble";
import { markReadAction } from "@/lib/actions/chat";
import type { ChatMessage } from "@/lib/chat/data";

interface Props {
  chatId: string;
  meId: string;
  initialMessages: ChatMessage[];
}

export function ChatThread({ chatId, meId, initialMessages }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [, start] = useTransition();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "trocas_messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const m = payload.new as ChatMessage;
          setMessages((prev) =>
            prev.some((p) => p.id === m.id) ? prev : [...prev, m],
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  useEffect(() => {
    const hasUnread = messages.some(
      (m) => m.sender_id !== meId && m.read_at === null,
    );
    if (!hasUnread) return;
    start(() => {
      markReadAction(chatId);
    });
  }, [messages, meId, chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-12 text-center text-sm text-muted-foreground">
        Nenhuma mensagem ainda — mande uma proposta de troca!
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
      {messages.map((m) => (
        <MessageBubble
          key={m.id}
          body={m.body}
          createdAt={m.created_at}
          isMine={m.sender_id === meId}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
