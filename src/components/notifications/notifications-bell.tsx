"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, MessageCircle, Handshake, CheckCheck } from "lucide-react";
import { Popover } from "@base-ui/react/popover";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/actions/notifications";
import type { NotificationItem } from "@/lib/notifications/data";

interface Props {
  userId: string;
  initialUnreadCount: number;
  initialItems: NotificationItem[];
  /**
   * Apresentação. "sidebar" usa cores neutras para casar com a coluna lateral;
   * "floating" usa fundo opaco com sombra (mobile flutuante).
   */
  variant?: "sidebar" | "floating";
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function NotifIcon({ kind }: { kind: NotificationItem["kind"] }) {
  if (kind === "proposal_new" || kind === "proposal_reply") {
    return <Handshake className="size-3.5" aria-hidden />;
  }
  if (kind === "trade_completed") {
    return <CheckCheck className="size-3.5" aria-hidden />;
  }
  return <MessageCircle className="size-3.5" aria-hidden />;
}

function notifLabel(n: NotificationItem) {
  const name = n.actor_full_name ?? "Alguém";
  if (n.kind === "proposal_new") return `${name} enviou uma proposta de troca`;
  if (n.kind === "proposal_reply") return `${name} respondeu sua proposta`;
  if (n.kind === "trade_completed") return `Troca confirmada com ${name}`;
  return `Nova mensagem de ${name}`;
}

function notifHref(n: NotificationItem): string {
  return n.chat_id ? `/chat/${n.chat_id}` : "/chat";
}

export function NotificationsBell({
  userId,
  initialUnreadCount,
  initialItems,
  variant = "sidebar",
}: Props) {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>(initialItems);
  const [unread, setUnread] = useState(initialUnreadCount);
  const [, startTransition] = useTransition();
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabaseRef.current = supabase;
    // Channel name precisa ser único por instância: o layout (app) monta dois
    // NotificationsBell em paralelo (sidebar desktop + flutuante mobile).
    // Sem o sufixo de variant, ambos tentam reusar o mesmo channel — o
    // segundo a chamar .on() depois do .subscribe() do primeiro joga
    // "cannot add postgres_changes callbacks after subscribe()" e loopa.
    const channel = supabase
      .channel(`notif:${userId}:${variant}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "trocas_notifications",
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          const raw = payload.new as {
            id: string;
            kind: NotificationItem["kind"];
            chat_id: string | null;
            actor_id: string | null;
            payload: NotificationItem["payload"];
            read_at: string | null;
            created_at: string;
          };

          // Busca o ator pra exibir nome/avatar (Realtime não traz join).
          let actor: {
            username: string | null;
            full_name: string | null;
            avatar_url: string | null;
          } = { username: null, full_name: null, avatar_url: null };
          if (raw.actor_id) {
            const { data } = await supabase
              .from("trocas_public_profiles")
              .select("username, full_name, avatar_url")
              .eq("id", raw.actor_id)
              .maybeSingle();
            if (data) actor = data;
          }

          const item: NotificationItem = {
            ...raw,
            actor_username: actor.username,
            actor_full_name: actor.full_name,
            actor_avatar_url: actor.avatar_url,
          };

          setItems((prev) => {
            if (prev.some((p) => p.id === item.id)) return prev;
            return [item, ...prev].slice(0, 20);
          });
          if (item.read_at === null) setUnread((u) => u + 1);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "trocas_notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const upd = payload.new as { id: string; read_at: string | null };
          // Atualiza items e deriva unread do próprio next state — evita stale
          // closure sobre `items` (que estourava o useEffect deps).
          setItems((prev) => {
            const next = prev.map((p) =>
              p.id === upd.id ? { ...p, read_at: upd.read_at } : p,
            );
            setUnread(next.filter((i) => i.read_at === null).length);
            return next;
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, variant]);

  function handleClickItem(item: NotificationItem) {
    if (item.read_at === null) {
      // Marca imediatamente no UI e via server action.
      setItems((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, read_at: new Date().toISOString() } : p)),
      );
      setUnread((u) => Math.max(0, u - 1));
      startTransition(() => {
        markNotificationReadAction(item.id);
      });
    }
    router.push(notifHref(item));
  }

  function handleMarkAll() {
    setItems((prev) => prev.map((p) => ({ ...p, read_at: p.read_at ?? new Date().toISOString() })));
    setUnread(0);
    startTransition(() => {
      markAllNotificationsReadAction();
    });
  }

  const triggerBaseStyle =
    variant === "floating"
      ? "relative inline-flex size-10 items-center justify-center rounded-full bg-card shadow-lg ring-1 ring-border/60 hover:bg-muted"
      : "relative inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent/30 hover:text-foreground";

  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label={unread > 0 ? `${unread} notificações não lidas` : "Notificações"}
        className={triggerBaseStyle}
      >
        <Bell className="size-5" aria-hidden />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 font-display text-[10px] font-bold leading-none text-primary-foreground ring-2 ring-background tabular-nums">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          side="bottom"
          align="end"
          sideOffset={8}
          className="z-50 outline-none"
        >
          <Popover.Popup className="z-50 w-[min(calc(100vw-2rem),22rem)] origin-(--transform-origin) rounded-2xl border bg-popover p-0 shadow-2xl ring-1 ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <p className="font-display text-sm font-bold uppercase tracking-wide">
                Notificações
              </p>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAll}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Marcar tudo como lido
                </button>
              )}
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {items.length === 0 ? (
                <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                  Sem notificações ainda. Quando alguém te chamar pra trocar,
                  aparece aqui.
                </div>
              ) : (
                <ul className="divide-y">
                  {items.map((n) => {
                    const initials = (n.actor_full_name ?? "?")
                      .split(" ")
                      .map((s) => s[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();
                    return (
                      <li key={n.id}>
                        <button
                          type="button"
                          onClick={() => handleClickItem(n)}
                          className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/30 ${
                            n.read_at === null ? "bg-primary/5" : ""
                          }`}
                        >
                          <div className="relative shrink-0">
                            <Avatar className="size-9">
                              <AvatarImage
                                src={n.actor_avatar_url ?? undefined}
                                alt={n.actor_full_name ?? ""}
                              />
                              <AvatarFallback className="bg-primary/10 font-display text-xs font-bold text-primary">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="absolute -bottom-1 -right-1 inline-flex size-5 items-center justify-center rounded-full bg-background text-primary ring-2 ring-background">
                              <NotifIcon kind={n.kind} />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm">
                              <span className="font-medium">{notifLabel(n)}</span>
                            </p>
                            {n.payload.preview && (
                              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                &ldquo;{n.payload.preview}&rdquo;
                              </p>
                            )}
                            <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                              {timeAgo(n.created_at)}
                            </p>
                          </div>
                          {n.read_at === null && (
                            <span
                              aria-hidden
                              className="mt-1 size-2 shrink-0 rounded-full bg-primary"
                            />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="border-t px-4 py-2 text-center">
              <Link
                href="/chat"
                className="text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Ver todas as conversas &rarr;
              </Link>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
