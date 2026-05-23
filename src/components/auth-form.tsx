"use client";

import { useTransition, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "login" | "signup" | "reset";

interface Props {
  mode: Mode;
  action: (formData: FormData) => Promise<{ error?: string } | void>;
  googleAction?: () => Promise<{ error?: string } | void>;
  hiddenFields?: Record<string, string>;
}

export function AuthForm({ mode, action, googleAction, hiddenFields }: Props) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const submit = (formData: FormData) => {
    setError(null);
    start(async () => {
      const result = await action(formData);
      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
      } else if (mode === "reset") {
        toast.success("Link enviado para seu e-mail.");
      }
    });
  };

  return (
    <form action={submit} className="space-y-4">
      {hiddenFields &&
        Object.entries(hiddenFields).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}

      {mode === "signup" && (
        <div className="space-y-2">
          <Label htmlFor="full_name">Nome completo</Label>
          <Input id="full_name" name="full_name" required autoComplete="name" />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>

      {mode !== "reset" && (
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending
          ? "Aguarde…"
          : mode === "login"
            ? "Entrar"
            : mode === "signup"
              ? "Criar conta"
              : "Enviar link"}
      </Button>

      {googleAction && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await googleAction();
              if (r?.error) toast.error(r.error);
            })
          }
        >
          Entrar com Google
        </Button>
      )}
    </form>
  );
}
