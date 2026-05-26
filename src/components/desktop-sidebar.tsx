"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  BookOpen,
  MessageCircle,
  User,
  Gift,
  Crown,
  Info,
  LogOut,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/brand/logo";
import { logoutAction } from "@/lib/actions/auth";

const NAV_MAIN = [
  { href: "/home", label: "Início", icon: Home },
  { href: "/album", label: "Álbum", icon: BookOpen },
  { href: "/explorar", label: "Explorar", icon: Search },
  { href: "/chat", label: "Chat", icon: MessageCircle },
] as const;

const NAV_SECONDARY = [
  { href: "/conta", label: "Perfil", icon: User },
  { href: "/conta/premium", label: "Premium", icon: Crown },
  { href: "/conta/indicar", label: "Indicar", icon: Gift },
  { href: "/sobre", label: "Sobre", icon: Info },
] as const;

interface Props {
  fullName: string;
  username: string;
  avatarUrl: string | null;
}

export function DesktopSidebar({ fullName, username, avatarUrl }: Props) {
  const path = usePathname();

  const initials = fullName
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:w-60 md:flex-col md:border-r md:border-border/60 md:bg-muted/30">
      <div className="flex h-full flex-col px-4 py-5">
        <Link href="/home" className="mb-6 flex items-center gap-2">
          <Logo variant="mark" size={32} />
          <span className="font-display text-sm font-extrabold leading-tight">
            trocas copa
            <span className="block text-primary">SOROCABA</span>
          </span>
        </Link>

        <div className="mb-2">
          <p className="px-2 font-display text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Navegação
          </p>
        </div>
        <nav className="space-y-0.5">
          {NAV_MAIN.map((t) => {
            const active = t.href === "/home" ? path === "/home" : path.startsWith(t.href);
            const Icon = t.icon;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`flex items-center gap-2 rounded-md px-2 py-2 text-sm font-display font-semibold transition-colors ${
                  active
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-accent/30 hover:text-foreground"
                }`}
              >
                <Icon className="size-4" aria-hidden />
                {t.label}
              </Link>
            );
          })}
        </nav>

        <div className="mb-2 mt-6">
          <p className="px-2 font-display text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Conta
          </p>
        </div>
        <nav className="space-y-0.5">
          {NAV_SECONDARY.map((t) => {
            const active = path === t.href;
            const Icon = t.icon;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`flex items-center gap-2 rounded-md px-2 py-2 text-sm font-display font-semibold transition-colors ${
                  active
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-accent/30 hover:text-foreground"
                }`}
              >
                <Icon className="size-4" aria-hidden />
                {t.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto">
          <Link
            href="/conta"
            className="flex items-center gap-2 rounded-lg border border-border/60 bg-card p-2 text-sm transition-colors hover:bg-accent/30"
          >
            <Avatar className="size-9">
              <AvatarImage src={avatarUrl ?? undefined} alt={fullName} />
              <AvatarFallback className="bg-primary/10 font-display font-bold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-bold leading-tight">
                {fullName.split(" ")[0]}
              </p>
              <p className="truncate text-[10px] text-muted-foreground">
                @{username}
              </p>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                aria-label="Sair"
                className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="size-4" aria-hidden />
              </button>
            </form>
          </Link>
        </div>
      </div>
    </aside>
  );
}
