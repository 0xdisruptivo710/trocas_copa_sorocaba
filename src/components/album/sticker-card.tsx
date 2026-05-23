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

  const borderColor =
    status === "missing"
      ? "border-border/60"
      : status === "owned"
        ? "border-primary/60"
        : "border-accent/70";

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-lg border-2 bg-card transition-all duration-200 ${borderColor} ${
        status !== "missing" ? "shadow-[var(--shadow-cromo)]" : ""
      } hover:-translate-y-0.5 hover:shadow-[var(--shadow-cromo)] active:scale-[0.98]`}
    >
      {/* Topo colorido com bandeira/cor da seleção */}
      <div
        className="holo-overlay relative flex flex-col items-center justify-center px-3 py-4"
        style={{ background: colors.bg, color: colors.fg }}
      >
        <span className="font-display text-[10px] font-bold uppercase tracking-wider opacity-85">
          {teamCode}
        </span>
        <span className="font-display text-3xl font-extrabold leading-none drop-shadow-sm">
          {formatStickerNumber(code, number)}
        </span>
      </div>

      {/* Faixa de info inferior */}
      <div className="flex items-center justify-between bg-card px-2 py-1.5">
        <button
          type="button"
          onClick={toggle}
          aria-label={optimisticPriority ? "Remover prioridade" : "Marcar prioridade"}
          disabled={pending}
          className={`transition-all ${
            optimisticPriority ? "text-accent" : "text-muted-foreground"
          } hover:text-accent hover:scale-110 disabled:opacity-50`}
        >
          <Star
            className="size-4"
            fill={optimisticPriority ? "currentColor" : "none"}
            stroke="currentColor"
          />
        </button>

        <span
          className={`font-display text-xs font-bold tabular-nums ${
            status === "missing"
              ? "text-muted-foreground"
              : status === "owned"
                ? "text-primary"
                : "text-accent-foreground"
          }`}
        >
          {status === "missing"
            ? "Falta"
            : status === "owned"
              ? "✓ Tenho"
              : `${optimisticCount}x`}
        </span>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => change(-1)}
            aria-label="Diminuir"
            disabled={pending || optimisticCount === 0}
            className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-30"
          >
            <Minus className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => change(1)}
            aria-label="Aumentar"
            disabled={pending}
            className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
      </div>

      <span className="sr-only">{teamName}</span>
    </div>
  );
}
