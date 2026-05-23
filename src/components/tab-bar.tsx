"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, BookOpen, MessageCircle, User } from "lucide-react";

const tabs = [
  { href: "/home", label: "Início", icon: Home },
  { href: "/explorar", label: "Explorar", icon: Search },
  { href: "/album", label: "Álbum", icon: BookOpen },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/conta", label: "Conta", icon: User },
] as const;

export function TabBar() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-background/95 shadow-[0_-4px_12px_-4px_oklch(0.18_0.04_280/0.1)] backdrop-blur">
      <ul className="mx-auto flex max-w-md items-stretch justify-between">
        {tabs.map((t) => {
          const active = t.href === "/home" ? path === "/home" : path.startsWith(t.href);
          const Icon = t.icon;
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                className={`relative flex flex-col items-center gap-0.5 py-2 text-[10px] font-display font-semibold transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {/* Top indicator bar */}
                {active && (
                  <span className="absolute inset-x-3 top-0 h-[3px] rounded-full bg-primary" />
                )}
                {/* Highlight pill behind icon */}
                <span
                  className={`flex size-9 items-center justify-center rounded-full transition-all ${
                    active ? "bg-primary/12" : ""
                  }`}
                >
                  <Icon
                    className={`size-5 transition-transform ${
                      active ? "scale-110" : ""
                    }`}
                    aria-hidden
                  />
                </span>
                <span>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
