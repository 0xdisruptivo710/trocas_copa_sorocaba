import { MapPin, Sparkles, Lock, Trophy } from "lucide-react";

const FEATURES = [
  {
    icon: MapPin,
    title: "Matches na sua região",
    body: "Raio de 3 a 50km — cobre Sorocaba, Votorantim, Araçoiaba, Piedade, Itapetininga e cidades vizinhas. Troca presencial sem frete.",
  },
  {
    icon: Sparkles,
    title: "Álbum digital completo",
    body: "Todas as 994 figurinhas: 48 seleções × 20 + FWC + Coca-Cola. Filtros por status, busca, panorama em tempo real.",
  },
  {
    icon: Lock,
    title: "Chat sem expor número",
    body: "Conversa rola dentro do app. Você só passa telefone quando combinar o encontro — se quiser.",
  },
  {
    icon: Trophy,
    title: "Reputação de troca",
    body: "Cada troca confirmada gera avaliação 👍/👎. Veja quem é parceiro confiável antes de fechar.",
  },
];

export function Features() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-display text-xs font-semibold uppercase tracking-wider text-primary">
            Feito pra Sorocaba
          </p>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Por que usar o Trocas Copa Sorocaba
          </h2>
          <p className="mt-3 text-muted-foreground">
            Sem grupo de WhatsApp gigante, sem combinar troca por DM, sem trocar
            telefone com estranho.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group relative flex gap-4 rounded-2xl border border-border/60 bg-card p-6 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="shrink-0">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-accent/15">
                    <Icon className="size-6 text-primary" aria-hidden />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-[10px] font-bold tabular-nums text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="font-display text-lg font-bold">{f.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{f.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
