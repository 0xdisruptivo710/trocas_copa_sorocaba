export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm space-y-6">
        <header className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">TrocasCopa</h1>
          <p className="text-sm text-muted-foreground">Copa 2026 — figurinhas Panini</p>
        </header>
        {children}
      </div>
    </main>
  );
}
