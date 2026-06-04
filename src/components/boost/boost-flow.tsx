"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Check } from "lucide-react";
import { createBoostChargeAction } from "@/lib/actions/boosts";
import { PixCheckout, type PixCharge } from "@/components/payments/pix-checkout";

type Step = "intro" | "qrcode" | "paid";

export function BoostFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("intro");
  const [charge, setCharge] = useState<PixCharge | null>(null);
  const [pending, start] = useTransition();

  const onGenerate = () =>
    start(async () => {
      const r = await createBoostChargeAction("destaque");
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

  if (step === "paid") {
    return (
      <Card className="space-y-3 p-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-400/20">
          <Check className="size-6 text-amber-600" />
        </div>
        <h2 className="text-lg font-semibold">Destaque ativado! ⭐</h2>
        <p className="text-sm text-muted-foreground">
          Por 7 dias você aparece no topo do Explorar de quem tem troca com você.
        </p>
        <Button onClick={() => router.push("/explorar")} className="w-full">
          Ver o Explorar
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
    <Card className="space-y-3 p-6">
      <div className="flex items-center gap-2">
        <Sparkles className="size-5 text-amber-500" aria-hidden />
        <h2 className="text-lg font-bold">Destacar meu perfil</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Por <strong>R$ 4,90</strong> você fica <strong>7 dias</strong> no topo do Explorar de
        quem tem troca com você, com selo ⭐. Pagamento único via PIX.
      </p>
      <Button onClick={onGenerate} disabled={pending} className="w-full" size="lg" variant="festa">
        {pending ? "Gerando PIX…" : "Destacar por R$ 4,90"}
      </Button>
    </Card>
  );
}
