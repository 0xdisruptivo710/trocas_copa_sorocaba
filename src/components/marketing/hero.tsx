import Link from "next/link";
import { ArrowRight, MapPin, Check } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Stadium stripes animated background */}
      <div
        className="bg-stripes animate-stripes absolute inset-0 opacity-50"
        aria-hidden
      />
      {/* Gradient haze top */}
      <div
        className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-primary/15 to-transparent"
        aria-hidden
      />
      {/* Yellow corner accent */}
      <div
        className="absolute -right-32 -top-32 size-96 rounded-full bg-accent/20 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 py-14 sm:py-20 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div className="space-y-6">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-display font-semibold text-primary">
              <span className="size-1.5 animate-pulse-soft rounded-full bg-primary" />
              <MapPin className="size-3" aria-hidden />
              SOROCABA & REGIÃO · CADASTROS ABERTOS
            </div>

            {/* Headline */}
            <h1 className="font-display text-4xl font-extrabold leading-[0.95] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Cole a Copa.
              <br />
              <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                Troque na quadra.
              </span>
            </h1>

            <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
              Marque as figurinhas que você já tem, registre as repetidas e
              descubra colecionadores aqui de <strong className="text-foreground">Sorocaba, Votorantim, Araçoiaba, Piedade, Itapetininga</strong> e
              região. Comunidade real, troca presencial — sem taxas, sem golpe.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/cadastro"
                className="inline-flex h-12 items-center gap-2 rounded-md bg-gradient-to-r from-primary via-primary to-accent/80 px-6 font-display text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/40 hover:brightness-105"
              >
                Criar conta grátis
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center px-5 font-display text-base font-semibold text-foreground hover:text-primary"
              >
                Já tenho conta
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Check className="size-3.5 text-primary" aria-hidden />
                Grátis · sem cartão
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="size-3.5 text-primary" aria-hidden />
                Comunidade local
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="size-3.5 text-primary" aria-hidden />
                Troca presencial
              </span>
            </div>
          </div>

          {/* Mockup do álbum + cromo flutuante */}
          <AlbumMockup />
        </div>
      </div>
    </section>
  );
}

/**
 * Mockup visual: página de álbum com 12 slots (grid 4×3), alguns "colados"
 * (cor da seleção) e outros vazios (★). Header com nº de página e contador.
 * Cromo flutuante sobreposto pra dar profundidade.
 */
function AlbumMockup() {
  const slots: Array<
    | { type: "pasted"; bg: string; fg: string; num: string }
    | { type: "empty" }
  > = [
    { type: "pasted", bg: "oklch(0.62 0.17 148)", fg: "oklch(0.86 0.17 92)", num: "01" },
    { type: "empty" },
    { type: "pasted", bg: "oklch(0.58 0.22 25)", fg: "#fff", num: "03" },
    { type: "pasted", bg: "oklch(0.86 0.17 92)", fg: "oklch(0.20 0.03 280)", num: "04" },
    { type: "empty" },
    { type: "pasted", bg: "oklch(0.52 0.19 245)", fg: "#fff", num: "06" },
    { type: "pasted", bg: "oklch(0.62 0.17 148)", fg: "oklch(0.86 0.17 92)", num: "07" },
    { type: "pasted", bg: "oklch(0.18 0.04 280)", fg: "#facc15", num: "08" },
    { type: "empty" },
    { type: "pasted", bg: "oklch(0.58 0.22 25)", fg: "#fff", num: "10" },
    { type: "empty" },
    { type: "pasted", bg: "oklch(0.86 0.17 92)", fg: "oklch(0.20 0.03 280)", num: "12" },
  ];

  return (
    <div className="relative mx-auto max-w-sm">
      {/* Página principal do álbum */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-2xl shadow-primary/10">
        {/* Header */}
        <div className="mb-3 flex items-baseline justify-between border-b border-border pb-2">
          <span className="font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Sua Página
          </span>
          <span className="font-display text-xs font-bold tabular-nums">
            Página 07 / 17
          </span>
        </div>
        {/* Grid de cromos */}
        <div className="grid grid-cols-4 gap-1.5">
          {slots.map((s, i) =>
            s.type === "pasted" ? (
              <div
                key={i}
                className="flex aspect-[3/4] flex-col items-center justify-center rounded-md"
                style={{ background: s.bg, color: s.fg }}
              >
                <span className="font-display text-lg font-extrabold leading-none">
                  {s.num}
                </span>
              </div>
            ) : (
              <div
                key={i}
                className="flex aspect-[3/4] items-center justify-center rounded-md border border-dashed border-border bg-muted/30"
              >
                <span className="text-lg text-muted-foreground/50">★</span>
              </div>
            ),
          )}
        </div>
        {/* Footer com progresso */}
        <div className="mt-3 border-t border-border pt-3">
          <div className="mb-1.5 flex items-baseline justify-between text-[11px]">
            <span className="font-display font-semibold text-muted-foreground">
              Álbum Copa 2026 · 994 figurinhas
            </span>
            <span className="font-display font-bold text-primary tabular-nums">
              73%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
              style={{ width: "73%" }}
            />
          </div>
        </div>
      </div>

      {/* Cromo flutuante BRA */}
      <div
        className="absolute -right-4 -top-6 hidden h-32 w-24 rotate-6 flex-col items-center justify-center rounded-xl shadow-2xl sm:flex"
        style={{
          background: "oklch(0.62 0.17 148)",
          color: "oklch(0.86 0.17 92)",
        }}
      >
        <span className="font-display text-[9px] font-bold uppercase tracking-wider opacity-90">
          BRA
        </span>
        <span className="font-display text-4xl font-extrabold leading-none drop-shadow">
          10
        </span>
        <span className="mt-2 rounded-full bg-black/20 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider">
          NOVA
        </span>
      </div>

      {/* Cromo flutuante MEX */}
      <div
        className="absolute -bottom-4 -left-4 hidden h-28 w-20 -rotate-6 flex-col items-center justify-center rounded-xl shadow-2xl sm:flex"
        style={{
          background: "oklch(0.86 0.17 92)",
          color: "oklch(0.20 0.03 280)",
        }}
      >
        <span className="font-display text-[9px] font-bold uppercase tracking-wider opacity-90">
          MEX
        </span>
        <span className="font-display text-3xl font-extrabold leading-none">
          11
        </span>
      </div>
    </div>
  );
}
