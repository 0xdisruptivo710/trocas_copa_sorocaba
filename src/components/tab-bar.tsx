"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, BookOpen, MessageCircle, User } from "lucide-react";

const tabs = [
  { href: "/", label: "Início", icon: Home },
  { href: "/explorar", label: "Explorar", icon: Search },
  { href: "/album", label: "Álbum", icon: BookOpen },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/conta", label: "Conta", icon: User },
] as const;

export function TabBar() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur">
      <ul className="mx-auto flex max-w-md items-stretch justify-between">
        {tabs.map((t) => {
          const active = t.href === "/" ? path === "/" : path.startsWith(t.href);
          const Icon = t.icon;
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                className={`flex flex-col items-center gap-1 py-2 text-xs ${
                  active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                <Icon className="size-5" aria-hidden />
                <span>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
