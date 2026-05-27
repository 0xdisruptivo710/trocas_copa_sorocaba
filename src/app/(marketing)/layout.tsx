import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Mail, MapPin } from "lucide-react";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link
            href="/"
            aria-label="Trocas Copa Sorocaba"
            className="flex items-center gap-2"
          >
            <Logo variant="mark" size={32} />
            <span className="font-display text-base font-extrabold leading-tight">
              trocas copa
              <span className="ml-1 text-primary">SOROCABA</span>
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-md px-3 py-1.5 text-sm font-display font-semibold text-foreground hover:bg-muted"
            >
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="rounded-md bg-gradient-to-r from-primary via-primary to-accent/80 px-3 py-1.5 text-sm font-display font-bold text-primary-foreground shadow-sm shadow-primary/30 transition-all hover:shadow-md hover:brightness-105"
            >
              Criar conta
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border/60 bg-muted/40 py-12">
        <div className="mx-auto max-w-6xl space-y-8 px-4">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            {/* Brand block */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <Logo variant="mark" size={36} />
                <div>
                  <p className="font-display text-base font-extrabold leading-tight">
                    trocas copa
                    <span className="ml-1 text-primary">SOROCABA</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Cole · Encontre · Troque
                  </p>
                </div>
              </div>
              <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
                Trocas Copa Sorocaba é um <strong className="text-foreground">projeto
                  independente feito por torcedores da região</strong>. Não temos
                qualquer afiliação, patrocínio ou endosso da{" "}
                <strong className="text-foreground">FIFA, Panini</strong> ou outras
                detentoras de direitos sobre o álbum oficial. Marcas e nomes
                citados pertencem a seus respectivos donos.
              </p>
            </div>

            {/* Navegação */}
            <div>
              <p className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
                Navegação
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link
                    href="/cadastro"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Criar conta
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Entrar
                  </Link>
                </li>
                <li>
                  <a
                    href="#como-funciona"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Como funciona
                  </a>
                </li>
                <li>
                  <a href="#faq" className="text-muted-foreground hover:text-foreground">
                    Perguntas frequentes
                  </a>
                </li>
              </ul>
            </div>

            {/* Contato */}
            <div>
              <p className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
                Contato
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <a
                    href="mailto:contato@trocascopasorocaba.com"
                    className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <Mail className="size-3.5" aria-hidden />
                    contato@trocascopasorocaba.com
                  </a>
                </li>
                <li className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="size-3.5" aria-hidden />
                  Sorocaba & região, SP
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} Trocas Copa Sorocaba — Feito pra
              torcedores da região 🟢🟡
            </p>
            <p>
              <Link href="/u/0xdisruptivo" className="hover:text-foreground">
                Pelo perfil do criador
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
