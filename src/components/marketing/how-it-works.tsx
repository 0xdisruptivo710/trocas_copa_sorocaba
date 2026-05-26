import { BookOpen, Users, MessageCircle, Clock } from "lucide-react";

const STEPS = [
  {
    n: "01",
    icon: BookOpen,
    title: "Marque",
    body: "Crie sua conta e marca o que você já tem, o que falta e o que sobra repetida no álbum. São 994 cromos da Panini Copa 2026.",
  },
  {
    n: "02",
    icon: Users,
    title: "Descubra",
    body: "A gente cruza sua coleção com a de outros colecionadores de Sorocaba e região (até 50km) — ordenados por melhor match.",
  },
  {
    n: "03",
    icon: MessageCircle,
    title: "Troca",
    body: "Manda oferta, combina ponto de encontro no chat (sem expor telefone), troca pessoalmente. Álbuns dos dois atualizam automaticamente.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="font-display text-xs font-semibold uppercase tracking-wider text-primary">
              Como funciona
            </p>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Três jogadas pra colar a Copa
            </h2>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-display font-bold text-muted-foreground">
            <Clock className="size-3.5 text-primary" aria-hidden />
            30 segundos pra começar
          </div>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.n}
                className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-[var(--shadow-cromo)] transition-all hover:-translate-y-1 hover:border-primary/40"
              >
                {/* Big number bg decorativo */}
                <div className="pointer-events-none absolute -right-2 -top-4 select-none font-display text-7xl font-extrabold leading-none text-primary/5">
                  {s.n}
                </div>

                <div className="relative">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-display text-[10px] font-bold text-primary">
                      Nº {s.n}
                    </span>
                    <Icon
                      className="size-5 text-muted-foreground transition-colors group-hover:text-primary"
                      aria-hidden
                    />
                  </div>
                  <h3 className="mt-4 font-display text-2xl font-extrabold">{s.title}</h3>
                  <div className="mt-2 h-1 w-12 rounded-full bg-gradient-to-r from-primary to-accent" />
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {s.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
