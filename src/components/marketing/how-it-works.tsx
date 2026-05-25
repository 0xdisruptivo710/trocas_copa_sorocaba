import { BookOpen, Users, MessageCircle } from "lucide-react";

const STEPS = [
  {
    n: "1",
    icon: BookOpen,
    title: "Cadastra seu álbum",
    body: "Marca cada figurinha como Tenho, Repetida ou Falta. São 994 cromos da Panini Copa 2026.",
  },
  {
    n: "2",
    icon: Users,
    title: "Encontra quem tá perto",
    body: "A gente cruza sua coleção com colecionadores da região (Sorocaba e cidades vizinhas, até 50km) e ordena por melhor match.",
  },
  {
    n: "3",
    icon: MessageCircle,
    title: "Fecha a troca no chat",
    body: "Conversa direto, propõe formal, marca como entregue. Álbuns dos dois atualizam automaticamente.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-muted/30 py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Como funciona
          </h2>
          <p className="mt-3 text-muted-foreground">
            Três passos do cadastro à primeira troca.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.n}
                className="group relative rounded-2xl border border-border/60 bg-card p-6 shadow-[var(--shadow-cromo)] transition-all hover:-translate-y-1 hover:border-primary/40"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent/80 font-display text-lg font-extrabold text-primary-foreground shadow-sm shadow-primary/30">
                    {s.n}
                  </div>
                  <Icon className="size-5 text-muted-foreground transition-colors group-hover:text-primary" />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
