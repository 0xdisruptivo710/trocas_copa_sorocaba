import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, Gift } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getMyReferralStats } from "@/lib/actions/referral";
import { Card } from "@/components/ui/card";
import { ShareButton } from "@/components/referral/share-button";
import { env } from "@/lib/env";

export default async function IndicarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const stats = await getMyReferralStats();
  if (!stats) redirect("/conta");

  return (
    <main className="space-y-4 px-6 py-6">
      <Link
        href="/conta"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Voltar
      </Link>

      <Card className="space-y-3 p-6">
        <div className="flex items-center gap-2">
          <Gift className="size-5 text-primary" aria-hidden />
          <h1 className="text-xl font-semibold">Indique e ganhe</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Compartilha seu link. Quem se cadastrar e completar o onboarding usa seu
          cupom <strong>@{stats.myUsername}</strong>. Eles pagam{" "}
          <strong>R$ 19,90</strong> no Premium e você ganha <strong>R$ 5,00</strong>{" "}
          de cashback.
        </p>

        <div className="rounded-md border bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground">Seu link único</p>
          <p className="break-all font-mono text-xs">
            {env.SITE_URL}/cadastro?via={stats.myUsername}
          </p>
        </div>

        <ShareButton username={stats.myUsername} siteUrl={env.SITE_URL} />
      </Card>

      <Card className="space-y-3 p-6">
        <h2 className="font-semibold">Suas indicações</h2>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-[10px] text-muted-foreground">Cadastros</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-600">{stats.effective}</p>
            <p className="text-[10px] text-muted-foreground">Onboarding completo</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">{stats.rewarded}</p>
            <p className="text-[10px] text-muted-foreground">Premium pagos</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          O cashback de R$ 5 é creditado quando seu indicado virar Premium.
        </p>
      </Card>

      <Card className="space-y-2 p-6 text-sm">
        <h3 className="font-semibold">Como funciona</h3>
        <ol className="ml-4 list-decimal space-y-1 text-muted-foreground">
          <li>Compartilha seu link nos grupos de WhatsApp/Insta da galera que coleciona.</li>
          <li>
            Quem clica vê uma página de cadastro com o cupom <strong>@{stats.myUsername}</strong>{" "}
            já aplicado.
          </li>
          <li>Quando o indicado completa onboarding (GPS + 1 cromo), conta aqui.</li>
          <li>Quando o indicado vira Premium, você ganha R$ 5 PIX.</li>
        </ol>
      </Card>
    </main>
  );
}
