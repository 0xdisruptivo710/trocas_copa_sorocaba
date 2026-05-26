const FAQS = [
  {
    n: "01",
    q: "O Trocas Copa Sorocaba é grátis?",
    a: "Sim. Marcar seu álbum, ver matches por proximidade e abrir conversas — tudo grátis. Tem um Premium opcional (R$ 24,90 pagamento único via PIX) que destrava cards visuais de cromos no chat e propostas de troca estruturadas. Sem assinatura, sem cobrança mensal.",
  },
  {
    n: "02",
    q: "Como o matching de trocas funciona?",
    a: "O app cruza automaticamente os cromos que você tem repetidos com os que outros colecionadores precisam, e vice-versa. Quem mora mais perto e tem mais cromos cruzando aparece primeiro no Explorar. Você decide se quer abrir conversa.",
  },
  {
    n: "03",
    q: "Em quais cidades funciona?",
    a: "Foco regional na Sorocaba e cidades vizinhas: Votorantim, Araçoiaba da Serra, Piedade, Itapetininga, Salto de Pirapora, Iperó, Tatuí, Boituva, Porto Feliz, São Roque, Mairinque, Ibiúna, Salto, Itu e mais. Se você é da região, dá pra usar.",
  },
  {
    n: "04",
    q: "Preciso compartilhar minha localização exata?",
    a: "Sua coordenada GPS fica server-side e nunca aparece pra outros usuários. Quem te encontra no Explorar só vê a distância arredondada (ex: '14 km') e o nome da sua cidade. Se preferir, pode escolher a cidade manualmente em vez de usar GPS.",
  },
  {
    n: "05",
    q: "Como combino a troca presencial?",
    a: "Dentro do chat do app. Conversam, marcam ponto de encontro (shopping, parque, estação) e horário — sem precisar trocar telefone. Depois da entrega, vocês confirmam dos dois lados e os álbuns atualizam automaticamente.",
  },
  {
    n: "06",
    q: "Vocês têm relação com Panini ou FIFA?",
    a: "Não. Trocas Copa Sorocaba é um projeto independente feito por torcedores da região, sem qualquer afiliação, patrocínio ou endosso da Panini, da FIFA ou de detentoras de direitos. Marcas e nomes mencionados pertencem aos seus donos.",
  },
];

export function FAQ() {
  return (
    <section className="bg-muted/30 py-20">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-display text-xs font-semibold uppercase tracking-wider text-primary">
            Perguntas frequentes
          </p>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Dúvidas? Aqui resolve.
          </h2>
        </div>

        <div className="mt-12 space-y-3">
          {FAQS.map((f) => (
            <details
              key={f.n}
              className="group rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all open:border-primary/40 open:shadow-md"
            >
              <summary className="flex cursor-pointer items-start gap-4 list-none">
                <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 font-display text-xs font-bold text-primary">
                  {f.n}
                </span>
                <h3 className="flex-1 font-display text-base font-bold leading-snug">
                  {f.q}
                </h3>
                <span
                  aria-hidden
                  className="shrink-0 font-display text-2xl font-extrabold text-muted-foreground transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 pl-12 text-sm leading-relaxed text-muted-foreground">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
