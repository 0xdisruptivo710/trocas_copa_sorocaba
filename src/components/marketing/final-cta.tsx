import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-accent/80 py-20 text-primary-foreground">
      {/* Stripes */}
      <div
        className="bg-stripes animate-stripes absolute inset-0 opacity-30"
        aria-hidden
      />
      <div
        className="absolute -left-32 -bottom-32 size-96 rounded-full bg-accent/30 blur-3xl"
        aria-hidden
      />
      <div className="relative mx-auto max-w-3xl px-4 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-display font-semibold backdrop-blur">
          <Sparkles className="size-3" aria-hidden />
          ÚLTIMA CHAMADA · CADASTROS ABERTOS
        </div>
        <h2 className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          Bora colar a Copa
          <br />
          <span className="text-accent">aqui em Sorocaba?</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base opacity-90 sm:text-lg">
          Em 30 segundos você já tá com sua conta, álbum digital e mapa de
          colecionadores da região na mão. Grátis · sem cartão.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/cadastro"
            className="inline-flex h-12 items-center gap-2 rounded-md bg-background px-6 font-display text-base font-extrabold text-primary shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl"
          >
            Criar minha conta
            <ArrowRight className="size-5" aria-hidden />
          </Link>
          <Link
            href="/login"
            className="inline-flex h-12 items-center px-5 font-display text-base font-semibold text-white/90 underline-offset-4 hover:underline"
          >
            Já tenho conta
          </Link>
        </div>
        <p className="mt-6 text-xs opacity-75">
          Grátis · sem cartão · 100% comunidade local · Premium opcional R$ 24,90 PIX único
        </p>
      </div>
    </section>
  );
}
