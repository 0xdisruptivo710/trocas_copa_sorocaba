"use client";

import { useState, useTransition, useRef } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { sendMessageAction } from "@/lib/actions/chat";

export function MessageComposer({ chatId }: { chatId: string }) {
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const send = () => {
    const text = body.trim();
    if (!text || pending) return;
    setBody("");
    start(async () => {
      const r = await sendMessageAction(chatId, text);
      if (r.error) {
        toast.error(r.error);
        setBody(text);
      }
      textareaRef.current?.focus();
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <form
      className="sticky bottom-16 z-40 flex items-end gap-2 border-t bg-background/95 p-3 backdrop-blur"
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
    >
      <textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Mensagem"
        rows={1}
        maxLength={2000}
        className="min-h-9 flex-1 resize-none rounded-md border border-border bg-card px-3 py-2 text-sm"
      />
      <Button
        type="submit"
        size="sm"
        disabled={pending || body.trim().length === 0}
        aria-label="Enviar"
      >
        <Send className="size-4" aria-hidden />
      </Button>
    </form>
  );
}
