import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" aria-label="Trocas Copa Sorocaba" className="flex items-center gap-2">
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

      <footer className="border-t border-border/60 bg-muted/30 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between sm:text-left">
          <p>
            © {new Date().getFullYear()} Trocas Copa Sorocaba — Feito pra
            torcedores da região.
          </p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-foreground">
              Entrar
            </Link>
            <a
              href="mailto:contato@trocascopa.com.br"
              className="hover:text-foreground"
            >
              contato@trocascopa.com.br
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
