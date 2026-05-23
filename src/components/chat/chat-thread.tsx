"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { MessageBubble } from "./message-bubble";
import { StickerCardMessage } from "./sticker-card-message";
import { ProposalMessage } from "./proposal-message";
import { SystemMessage } from "./system-message";
import { markReadAction } from "@/lib/actions/chat";
import type { ChatMessage, ProposalMetadata, StickerCardMetadata } from "@/lib/chat/data";

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
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "trocas_messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const m = payload.new as ChatMessage;
          setMessages((prev) => prev.map((p) => (p.id === m.id ? m : p)));
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
      {messages.map((m) => {
        const isMine = m.sender_id === meId;

        if (m.kind === "sticker_card") {
          const meta = m.metadata as Partial<StickerCardMetadata>;
          const codes = Array.isArray(meta.codes) ? meta.codes : [];
          return (
            <StickerCardMessage
              key={m.id}
              codes={codes}
              createdAt={m.created_at}
              isMine={isMine}
            />
          );
        }

        if (m.kind === "proposal") {
          const meta = m.metadata as Partial<ProposalMetadata>;
          return (
            <ProposalMessage
              key={m.id}
              proposalId={m.id}
              give={Array.isArray(meta.give) ? meta.give : []}
              receive={Array.isArray(meta.receive) ? meta.receive : []}
              status={(meta.status ?? "pending") as ProposalMetadata["status"]}
              createdAt={m.created_at}
              isMine={isMine}
            />
          );
        }

        if (m.kind === "system") {
          return <SystemMessage key={m.id} body={m.body} />;
        }

        return (
          <MessageBubble
            key={m.id}
            body={m.body}
            createdAt={m.created_at}
            isMine={isMine}
          />
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
