import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPanorama } from "@/lib/album/data";
import { BookOpen, Search, MessageCircle, ArrowRight, MapPin } from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("trocas_profiles")
    .select("full_name, username, city, state")
    .eq("id", user!.id)
    .single();

  const panorama = await getPanorama(user!.id);
  const firstName = profile?.full_name?.split(" ")[0] ?? profile?.username ?? "Você";

  return (
    <main className="space-y-8 px-6 py-6 md:px-10 md:py-10">
      {/* Top actions (desktop) */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <header>
          <p className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Olá,
          </p>
          <h1 className="font-display text-4xl font-extrabold leading-none tracking-tight md:text-5xl">
            {firstName}
          </h1>
          {profile?.city && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3" aria-hidden />
              {profile.city}, {profile.state}
            </p>
          )}
        </header>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/album"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-foreground px-4 font-display text-sm font-bold text-background shadow-sm transition-all hover:brightness-105"
          >
            <BookOpen className="size-4" aria-hidden />
            Abrir álbum
          </Link>
          <Link
            href="/explorar"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-card px-4 font-display text-sm font-bold transition-colors hover:bg-accent/30"
          >
            <MapPin className="size-4" aria-hidden />
            Explorar
          </Link>
        </div>
      </div>

      {/* O PLACAR DO SEU ÁLBUM */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <p className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Sua coleção
            </p>
            <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight md:text-3xl">
              O placar do seu álbum
            </h2>
          </div>
          <span className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Atualizado agora
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <ScoreCard
            label="Tenho"
            subLabel="no álbum"
            value={panorama.owned}
            color="primary"
          />
          <ScoreCard
            label="Faltam"
            subLabel="figurinhas pra colar"
            value={panorama.missing}
            color="dark"
          />
          <ScoreCard
            label="Repetidas"
            subLabel="prontas pra troca"
            value={panorama.duplicates}
            color="accent"
          />
        </div>

        {/* Progress overall */}
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <div className="mb-2 flex items-baseline justify-between text-xs">
            <span className="font-display font-bold text-muted-foreground">
              {panorama.owned} de {panorama.total} coladas
            </span>
            <span className="font-display text-base font-extrabold tabular-nums text-primary">
              {panorama.percent}%
            </span>
          </div>
          <div className="relative h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-accent transition-all duration-500"
              style={{ width: `${panorama.percent}%` }}
            />
            {[25, 50, 75].map((tick) => (
              <span
                key={tick}
                className="absolute top-0 h-full w-px bg-background/60"
                style={{ left: `${tick}%` }}
                aria-hidden
              />
            ))}
          </div>
        </div>
      </section>

      {/* PRÓXIMA JOGADA */}
      <section className="space-y-4">
        <div>
          <p className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Próxima jogada
          </p>
          <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight md:text-3xl">
            O que você quer fazer?
          </h2>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <ActionCard
            n="01"
            icon={BookOpen}
            title="Álbum"
            body="Marque o que tem, falta e o que sobra. A coleção começa aqui."
            href="/album"
          />
          <ActionCard
            n="02"
            icon={Search}
            title="Explorar"
            body="Veja quem tá perto de você com as repetidas que faltam pra fechar."
            href="/explorar"
          />
          <ActionCard
            n="03"
            icon={MessageCircle}
            title="Chat"
            body="Combine no chat, marque ponto de encontro, troque pessoalmente."
            href="/chat"
          />
        </div>
      </section>
    </main>
  );
}

function ScoreCard({
  label,
  subLabel,
  value,
  color,
}: {
  label: string;
  subLabel: string;
  value: number;
  color: "primary" | "dark" | "accent";
}) {
  const style = {
    primary: {
      bg: "bg-gradient-to-br from-primary to-primary/80",
      fg: "text-primary-foreground",
      sublabel: "text-primary-foreground/80",
    },
    dark: {
      bg: "bg-gradient-to-br from-[oklch(0.18_0.04_280)] to-[oklch(0.24_0.05_245)]",
      fg: "text-white",
      sublabel: "text-white/70",
    },
    accent: {
      bg: "bg-gradient-to-br from-accent to-accent/80",
      fg: "text-[oklch(0.20_0.03_280)]",
      sublabel: "text-[oklch(0.30_0.03_280)]",
    },
  }[color];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${style.bg} ${style.fg} p-5 shadow-[var(--shadow-cromo)]`}
    >
      <div className="flex items-baseline justify-between">
        <p className="font-display text-xs font-bold uppercase tracking-wider">{label}</p>
        <p className={`text-[10px] font-display font-semibold ${style.sublabel}`}>
          {String(value).padStart(3, "0")}
        </p>
      </div>
      <p className="mt-2 font-display text-6xl font-extrabold leading-none tabular-nums md:text-7xl">
        {value}
      </p>
      <p className={`mt-2 text-xs ${style.sublabel}`}>{subLabel}</p>
    </div>
  );
}

function ActionCard({
  n,
  icon: Icon,
  title,
  body,
  href,
}: {
  n: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  body: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-[var(--shadow-cromo)] transition-all hover:-translate-y-1 hover:border-primary/40"
    >
      <div className="pointer-events-none absolute -right-2 -top-3 select-none font-display text-6xl font-extrabold leading-none text-primary/5">
        {n}
      </div>
      <div className="relative flex items-center justify-between">
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-display text-[10px] font-bold text-primary">
          Nº {n}
        </span>
        <Icon className="size-5 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden />
      </div>
      <div className="relative">
        <h3 className="font-display text-2xl font-extrabold">{title}</h3>
        <div className="mt-1 h-1 w-10 rounded-full bg-gradient-to-r from-primary to-accent" />
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
      </div>
      <div className="relative mt-auto inline-flex items-center gap-1 font-display text-xs font-bold text-primary">
        Abrir
        <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" aria-hidden />
      </div>
    </Link>
  );
}
