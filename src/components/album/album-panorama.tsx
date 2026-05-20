import type { Panorama } from "@/lib/album/data";
import { Card } from "@/components/ui/card";

export function AlbumPanorama({ panorama }: { panorama: Panorama }) {
  const { total, owned, duplicates, missing, priority, percent } = panorama;

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">Panorama</h2>
        <span className="text-xs text-muted-foreground">
          {owned} de {total} ({percent}%)
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        <Stat label="Tenho" value={owned} tone="emerald" />
        <Stat label="Repetidas" value={duplicates} tone="amber" />
        <Stat label="Faltam" value={missing} tone="muted" />
        <Stat label="Prioridade" value={priority} tone="primary" />
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
  tone: "emerald" | "amber" | "muted" | "primary";
}) {
  const colors = {
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    muted: "text-muted-foreground",
    primary: "text-primary",
  }[tone];

  return (
    <div>
      <p className={`text-lg font-bold ${colors}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
