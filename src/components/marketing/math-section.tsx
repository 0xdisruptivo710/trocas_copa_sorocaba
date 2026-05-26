import { TrendingDown, Coins } from "lucide-react";

/**
 * Seção "A matemática" — argumento de conversão forte:
 * IMPA calculou que fechar álbum Panini sem trocas custa ~R$7k em
 * pacotes. Com trocas presenciais bem-organizadas, cai ~80%.
 *
 * Fonte: Milton Jara, matemático do IMPA, calculou que pra um álbum de
 * 980 figurinhas são necessárias em média ~7.300 figurinhas considerando
 * repetições. Referenciado em Estadão, CBN, IMPA.
 */
export function MathSection() {
  return (
    <section className="relative overflow-hidden bg-muted/30 py-20">
      <div
        className="bg-stripes absolute inset-0 opacity-30"
        aria-hidden
      />
      <div className="relative mx-auto max-w-5xl px-4">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-display text-xs font-semibold uppercase tracking-wider text-primary">
            A conta do álbum
          </p>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            A matemática não mente
          </h2>
          <p className="mt-3 text-muted-foreground">
            Cálculo do matemático <strong className="text-foreground">Milton Jara</strong> do{" "}
            <strong className="text-foreground">IMPA</strong>: completar o álbum
            <strong className="text-foreground"> só comprando pacotes</strong> pode
            custar mais de <strong className="text-foreground">R$ 7 mil</strong>.
            Com trocas presenciais bem feitas, esse gasto cai em até{" "}
            <strong className="text-foreground">80%</strong>.
          </p>
        </div>

        {/* Comparison cards */}
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {/* Sem trocas */}
          <div className="relative overflow-hidden rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
            <div className="absolute right-4 top-4 rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-display font-bold text-destructive">
              SEM APP
            </div>
            <Coins className="size-8 text-destructive" aria-hidden />
            <p className="mt-4 font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Comprando só pacotes
            </p>
            <p className="mt-1 font-display text-5xl font-extrabold leading-none tabular-nums text-destructive">
              R$ 7.000
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Média estimada pra fechar o álbum considerando repetições aleatórias.
              Mais raro que ganhar na Mega Sena sem pegar repetida.
            </p>
          </div>

          {/* Com Trocas Copa */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-primary bg-gradient-to-br from-primary/10 via-card to-accent/10 p-6 shadow-xl shadow-primary/20">
            <div className="absolute right-4 top-4 rounded-full bg-primary px-2 py-0.5 text-xs font-display font-bold text-primary-foreground">
              COM TROCAS COPA SOROCABA
            </div>
            <TrendingDown className="size-8 text-primary" aria-hidden />
            <p className="mt-4 font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Com trocas presenciais
            </p>
            <p className="mt-1 font-display text-5xl font-extrabold leading-none tabular-nums">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                R$ 1.500
              </span>
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Estimativa média com trocas otimizadas pelo app. Você compra menos
              pacotes e troca o que sobra com vizinhos.
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-display font-bold text-primary">
              <TrendingDown className="size-3" aria-hidden /> Até 80% de economia
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Fonte: Milton Jara, matemático do IMPA · cobertura Estadão, CBN, IMPA
          (2026). Valores médios — varia conforme rede de trocas.
        </p>
      </div>
    </section>
  );
}
