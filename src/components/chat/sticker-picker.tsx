"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StickerMini } from "./sticker-mini";
import type { StickerCode } from "@/lib/chat/sticker-codes";

interface Props {
  title: string;
  stickers: StickerCode[];
  initialSelection?: string[];
  maxSelection?: number;
  excludeCodes?: string[];
  onConfirm: (codes: string[]) => void;
  onClose: () => void;
}

export function StickerPicker({
  title,
  stickers,
  initialSelection = [],
  maxSelection = 30,
  excludeCodes = [],
  onConfirm,
  onClose,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelection));
  const [q, setQ] = useState("");

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = orig;
    };
  }, []);

  const excludeSet = useMemo(() => new Set(excludeCodes), [excludeCodes]);

  const filtered = useMemo(() => {
    const qUpper = q.trim().toUpperCase();
    return stickers.filter((s) => {
      if (excludeSet.has(s.code)) return false;
      if (!qUpper) return true;
      return (
        s.team_code.includes(qUpper) ||
        s.code.includes(qUpper) ||
        s.team_name.toUpperCase().includes(qUpper) ||
        String(s.number) === qUpper
      );
    });
  }, [stickers, q, excludeSet]);

  const toggle = (code: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else if (next.size < maxSelection) {
        next.add(code);
      }
      return next;
    });
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 sm:items-center">
      <div className="flex h-[85dvh] w-full max-w-md flex-col rounded-t-xl bg-background sm:rounded-xl">
        <header className="flex items-center justify-between border-b p-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded p-1 hover:bg-accent"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar"
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {stickers.length === 0
                ? "Nada disponível com esse filtro."
                : "Sem resultado pra essa busca."}
            </p>
          ) : (
            <div className="grid grid-cols-6 gap-1.5">
              {filtered.map((s) => (
                <StickerMini
                  key={s.code}
                  code={s.code}
                  selected={selected.has(s.code)}
                  onClick={() => toggle(s.code)}
                />
              ))}
            </div>
          )}
        </div>

        <footer className="flex items-center justify-between border-t p-3">
          <p className="text-xs text-muted-foreground">
            {selected.size} de até {maxSelection}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} size="sm">
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => onConfirm([...selected])}
              disabled={selected.size === 0}
              size="sm"
            >
              Confirmar
            </Button>
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
