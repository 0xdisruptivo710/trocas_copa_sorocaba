"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";
import { createPremiumChargeAction } from "@/lib/actions/premium";
import { PixCheckout, type PixCharge } from "@/components/payments/pix-checkout";
import { useCelebrate } from "@/components/motion/celebrate";

type Step = "intro" | "qrcode" | "paid";

export function PremiumFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("intro");
  const [referralCode, setReferralCode] = useState("");
  const [pending, start] = useTransition();
  const [charge, setCharge] = useState<PixCharge | null>(null);
  const { fire } = useCelebrate();

  const onGenerate = () => {
    start(async () => {
      const r = await createPremiumChargeAction(referralCode || null);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setCharge({
        chargeId: r.chargeId,
        brCode: r.brCode,
        brCodeBase64: r.brCodeBase64,
        amount: r.amount,
      });
      setStep("qrcode");
    });
  };

  if (step === "paid") {
    return (
      <Card className="space-y-3 p-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
          <Check className="size-6 text-emerald-600" />
        </div>
        <h2 className="text-lg font-semibold">Bem-vindo ao Premium!</h2>
        <p className="text-sm text-muted-foreground">
          Tudo desbloqueado: chats ilimitados, cards de cromos, propostas formais e
          marcar como entregue.
        </p>
        <Button onClick={() => router.push("/")} className="w-full">
          Voltar pra home
        </Button>
      </Card>
    );
  }

  if (step === "qrcode" && charge) {
    return (
      <PixCheckout
        charge={charge}
        onPaid={() => {
          setStep("paid");
          fire(null, "large");
          toast.success("Pagamento confirmado!");
          router.refresh();
        }}
        onExpired={() => {
          setStep("intro");
          setCharge(null);
        }}
        onCancel={() => {
          setStep("intro");
          setCharge(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-3 p-6">
        <h2 className="text-2xl font-bold">TrocasCopa Premium</h2>
        <p className="text-sm text-muted-foreground">
          Pagamento único de <strong>R$ 24,90</strong>. Acesso pra sempre.
        </p>

        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            <span>Chats ilimitados (Free tem 3 novos por semana)</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            <span>Anexar cromos visuais no chat</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            <span>Proposta formal de troca com Aceitar/Recusar</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            <span>Marcar como entregue — atualização automática do álbum</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            <span>Reputação ⭐ + badge &quot;Apoiador&quot; no perfil</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            <span>Sem anúncios</span>
          </li>
        </ul>
      </Card>

      <Card className="space-y-3 p-6">
        <div className="space-y-2">
          <Label htmlFor="referral">Cupom de indicação (opcional)</Label>
          <Input
            id="referral"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
            placeholder="@username de quem indicou"
            pattern="^[a-z0-9_]*$"
          />
          <p className="text-xs text-muted-foreground">
            Com cupom válido, paga <strong>R$ 19,90</strong> e quem indicou ganha R$ 5.
          </p>
        </div>

        <Button
          onClick={onGenerate}
          disabled={pending}
          className="w-full"
          size="lg"
          variant="festa"
        >
          {pending ? "Gerando PIX…" : "Gerar PIX"}
        </Button>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Reembolso em até 7 dias — contato@trocascopasorocaba.com
      </p>
    </div>
  );
}
