import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin } from "lucide-react";

interface Props {
  fullName: string;
  username: string;
  avatarUrl: string | null;
  city: string | null;
  state: string | null;
  bio: string | null;
}

export function ProfileHeader({
  fullName,
  username,
  avatarUrl,
  city,
  state,
  bio,
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
          <h1 className="text-xl font-semibold">{fullName}</h1>
          <p className="text-sm text-muted-foreground">@{username}</p>
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
