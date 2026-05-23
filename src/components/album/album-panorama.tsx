import type { Panorama } from "@/lib/album/data";
import { Card } from "@/components/ui/card";

export function AlbumPanorama({ panorama }: { panorama: Panorama }) {
  const { total, owned, duplicates, missing, priority, percent } = panorama;

  return (
    <Card className="space-y-3 border-border/60 bg-gradient-to-br from-card via-card to-primary/5 p-4 shadow-[var(--shadow-cromo)]">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-sm font-bold uppercase tracking-wider">Panorama</h2>
        <span className="font-display text-xs font-semibold tabular-nums text-muted-foreground">
          <span className="text-foreground">{owned}</span> de {total}
          <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
            {percent}%
          </span>
        </span>
      </div>

      {/* Progress bar com gradient + marcadores 25/50/75% */}
      <div className="relative h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-accent transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
        {/* Tick marks */}
        {[25, 50, 75].map((tick) => (
          <span
            key={tick}
            className="absolute top-0 h-full w-px bg-background/50"
            style={{ left: `${tick}%` }}
            aria-hidden
          />
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        <Stat label="Tenho" value={owned} tone="primary" />
        <Stat label="Repetidas" value={duplicates} tone="accent" />
        <Stat label="Faltam" value={missing} tone="muted" />
        <Stat label="Prioridade" value={priority} tone="vermelho" />
      </div>
    </Card>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "primary" | "accent" | "muted" | "vermelho";
}) {
  const colors = {
    primary: "text-primary",
    accent: "text-accent-foreground",
    muted: "text-muted-foreground",
    vermelho: "text-destructive",
  }[tone];

  return (
    <div>
      <p className={`font-display text-xl font-extrabold tabular-nums ${colors}`}>
        {value}
      </p>
      <p className="text-[10px] font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
