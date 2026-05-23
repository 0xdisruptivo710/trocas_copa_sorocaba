"use client";

import { useTransition } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { openChatAction } from "@/lib/actions/chat";

export function ConversarButton({ otherUserId }: { otherUserId: string }) {
  const [pending, start] = useTransition();

  const onClick = () => {
    start(async () => {
      const r = await openChatAction(otherUserId);
      if (r?.error) toast.error(r.error);
      // Em sucesso, openChatAction redireciona (throws).
    });
  };

  return (
    <Button onClick={onClick} disabled={pending} className="w-full" size="lg">
      <MessageCircle className="mr-2 size-4" aria-hidden />
      {pending ? "Abrindo…" : "Conversar"}
    </Button>
  );
}
