import { Logo } from "@/components/brand/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="bg-stripes flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm space-y-6">
        <header className="flex flex-col items-center text-center">
          <Logo variant="stacked" size={140} className="mb-2" />
          <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            EUA · Canadá · México
          </p>
        </header>
        {children}
      </div>
    </main>
  );
}
