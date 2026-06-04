"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Copy, Loader2 } from "lucide-react";
import { checkChargeStatus } from "@/lib/actions/premium";

export interface PixCharge {
  chargeId: string;
  brCode: string;
  brCodeBase64: string;
  amount: number;
}

interface Props {
  charge: PixCharge;
  onPaid: () => void;
  onExpired: () => void;
  onCancel: () => void;
}

export function PixCheckout({ charge, onPaid, onExpired, onCancel }: Props) {
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Callbacks em ref: os pais passam closures novas a cada render. Sem isso, o
  // efeito de polling re-subscreveria o setInterval a cada render (thrash).
  const onPaidRef = useRef(onPaid);
  const onExpiredRef = useRef(onExpired);
  useEffect(() => {
    onPaidRef.current = onPaid;
    onExpiredRef.current = onExpired;
  });

  // Polling de status (backup do webhook).
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      const r = await checkChargeStatus(charge.chargeId);
      if (r.status === "PAID") {
        if (pollRef.current) clearInterval(pollRef.current);
        onPaidRef.current();
      } else if (r.status === "EXPIRED" || r.status === "CANCELLED") {
        if (pollRef.current) clearInterval(pollRef.current);
        toast.error("Cobrança expirou. Tenta de novo.");
        onExpiredRef.current();
      }
    }, 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [charge.chargeId]);

  const reais = (charge.amount / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  const onCopy = async () => {
    await navigator.clipboard.writeText(charge.brCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

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
          <Input id="brcode" value={charge.brCode} readOnly className="font-mono text-xs" />
          <Button type="button" variant="outline" size="icon" onClick={onCopy}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Aguardando confirmação…
      </div>

      <Button type="button" variant="ghost" className="w-full" onClick={onCancel}>
        Cancelar
      </Button>
    </Card>
  );
}
