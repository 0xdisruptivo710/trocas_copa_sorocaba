"use client";

import { useState, useTransition, useRef } from "react";
import { Send, Paperclip, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  sendMessageAction,
  sendStickerCardAction,
  sendProposalAction,
  loadMyStickersAction,
} from "@/lib/actions/chat";
import { StickerPicker } from "./sticker-picker";
import type { StickerCode } from "@/lib/chat/sticker-codes";

type ModalMode = null | { kind: "card" } | { kind: "proposal-give" } | { kind: "proposal-receive" };

interface Props {
  chatId: string;
  isPremium: boolean;
}

export function MessageComposer({ chatId, isPremium }: Props) {
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [modal, setModal] = useState<ModalMode>(null);
  const [pickerStickers, setPickerStickers] = useState<StickerCode[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [giveDraft, setGiveDraft] = useState<string[]>([]);

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

  const openCardPicker = async () => {
    if (!isPremium) {
      toast.error("Anexar cromos é Premium. Ativa em /conta/premium.");
      return;
    }
    setModal({ kind: "card" });
    setPickerLoading(true);
    const r = await loadMyStickersAction("owned");
    setPickerStickers(r.stickers);
    setPickerLoading(false);
  };

  const openProposalGive = async () => {
    if (!isPremium) {
      toast.error("Propostas são Premium. Ativa em /conta/premium.");
      return;
    }
    setGiveDraft([]);
    setModal({ kind: "proposal-give" });
    setPickerLoading(true);
    const r = await loadMyStickersAction("duplicates");
    setPickerStickers(r.stickers);
    setPickerLoading(false);
  };

  const goToProposalReceive = async (give: string[]) => {
    setGiveDraft(give);
    setModal({ kind: "proposal-receive" });
    setPickerLoading(true);
    const r = await loadMyStickersAction("missing");
    setPickerStickers(r.stickers);
    setPickerLoading(false);
  };

  const submitCard = (codes: string[]) => {
    setModal(null);
    start(async () => {
      const r = await sendStickerCardAction(chatId, codes);
      if (r.error) toast.error(r.error);
    });
  };

  const submitProposal = (receive: string[]) => {
    setModal(null);
    start(async () => {
      const r = await sendProposalAction(chatId, giveDraft, receive);
      if (r.error) toast.error(r.error);
      setGiveDraft([]);
    });
  };

  return (
    <>
      <form
        className="sticky bottom-16 z-40 flex items-end gap-1 border-t bg-background/95 p-2 backdrop-blur"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={openCardPicker}
          disabled={pending}
          aria-label="Anexar cromos"
          title={isPremium ? "Anexar cromos" : "Premium — anexar cromos"}
          className="shrink-0"
        >
          <Paperclip className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={openProposalGive}
          disabled={pending}
          aria-label="Propor troca"
          title={isPremium ? "Propor troca" : "Premium — propor troca"}
          className="shrink-0"
        >
          <Handshake className="size-4" />
        </Button>

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
          className="shrink-0"
        >
          <Send className="size-4" aria-hidden />
        </Button>
      </form>

      {modal?.kind === "card" && (
        <StickerPicker
          title={pickerLoading ? "Carregando…" : "Anexar cromos (Tenho)"}
          stickers={pickerStickers}
          onConfirm={submitCard}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.kind === "proposal-give" && (
        <StickerPicker
          title={
            pickerLoading
              ? "Carregando suas repetidas…"
              : "Passo 1/2 — Cromos que você dá (repetidas)"
          }
          stickers={pickerStickers}
          onConfirm={goToProposalReceive}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.kind === "proposal-receive" && (
        <StickerPicker
          title={
            pickerLoading
              ? "Carregando seus faltantes…"
              : "Passo 2/2 — Cromos que você recebe (faltam)"
          }
          stickers={pickerStickers}
          excludeCodes={giveDraft}
          onConfirm={submitProposal}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
