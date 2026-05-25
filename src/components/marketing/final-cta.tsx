import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-accent/80 py-20 text-primary-foreground">
      {/* Stripes */}
      <div
        className="bg-stripes animate-stripes absolute inset-0 opacity-30"
        aria-hidden
      />
      <div className="relative mx-auto max-w-3xl px-4 text-center">
        <h2 className="font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          Bora completar o álbum
          <br />aqui em Sorocaba?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base opacity-90 sm:text-lg">
          Cadastro grátis, sem cartão. Em menos de 30 segundos você já tá
          procurando matches na região.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/cadastro"
            className="inline-flex h-12 items-center gap-2 rounded-md bg-background px-6 font-display text-base font-extrabold text-primary shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl"
          >
            Criar minha conta
            <ArrowRight className="size-5" aria-hidden />
          </Link>
        </div>
        <p className="mt-6 text-xs opacity-75">
          Premium opcional: R$ 24,90 PIX único · sem assinatura · reembolso em 7 dias
        </p>
      </div>
    </section>
  );
}
