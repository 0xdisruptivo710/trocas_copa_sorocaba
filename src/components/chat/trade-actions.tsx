"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, ThumbsUp, ThumbsDown, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  initTradeAction,
  confirmTradeAction,
  rateTradeAction,
} from "@/lib/actions/trade";
import type { TradeRecord } from "@/lib/chat/data";

interface Props {
  proposalId: string;
  meId: string;
  otherId: string;
  trade: TradeRecord | null;
}

/**
 * Renderiza o estado da troca pós-aceite:
 * - Sem trade ainda → "Marcar como entregue" (cria trade + confirma o meu lado)
 * - Trade pendente do outro lado → "Aguardando confirmação"
 * - Trade pendente do meu lado → "Marcar como entregue"
 * - Trade aplicada → "Trocada ✓" + botão "Avaliar 👍/👎" se ainda não avaliei
 */
export function TradeActions({ proposalId, meId, otherId, trade }: Props) {
  const [pending, start] = useTransition();
  const [showRate, setShowRate] = useState(false);

  const startTrade = () => {
    start(async () => {
      const initRes = await initTradeAction(proposalId);
      if (initRes.error || !initRes.tradeId) {
        toast.error(initRes.error ?? "Falha ao iniciar troca");
        return;
      }
      const confirmRes = await confirmTradeAction(initRes.tradeId);
      if (confirmRes.error) {
        toast.error(confirmRes.error);
        return;
      }
      if (confirmRes.status === "applied") {
        toast.success("Troca aplicada — álbuns atualizados!");
      } else {
        toast.success("Confirmado do seu lado. Aguardando o outro.");
      }
    });
  };

  const confirmMine = (tradeId: string) => {
    start(async () => {
      const r = await confirmTradeAction(tradeId);
      if (r.error) {
        toast.error(r.error);
        return;
      }
      if (r.status === "applied") {
        toast.success("Troca aplicada — álbuns atualizados!");
      } else {
        toast.success("Confirmado. Aguardando o outro.");
      }
    });
  };

  const submitRating = (tradeId: string, score: 1 | -1) => {
    start(async () => {
      const r = await rateTradeAction(tradeId, otherId, score);
      if (r.error) {
        toast.error(r.error);
        return;
      }
      toast.success("Avaliação enviada.");
      setShowRate(false);
    });
  };

  if (!trade) {
    return (
      <Button
        type="button"
        size="sm"
        className="w-full"
        disabled={pending}
        onClick={startTrade}
      >
        <Truck className="mr-1 size-3" /> Marcar como entregue
      </Button>
    );
  }

  if (trade.applied_at) {
    return (
      <div className="space-y-2">
        <p className="text-center text-xs font-medium text-emerald-600">
          ✓ Troca concluída — álbum atualizado
        </p>
        {!trade.rated_by_me && (
          <>
            {!showRate ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => setShowRate(true)}
              >
                Avaliar o parceiro
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  disabled={pending}
                  onClick={() => submitRating(trade.id, -1)}
                >
                  <ThumbsDown className="mr-1 size-3" /> Ruim
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="flex-1"
                  disabled={pending}
                  onClick={() => submitRating(trade.id, 1)}
                >
                  <ThumbsUp className="mr-1 size-3" /> Boa
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // pending: trade existe mas não aplicada — descobre se EU já confirmei
  const isAuthor = meId === trade.author_id;
  const meConfirmed = isAuthor ? !!trade.author_confirmed_at : !!trade.partner_confirmed_at;

  if (meConfirmed) {
    return (
      <p className="text-center text-xs text-muted-foreground">
        <Check className="inline size-3 text-emerald-600" /> Confirmado do seu lado.
        Aguardando o outro confirmar.
      </p>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      className="w-full"
      disabled={pending}
      onClick={() => confirmMine(trade.id)}
    >
      <Truck className="mr-1 size-3" /> Marcar como entregue
    </Button>
  );
}
