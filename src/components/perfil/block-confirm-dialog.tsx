"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { blockUserAction } from "@/lib/actions/moderation";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  otherUserId: string;
  otherName: string;
  /** Para onde redirecionar após bloquear. Default: /chat */
  redirectTo?: string;
}

export function BlockConfirmDialog({
  open,
  onOpenChange,
  otherUserId,
  otherName,
  redirectTo = "/chat",
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const result = await blockUserAction(otherUserId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`@${otherName} bloqueado.`);
        onOpenChange(false);
        router.push(redirectTo);
        router.refresh();
      }
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <Dialog.Popup className="fixed left-[50%] top-[50%] z-50 w-[min(calc(100vw-2rem),24rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-card p-6 shadow-2xl data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
          <Dialog.Title className="font-display text-xl font-bold">
            Bloquear @{otherName}?
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted-foreground">
            Vocês não vão mais se ver no Mapa de Trocas nem conseguir conversar.
            O chat atual some da sua lista. Você pode desbloquear depois em
            Conta &gt; Privacidade.
          </Dialog.Description>

          <div className="mt-5 flex gap-2">
            <Dialog.Close
              render={
                <Button type="button" variant="outline" className="flex-1" disabled={pending}>
                  Cancelar
                </Button>
              }
            />
            <Button
              type="button"
              variant="destructive"
              className="flex-1"
              disabled={pending}
              onClick={handleConfirm}
            >
              {pending ? "Bloqueando..." : "Bloquear"}
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
