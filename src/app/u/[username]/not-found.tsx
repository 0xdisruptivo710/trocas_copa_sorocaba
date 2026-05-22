import Link from "next/link";

export default function UserNotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12 text-center">
      <h1 className="text-2xl font-semibold">Colecionador não encontrado</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Esse @username não existe ou foi removido.
      </p>
      <Link
        href="/explorar"
        className="mt-6 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Voltar pra Explorar
      </Link>
    </main>
  );
}
