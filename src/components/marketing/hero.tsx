import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Stadium stripes animated background */}
      <div
        className="bg-stripes animate-stripes absolute inset-0 opacity-60"
        aria-hidden
      />
      {/* Gradient haze top */}
      <div
        className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-primary/10 to-transparent"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24 lg:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-6">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-display font-semibold text-primary">
              <span className="size-1.5 animate-pulse-soft rounded-full bg-primary" />
              COPA DO MUNDO 2026 — EUA · CAN · MEX
            </div>

            {/* Headline */}
            <h1 className="font-display text-4xl font-extrabold leading-[0.95] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Complete o álbum.
              <br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Troque com quem tá perto.
              </span>
              <br />
              Viva a Copa.
            </h1>

            <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
              Esqueça as repetidas paradas na gaveta. O TrocasCopa cruza seu álbum
              com o de colecionadores do seu bairro e fecha a troca direto no chat.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/cadastro"
                className="inline-flex h-11 items-center gap-2 rounded-md bg-gradient-to-r from-primary via-primary to-accent/80 px-5 font-display text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/40 hover:brightness-105"
              >
                Criar conta grátis
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-11 items-center px-5 font-display text-base font-semibold text-foreground hover:text-primary"
              >
                Já tenho conta
              </Link>
            </div>

            {/* Trust dots */}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-primary" />
                994 figurinhas oficiais
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-accent" />
                Matching por GPS
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-destructive" />
                Chat sem expor telefone
              </span>
            </div>
          </div>

          {/* Hero visual: stack de 3 cromos */}
          <div className="relative mx-auto hidden h-80 w-72 lg:block">
            <FloatingCard
              teamCode="BRA"
              number="10"
              bg="oklch(0.62 0.17 148)"
              fg="oklch(0.86 0.17 92)"
              style={{ top: 24, right: 24, transform: "rotate(-8deg)" }}
            />
            <FloatingCard
              teamCode="USA"
              number="07"
              bg="oklch(0.58 0.22 25)"
              fg="oklch(1 0 0)"
              style={{ top: 64, left: 24, transform: "rotate(6deg)" }}
            />
            <FloatingCard
              teamCode="MEX"
              number="11"
              bg="oklch(0.86 0.17 92)"
              fg="oklch(0.20 0.03 280)"
              style={{ bottom: 24, right: 48, transform: "rotate(-3deg)" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function FloatingCard({
  teamCode,
  number,
  bg,
  fg,
  style,
}: {
  teamCode: string;
  number: string;
  bg: string;
  fg: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="absolute flex h-48 w-32 flex-col items-center justify-center rounded-xl shadow-[var(--shadow-cromo)]"
      style={{ background: bg, color: fg, ...style }}
    >
      <span className="font-display text-xs font-bold uppercase tracking-wider opacity-90">
        {teamCode}
      </span>
      <span className="font-display text-5xl font-extrabold leading-none drop-shadow">
        {number}
      </span>
      <span className="mt-3 rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
        Copa 2026
      </span>
    </div>
  );
}
