import { Mail, MapPin, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function SobrePage() {
  return (
    <main className="space-y-8 px-6 py-6 md:px-10 md:py-10">
      <header>
        <p className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Quem somos
        </p>
        <h1 className="font-display text-4xl font-extrabold uppercase leading-none tracking-tight md:text-6xl">
          Sobre o app
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Trocas Copa Sorocaba é um projeto independente feito por torcedores
          da região, sem fins lucrativos.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-3 p-6">
          <h2 className="font-display text-lg font-extrabold uppercase tracking-wide">
            O que é
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Trocas Copa Sorocaba é uma ferramenta gratuita pra colecionadores
            brasileiros marcarem figurinhas repetidas e que faltam do álbum
            Panini Copa 2026, e encontrarem outros colecionadores próximos pra
            combinar trocas presenciais.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            <strong className="text-foreground">Não vendemos figurinhas</strong>,
            não processamos pagamentos pelas trocas e não cobramos taxa pelas
            trocas.
          </p>
        </Card>

        <Card className="space-y-3 p-6">
          <h2 className="font-display text-lg font-extrabold uppercase tracking-wide">
            Quem mantém
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Projeto independente mantido por torcedores da região metropolitana
            de Sorocaba. Não é uma empresa registrada — é um projeto pessoal,
            sem fins lucrativos, feito por fãs do álbum.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Foco regional: <strong className="text-foreground">Sorocaba,
              Votorantim, Araçoiaba da Serra, Piedade, Itapetininga, Tatuí,
              Boituva</strong> e cidades vizinhas.
          </p>
        </Card>
      </div>

      <Card className="space-y-4 border-amber-500/40 bg-amber-500/5 p-6">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-5 text-amber-600" aria-hidden />
          <h2 className="font-display text-lg font-extrabold uppercase tracking-wide">
            Sem afiliação
          </h2>
        </div>
        <p className="text-sm leading-relaxed">
          O Trocas Copa Sorocaba <strong>não tem qualquer afiliação,
            patrocínio, licença ou endosso da FIFA, da Panini, da CBF</strong>{" "}
          ou de qualquer outra detentora de direitos sobre o álbum oficial da
          Copa do Mundo. Marcas, nomes e termos citados pertencem a seus
          respectivos donos e são usados apenas para descrever, de forma
          nominativa, o que os usuários colecionam fora da plataforma.
        </p>
        <p className="text-sm leading-relaxed">
          Se você é detentor de direitos e identificou algum uso indevido,
          entre em contato pelo email abaixo que ajustamos.
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-3 p-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-primary" aria-hidden />
            <h2 className="font-display text-lg font-extrabold uppercase tracking-wide">
              O que o serviço faz
            </h2>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-primary">▸</span> Marca quais figurinhas
              você tem e quais faltam
            </li>
            <li className="flex gap-2">
              <span className="text-primary">▸</span> Registra suas repetidas
              pra troca
            </li>
            <li className="flex gap-2">
              <span className="text-primary">▸</span> Mostra outros usuários
              próximos com base na sua localização aproximada
            </li>
            <li className="flex gap-2">
              <span className="text-primary">▸</span> Oferece chat dentro do
              app pra combinar trocas presenciais
            </li>
            <li className="flex gap-2">
              <span className="text-primary">▸</span> Atualiza álbuns
              automaticamente quando os dois lados confirmam a entrega
            </li>
          </ul>
        </Card>

        <Card className="space-y-3 p-6">
          <div className="flex items-center gap-2">
            <XCircle className="size-5 text-destructive" aria-hidden />
            <h2 className="font-display text-lg font-extrabold uppercase tracking-wide">
              O que o serviço não faz
            </h2>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-destructive">▸</span> Não vende figurinhas
            </li>
            <li className="flex gap-2">
              <span className="text-destructive">▸</span> Não processa
              pagamentos pelas trocas (são presenciais)
            </li>
            <li className="flex gap-2">
              <span className="text-destructive">▸</span> Não cobra taxa pelas
              trocas
            </li>
            <li className="flex gap-2">
              <span className="text-destructive">▸</span> Não compartilha sua
              localização exata com outros usuários
            </li>
            <li className="flex gap-2">
              <span className="text-destructive">▸</span> Não expõe seu
              telefone — o chat fica dentro do app
            </li>
          </ul>
        </Card>
      </div>

      <Card className="space-y-3 p-6">
        <h2 className="font-display text-lg font-extrabold uppercase tracking-wide">
          Contato
        </h2>
        <p className="text-sm text-muted-foreground">
          Para dúvidas, denúncias, pedidos de remoção de dados ou qualquer
          assunto relacionado ao serviço:
        </p>
        <div className="space-y-2 text-sm">
          <p className="flex items-center gap-2">
            <Mail className="size-4 text-muted-foreground" aria-hidden />
            <a
              href="mailto:contato@trocascopa.com.br"
              className="font-display font-bold text-primary hover:underline"
            >
              contato@trocascopa.com.br
            </a>
          </p>
          <p className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="size-4" aria-hidden />
            Sorocaba & região, SP — Brasil
          </p>
        </div>
      </Card>
    </main>
  );
}
