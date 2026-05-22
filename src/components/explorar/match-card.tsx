import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ChevronRight, MapPin } from "lucide-react";
import type { Match } from "@/lib/explorar/data";

export function MatchCard({ match }: { match: Match }) {
  const initials = match.full_name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Link href={`/u/${match.username}`} className="block">
      <Card className="flex items-center gap-3 p-3 transition-colors hover:bg-accent">
        <Avatar className="size-12 shrink-0">
          <AvatarImage src={match.avatar_url ?? undefined} alt={match.full_name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-sm font-semibold">{match.full_name}</p>
            <span className="shrink-0 text-xs font-bold text-primary">
              {match.match_score}
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3" aria-hidden />
            <span className="truncate">
              {match.city ? `${match.city}, ${match.state}` : match.state ?? "—"}
            </span>
            <span aria-hidden>·</span>
            <span>{match.distance_km} km</span>
          </div>

          <div className="mt-1 flex gap-3 text-xs">
            <span className="text-emerald-600">
              <strong>{match.i_can_give}</strong> que você dá
            </span>
            <span className="text-amber-600">
              <strong>{match.i_can_get}</strong> que recebe
            </span>
          </div>
        </div>

        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </Card>
    </Link>
  );
}
