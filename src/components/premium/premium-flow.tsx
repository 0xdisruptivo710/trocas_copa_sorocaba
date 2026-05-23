"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Copy, Loader2 } from "lucide-react";
import { createPremiumChargeAction, checkChargeStatus } from "@/lib/actions/premium";

type Step = "intro" | "qrcode" | "paid";

interface Charge {
  chargeId: string;
  brCode: string;
  brCodeBase64: string;
  amount: number;
}

export function PremiumFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("intro");
  const [referralCode, setReferralCode] = useState("");
  const [pending, start] = useTransition();
  const [charge, setCharge] = useState<Charge | null>(null);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Polling de status assim que a charge é criada (backup do webhook).
  useEffect(() => {
    if (!charge || step !== "qrcode") return;
    pollRef.current = setInterval(async () => {
      const r = await checkChargeStatus(charge.chargeId);
      if (r.status === "PAID") {
        setStep("paid");
        if (pollRef.current) clearInterval(pollRef.current);
        toast.success("Pagamento confirmado!");
        router.refresh();
      } else if (r.status === "EXPIRED" || r.status === "CANCELLED") {
        if (pollRef.current) clearInterval(pollRef.current);
        toast.error("Cobrança expirou. Tenta de novo.");
        setStep("intro");
        setCharge(null);
      }
    }, 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [charge, step, router]);

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

  const onCopy = async () => {
    if (!charge) return;
    await navigator.clipboard.writeText(charge.brCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
    const reais = (charge.amount / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
    });
    return (
      <Card className="space-y-4 p-6">
        <header>
          <h2 className="text-lg font-semibold">Pague R$ {reais} via PIX</h2>
          <p className="text-sm text-muted-foreground">
            Aponte a câmera do banco pro QR ou copia e cola.
          </p>
        </header>

        <div className="flex justify-center">
          <Image
            src={charge.brCodeBase64}
            alt="QR Code PIX"
            width={240}
            height={240}
            unoptimized
            className="rounded-lg border bg-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="brcode">Código copia e cola</Label>
          <div className="flex gap-2">
            <Input
              id="brcode"
              value={charge.brCode}
              readOnly
              className="font-mono text-xs"
            />
            <Button type="button" variant="outline" size="icon" onClick={onCopy}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Aguardando confirmação…
        </div>

        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => {
            if (pollRef.current) clearInterval(pollRef.current);
            setStep("intro");
            setCharge(null);
          }}
        >
          Cancelar
        </Button>
      </Card>
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
            <span>Reputação ⭐ + badge "Apoiador" no perfil</span>
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

        <Button onClick={onGenerate} disabled={pending} className="w-full" size="lg">
          {pending ? "Gerando PIX…" : "Gerar PIX"}
        </Button>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Reembolso em até 7 dias — contato@trocascopa.com.br
      </p>
    </div>
  );
}
