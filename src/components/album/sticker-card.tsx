"use client";

import { useTransition, useState } from "react";
import { Star, Minus, Plus } from "lucide-react";
import { TEAM_COLORS, formatStickerNumber } from "@/lib/album/teams";
import { setStickerQuantity, togglePriority } from "@/lib/actions/stickers";
import { toast } from "sonner";

interface Props {
  code: string;
  teamCode: string;
  teamName: string;
  number: number;
  ownedCount: number;
  isPriority: boolean;
}

export function StickerCard({
  code,
  teamCode,
  teamName,
  number,
  ownedCount,
  isPriority,
}: Props) {
  const [optimisticCount, setOptimisticCount] = useState(ownedCount);
  const [optimisticPriority, setOptimisticPriority] = useState(isPriority);
  const [pending, start] = useTransition();

  const colors = TEAM_COLORS[teamCode] ?? { bg: "#404040", fg: "#ffffff" };

  const status =
    optimisticCount === 0 ? "missing" : optimisticCount === 1 ? "owned" : "duplicate";

  const change = (delta: 1 | -1) => {
    const next = Math.max(0, Math.min(99, optimisticCount + delta));
    if (next === optimisticCount) return;
    setOptimisticCount(next);
    start(async () => {
      const r = await setStickerQuantity(code, delta);
      if (r.error) {
        setOptimisticCount(ownedCount);
        toast.error(r.error);
      }
    });
  };

  const toggle = () => {
    const next = !optimisticPriority;
    setOptimisticPriority(next);
    start(async () => {
      const r = await togglePriority(code);
      if (r.error) {
        setOptimisticPriority(isPriority);
        toast.error(r.error);
      }
    });
  };

  return (
    <div
      className={`relative flex flex-col rounded-lg border ${
        status === "missing"
          ? "border-border bg-card"
          : status === "owned"
            ? "border-emerald-500/50 bg-card"
            : "border-amber-500/50 bg-card"
      }`}
    >
      <div
        className="flex flex-col items-center justify-center rounded-t-lg p-3"
        style={{ background: colors.bg, color: colors.fg }}
      >
        <span className="text-xs font-bold opacity-80">{teamCode}</span>
        <span className="text-2xl font-extrabold leading-none">
          {formatStickerNumber(code, number)}
        </span>
      </div>

      <div className="flex items-center justify-between px-2 py-1.5">
        <button
          type="button"
          onClick={toggle}
          aria-label={optimisticPriority ? "Remover prioridade" : "Marcar prioridade"}
          disabled={pending}
          className="text-muted-foreground hover:text-amber-500 disabled:opacity-50"
        >
          <Star
            className="size-4"
            fill={optimisticPriority ? "currentColor" : "none"}
            stroke="currentColor"
          />
        </button>

        <span
          className={`text-xs font-medium ${
            status === "missing"
              ? "text-muted-foreground"
              : status === "owned"
                ? "text-emerald-600"
                : "text-amber-600"
          }`}
        >
          {status === "missing"
            ? "Falta"
            : status === "owned"
              ? "Tenho"
              : `${optimisticCount}x`}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => change(-1)}
            aria-label="Diminuir"
            disabled={pending || optimisticCount === 0}
            className="rounded p-0.5 text-muted-foreground hover:bg-accent disabled:opacity-30"
          >
            <Minus className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => change(1)}
            aria-label="Aumentar"
            disabled={pending}
            className="rounded p-0.5 text-muted-foreground hover:bg-accent disabled:opacity-50"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
      </div>

      <span className="sr-only">{teamName}</span>
    </div>
  );
}
