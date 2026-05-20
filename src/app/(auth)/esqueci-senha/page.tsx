import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { resetPasswordAction } from "@/lib/actions/auth";

export default function ResetPage() {
  return (
    <div className="space-y-4">
      <AuthForm mode="reset" action={resetPasswordAction} />
      <p className="text-sm text-center">
        <Link href="/login" className="underline">
          Voltar ao login
        </Link>
      </p>
    </div>
  );
}
