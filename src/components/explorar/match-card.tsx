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

  const hasMatches = match.match_score > 0;
  const highScore = match.match_score >= 4;

  return (
    <Link href={`/u/${match.username}`} className="block">
      <Card className="group relative flex items-center gap-3 overflow-hidden border-border/60 bg-gradient-to-br from-card via-card to-accent/5 p-3 shadow-[var(--shadow-cromo)] transition-all hover:-translate-y-0.5 hover:border-primary/40">
        <div className="relative shrink-0">
          <Avatar
            className={`size-12 ring-2 ring-offset-2 ring-offset-card ${
              hasMatches ? "ring-primary/50" : "ring-border"
            }`}
          >
            <AvatarImage src={match.avatar_url ?? undefined} alt={match.full_name} />
            <AvatarFallback className="bg-primary/10 font-display font-bold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate font-display text-sm font-bold">{match.full_name}</p>
            {hasMatches && (
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 font-display text-xs font-extrabold tabular-nums ${
                  highScore
                    ? "bg-primary text-primary-foreground animate-pulse-soft"
                    : "bg-primary/15 text-primary"
                }`}
              >
                {match.match_score}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3" aria-hidden />
            <span className="truncate">
              {match.city ? `${match.city}, ${match.state}` : match.state ?? "Sem localização"}
            </span>
            {match.distance_km !== null && (
              <>
                <span aria-hidden>·</span>
                <span className="tabular-nums">{match.distance_km} km</span>
              </>
            )}
          </div>

          <div className="mt-1 flex gap-3 text-xs">
            {hasMatches ? (
              <>
                <span className="font-display font-semibold text-primary">
                  {match.i_can_give} dá
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="font-display font-semibold text-accent-foreground">
                  {match.i_can_get} recebe
                </span>
              </>
            ) : (
              <span className="text-xs italic text-muted-foreground">
                Sem trocas mútuas ainda — ver perfil pra detalhes
              </span>
            )}
          </div>
        </div>

        <ChevronRight
          className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary"
          aria-hidden
        />
      </Card>
    </Link>
  );
}
