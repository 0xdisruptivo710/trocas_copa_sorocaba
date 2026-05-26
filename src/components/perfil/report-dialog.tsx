"use client";

import { useState, useTransition } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { reportUserAction, type ReportReason } from "@/lib/actions/moderation";

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "spam", label: "Spam ou propaganda" },
  { value: "assedio", label: "Assédio ou ofensa" },
  { value: "fraude_troca", label: "Fraude em troca" },
  { value: "conteudo_improprio", label: "Conteúdo impróprio" },
  { value: "perfil_falso", label: "Perfil falso" },
  { value: "menor_de_idade", label: "Menor de idade" },
  { value: "outro", label: "Outro" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  otherUserId: string;
  otherName: string;
  chatId?: string | null;
}

export function ReportDialog({ open, onOpenChange, otherUserId, otherName, chatId }: Props) {
  const [reason, setReason] = useState<ReportReason>("spam");
  const [details, setDetails] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await reportUserAction(
        otherUserId,
        reason,
        details || null,
        chatId ?? null,
      );
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Denúncia enviada. Nossa equipe vai revisar.");
        setReason("spam");
        setDetails("");
        onOpenChange(false);
      }
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <Dialog.Popup className="fixed left-[50%] top-[50%] z-50 w-[min(calc(100vw-2rem),28rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-card p-6 shadow-2xl data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
          <Dialog.Title className="font-display text-xl font-bold">
            Reportar @{otherName}
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            Denúncias são revisadas manualmente. Casos confirmados resultam em
            suspensão da conta.
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-sm font-medium">
                Motivo
              </Label>
              <select
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value as ReportReason)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={pending}
              >
                {REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="details" className="text-sm font-medium">
                Detalhes <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <textarea
                id="details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={1000}
                rows={4}
                placeholder="O que aconteceu?"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={pending}
              />
              <p className="text-right text-xs text-muted-foreground tabular-nums">
                {details.length} / 1000
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Dialog.Close
                render={
                  <Button type="button" variant="outline" className="flex-1" disabled={pending}>
                    Cancelar
                  </Button>
                }
              />
              <Button type="submit" className="flex-1" disabled={pending}>
                {pending ? "Enviando..." : "Enviar denúncia"}
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
