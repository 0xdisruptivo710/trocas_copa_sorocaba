import Link from "next/link";
import { ChevronLeft, ShieldOff } from "lucide-react";
import { listMyBlocks } from "@/lib/moderation/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { UnblockButton } from "@/components/perfil/unblock-button";

export const metadata = {
  title: "Privacidade · Trocas Copa Sorocaba",
};

export default async function PrivacidadePage() {
  const blocks = await listMyBlocks();

  return (
    <main className="space-y-6 px-6 py-6 md:px-10 md:py-10">
      <Link
        href="/conta"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Voltar pra Conta
      </Link>

      <header>
        <p className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Conta &middot; Privacidade
        </p>
        <h1 className="font-display text-4xl font-extrabold uppercase leading-none tracking-tight md:text-6xl">
          Bloqueados
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Pessoas que você bloqueou não aparecem no Mapa de Trocas, não conseguem
          abrir chat com você e nem te enviar mensagens. Você pode desbloquear a
          qualquer momento.
        </p>
      </header>

      {blocks.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <ShieldOff className="size-10 text-muted-foreground" aria-hidden />
          <p className="font-display text-base font-bold">Lista vazia</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Você ainda não bloqueou ninguém. Para bloquear alguém, abra o perfil
            ou chat e use o menu &ldquo;···&rdquo; no topo.
          </p>
        </Card>
      ) : (
        <ul className="space-y-2">
          {blocks.map((b) => {
            const initials = b.full_name
              .split(" ")
              .map((s) => s[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            return (
              <li key={b.blocked_id}>
                <Card className="flex items-center gap-3 p-3">
                  <Avatar className="size-10">
                    <AvatarImage src={b.avatar_url ?? undefined} alt={b.full_name} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{b.full_name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      @{b.username}
                      {b.city && (
                        <>
                          {" · "}
                          {b.city}, {b.state}
                        </>
                      )}
                    </p>
                  </div>
                  <UnblockButton otherUserId={b.blocked_id} otherName={b.username} />
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
