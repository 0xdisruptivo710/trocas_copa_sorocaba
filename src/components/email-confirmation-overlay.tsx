"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resendConfirmationAction } from "@/lib/actions/auth";

interface Props {
  email: string;
  onClose?: () => void;
}

const RESEND_COOLDOWN_SECONDS = 60;

export function EmailConfirmationOverlay({ email, onClose }: Props) {
  const [pending, start] = useTransition();
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const resend = () => {
    if (cooldown > 0) return;
    start(async () => {
      const r = await resendConfirmationAction(email);
      if (r.error) {
        toast.error(r.error);
        return;
      }
      toast.success("Email reenviado.");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-email-title"
    >
      <div className="mx-auto w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl md:p-8">
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Mail className="size-8" aria-hidden />
        </div>

        <h2
          id="confirm-email-title"
          className="text-center font-display text-2xl font-extrabold uppercase leading-tight tracking-tight md:text-3xl"
        >
          Confirme seu email
        </h2>

        <p className="mt-3 text-center text-sm text-muted-foreground">
          Mandamos um link de confirmação pra{" "}
          <strong className="break-all text-foreground">{email}</strong>.
          Clica nele pra ativar sua conta e entrar.
        </p>

        <div className="mt-5 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
          <p className="font-display font-bold uppercase tracking-wider text-foreground">
            Não chegou em até 2min?
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Olha a pasta de spam / lixo eletrônico</li>
            <li>Confere se digitou o email certo</li>
            <li>Tenta reenviar abaixo</li>
          </ul>
        </div>

        <Button
          type="button"
          variant="outline"
          className="mt-5 w-full"
          disabled={pending || cooldown > 0}
          onClick={resend}
        >
          <RefreshCw className={pending ? "size-4 animate-spin" : "size-4"} aria-hidden />
          {pending
            ? "Reenviando…"
            : cooldown > 0
              ? `Reenviar em ${cooldown}s`
              : "Reenviar email"}
        </Button>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="mt-3 block w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            Usar outro email
          </button>
        )}

        <p className="mt-5 text-center text-[11px] text-muted-foreground">
          Dúvidas? Fala com a gente em{" "}
          <a
            href="mailto:contato@trocascopasorocaba.com"
            className="underline hover:text-foreground"
          >
            contato@trocascopasorocaba.com
          </a>
        </p>
      </div>
    </div>
  );
}
