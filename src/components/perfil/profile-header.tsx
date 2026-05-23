import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Crown, ThumbsUp } from "lucide-react";

interface Props {
  fullName: string;
  username: string;
  avatarUrl: string | null;
  city: string | null;
  state: string | null;
  bio: string | null;
  isPremium?: boolean;
  reputation?: { total: number; positive_pct: number | null };
}

export function ProfileHeader({
  fullName,
  username,
  avatarUrl,
  city,
  state,
  bio,
  isPremium,
  reputation,
}: Props) {
  const initials = fullName
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="space-y-3">
      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          <AvatarImage src={avatarUrl ?? undefined} alt={fullName} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{fullName}</h1>
            {isPremium && (
              <Crown
                className="size-4 text-amber-500"
                aria-label="Premium"
              />
            )}
          </div>
          <p className="text-sm text-muted-foreground">@{username}</p>
          {reputation && reputation.total > 0 && (
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-700">
              <ThumbsUp className="size-3" aria-hidden />
              {reputation.positive_pct}% em {reputation.total}{" "}
              {reputation.total === 1 ? "troca" : "trocas"}
            </p>
          )}
        </div>
      </div>

      {(city || state) && (
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="size-4" aria-hidden />
          {city ? `${city}, ${state}` : state}
        </p>
      )}

      {bio && <p className="text-sm">{bio}</p>}
    </header>
  );
}
