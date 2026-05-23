"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Check, X, ArrowRight, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatHour } from "@/lib/chat/format";
import { StickerMini } from "./sticker-mini";
import { respondProposalAction } from "@/lib/actions/chat";

type Status = "pending" | "accepted" | "rejected" | "cancelled";

interface Props {
  proposalId: string;
  give: string[];
  receive: string[];
  status: Status;
  createdAt: string;
  isMine: boolean;
}

export function ProposalMessage({
  proposalId,
  give,
  receive,
  status,
  createdAt,
  isMine,
}: Props) {
  const [pending, start] = useTransition();

  const respond = (response: "accepted" | "rejected" | "cancelled") => {
    start(async () => {
      const r = await respondProposalAction(proposalId, response);
      if (r.error) toast.error(r.error);
    });
  };

  const statusBadge: Record<Status, { label: string; cls: string }> = {
    pending: { label: "Pendente", cls: "bg-amber-500/15 text-amber-700" },
    accepted: { label: "Aceita ✓", cls: "bg-emerald-500/15 text-emerald-700" },
    rejected: { label: "Recusada", cls: "bg-destructive/15 text-destructive" },
    cancelled: { label: "Cancelada", cls: "bg-muted text-muted-foreground" },
  };

  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-md space-y-3 p-4">
        <header className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            🤝 Proposta de troca
          </h3>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadge[status].cls}`}
          >
            {statusBadge[status].label}
          </span>
        </header>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
              {isMine ? <ArrowRight className="size-3" /> : <ArrowLeft className="size-3" />}
              {isMine ? "Você dá" : "Você recebe"} ({give.length})
            </div>
            <div className="grid grid-cols-4 gap-1">
              {give.map((c) => (
                <StickerMini key={c} code={c} />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-[11px] font-medium text-amber-600">
              {isMine ? <ArrowLeft className="size-3" /> : <ArrowRight className="size-3" />}
              {isMine ? "Você recebe" : "Você dá"} ({receive.length})
            </div>
            <div className="grid grid-cols-4 gap-1">
              {receive.map((c) => (
                <StickerMini key={c} code={c} />
              ))}
            </div>
          </div>
        </div>

        {status === "pending" && (
          <div className="flex gap-2 pt-1">
            {isMine ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="flex-1"
                disabled={pending}
                onClick={() => respond("cancelled")}
              >
                <X className="mr-1 size-3" /> Cancelar
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  disabled={pending}
                  onClick={() => respond("rejected")}
                >
                  <X className="mr-1 size-3" /> Recusar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="flex-1"
                  disabled={pending}
                  onClick={() => respond("accepted")}
                >
                  <Check className="mr-1 size-3" /> Aceitar
                </Button>
              </>
            )}
          </div>
        )}

        <p className="text-right text-[10px] text-muted-foreground">
          {formatHour(createdAt)}
        </p>
      </Card>
    </div>
  );
}
