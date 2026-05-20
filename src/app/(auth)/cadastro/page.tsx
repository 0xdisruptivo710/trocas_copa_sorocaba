import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { signupAction, loginWithGoogleAction } from "@/lib/actions/auth";

export default function SignupPage() {
  return (
    <div className="space-y-4">
      <AuthForm mode="signup" action={signupAction} googleAction={loginWithGoogleAction} />
      <p className="text-sm text-center text-muted-foreground">
        Já tem conta?{" "}
        <Link href="/login" className="underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
