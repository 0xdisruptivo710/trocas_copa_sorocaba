import { notFound } from "next/navigation";
import { createClient as createSbjsClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { env } from "@/lib/env";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/brand/logo";
import { CopyLinkButton } from "@/components/perfil/copy-link-button";
import Link from "next/link";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

interface DashboardData {
  partner: {
    slug: string;
    name: string;
    instagram: string | null;
    commission_cents: number;
  };
  stats: {
    signups_total: number;
    signups_30d: number;
    conversions_total: number;
    conversions_30d: number;
    pending_cents: number;
    paid_cents: number;
  };
  recent_conversions: Array<{
    created_at: string;
    amount_cents: number;
    commission_cents: number;
    status: "pending" | "approved" | "paid" | "voided";
  }>;
  payouts: Array<{
    created_at: string;
    amount_cents: number;
    reference_month: string | null;
    pix_txid: string | null;
  }>;
}

const STATUS_LABELS: Record<DashboardData["recent_conversions"][number]["status"], string> = {
  pending: "Aguardando",
  approved: "Aprovada",
  paid: "Paga",
  voided: "Cancelada",
};

const STATUS_BADGE: Record<DashboardData["recent_conversions"][number]["status"], string> = {
  pending: "bg-muted text-muted-foreground",
  approved: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  paid: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  voided: "bg-destructive/15 text-destructive",
};

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export default async function ParceiroDashboardPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const token = typeof sp.t === "string" ? sp.t : "";

  if (!token) notFound();

  // Anon client: a RPC valida o token internamente, não usa auth.uid.
  const supabase = createSbjsClient<Database>(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase.rpc("trocas_partner_dashboard", {
    p_slug: slug,
    p_token: token,
  });
  if (error || !data) notFound();

  const dash = data as unknown as DashboardData;
  const link = `${env.SITE_URL}/?p=${dash.partner.slug}`;

  return (
    <main className="mx-auto min-h-dvh max-w-4xl space-y-6 px-6 py-6 md:px-10 md:py-10">
      <header className="flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2">
          <Logo variant="mark" size={32} />
          <span className="font-display text-sm font-extrabold leading-tight">
            trocas copa
            <span className="block text-primary">SOROCABA</span>
          </span>
        </Link>
        <span className="rounded-full bg-primary/10 px-3 py-1 font-display text-[10px] font-bold uppercase tracking-wider text-primary">
          Painel do parceiro
        </span>
      </header>

      <section>
        <p className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Olá,
        </p>
        <h1 className="font-display text-4xl font-extrabold uppercase leading-none tracking-tight md:text-6xl">
          {dash.partner.name}
        </h1>
        {dash.partner.instagram && (
          <p className="mt-1 text-sm text-muted-foreground">@{dash.partner.instagram}</p>
        )}
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Seu link pessoal. Tudo que vier por ele e virar venda gera{" "}
          <strong className="text-foreground">{formatBRL(dash.partner.commission_cents)}</strong>{" "}
          de comissão pra você. Quem usar seu cupom no checkout ainda ganha R$5 de desconto.
        </p>
      </section>

      <Card className="space-y-3 p-5">
        <p className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Seu link
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <code className="flex-1 truncate rounded-md border bg-muted/40 px-3 py-2 font-mono text-sm">
            {link}
          </code>
          <CopyLinkButton link={link} />
        </div>
        <p className="text-xs text-muted-foreground">
          Cupom (mesma coisa, digitado no checkout):{" "}
          <strong className="font-mono uppercase text-foreground">{dash.partner.slug}</strong>
        </p>
      </Card>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <p className="font-display text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            A receber
          </p>
          <p className="mt-1 font-display text-3xl font-extrabold tabular-nums text-amber-600 dark:text-amber-400">
            {formatBRL(dash.stats.pending_cents)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Pago no fim do mês via PIX</p>
        </Card>
        <Card className="p-5">
          <p className="font-display text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Recebido
          </p>
          <p className="mt-1 font-display text-3xl font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatBRL(dash.stats.paid_cents)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Acumulado histórico</p>
        </Card>
        <Card className="p-5">
          <p className="font-display text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Cadastros
          </p>
          <p className="mt-1 font-display text-3xl font-extrabold tabular-nums">
            {dash.stats.signups_total}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {dash.stats.signups_30d} nos últimos 30 dias
          </p>
        </Card>
        <Card className="p-5">
          <p className="font-display text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Vendas
          </p>
          <p className="mt-1 font-display text-3xl font-extrabold tabular-nums text-primary">
            {dash.stats.conversions_total}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {dash.stats.conversions_30d} nos últimos 30 dias
          </p>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Últimas conversões
        </h2>
        {dash.recent_conversions.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            Ainda nada por aqui. Quando alguém comprar pelo seu link, aparece nesta lista.
          </Card>
        ) : (
          <Card className="divide-y overflow-hidden p-0">
            {dash.recent_conversions.map((c, i) => (
              <div key={i} className="flex items-center justify-between gap-3 p-3 text-sm">
                <span className="text-muted-foreground tabular-nums">
                  {formatDate(c.created_at)}
                </span>
                <span className="flex-1 text-xs text-muted-foreground">
                  Venda de {formatBRL(c.amount_cents)}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-wide ${STATUS_BADGE[c.status]}`}
                >
                  {STATUS_LABELS[c.status]}
                </span>
                <span className="font-display font-bold tabular-nums">
                  + {formatBRL(c.commission_cents)}
                </span>
              </div>
            ))}
          </Card>
        )}
      </section>

      {dash.payouts.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Pagamentos PIX feitos
          </h2>
          <Card className="divide-y overflow-hidden p-0">
            {dash.payouts.map((p, i) => (
              <div key={i} className="flex items-center justify-between gap-3 p-3 text-sm">
                <span className="text-muted-foreground tabular-nums">
                  {formatDate(p.created_at)}
                </span>
                <span className="flex-1 text-xs text-muted-foreground">
                  {p.reference_month
                    ? `Ref. ${new Date(p.reference_month).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`
                    : "—"}
                  {p.pix_txid && (
                    <>
                      {" · "}
                      <span className="font-mono text-[10px]">{p.pix_txid}</span>
                    </>
                  )}
                </span>
                <span className="font-display font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {formatBRL(p.amount_cents)}
                </span>
              </div>
            ))}
          </Card>
        </section>
      )}

      <footer className="border-t pt-6 text-xs text-muted-foreground">
        <p>
          Painel privado. Não compartilhe esta URL — quem tiver o link vê seus números.{" "}
          Se desconfiar que vazou, fale com a gente em contato@trocascopa.com.br pra renovarmos
          seu token.
        </p>
      </footer>
    </main>
  );
}
