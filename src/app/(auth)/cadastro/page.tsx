import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { signupAction, loginWithGoogleAction } from "@/lib/actions/auth";

interface PageProps {
  searchParams: Promise<{ via?: string }>;
}

export default async function SignupPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const via = params.via?.trim().toLowerCase();
  const validVia = via && /^[a-z0-9_]{3,30}$/.test(via) ? via : null;

  return (
    <div className="space-y-4">
      {validVia && (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm">
          <p className="font-medium text-emerald-700">Você foi convidado por @{validVia}</p>
          <p className="text-xs text-muted-foreground">
            Crie sua conta e ele recebe bônus quando você completar o onboarding.
          </p>
        </div>
      )}
      <AuthForm
        mode="signup"
        action={signupAction}
        googleAction={loginWithGoogleAction}
        hiddenFields={validVia ? { referral_via: validVia } : undefined}
      />
      <p className="text-sm text-center text-muted-foreground">
        Já tem conta?{" "}
        <Link href="/login" className="underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
