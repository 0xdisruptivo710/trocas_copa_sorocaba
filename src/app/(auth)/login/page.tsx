import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { loginAction, loginWithGoogleAction } from "@/lib/actions/auth";

export default function LoginPage() {
  return (
    <div className="space-y-4">
      <AuthForm mode="login" action={loginAction} googleAction={loginWithGoogleAction} />
      <div className="flex justify-between text-sm">
        <Link href="/esqueci-senha" className="underline text-muted-foreground">
          Esqueci a senha
        </Link>
        <Link href="/cadastro" className="underline">
          Criar conta
        </Link>
      </div>
    </div>
  );
}
