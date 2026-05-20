import { LocationCapture } from "@/components/location-capture";

export default function OnboardingLocation() {
  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <header className="mb-8 space-y-1">
        <p className="text-sm text-muted-foreground">Passo 2 de 2</p>
        <h1 className="text-2xl font-semibold">Sua região</h1>
        <p className="text-sm text-muted-foreground">
          Encontre colecionadores perto de você.
        </p>
      </header>
      <LocationCapture nextHref="/" />
    </main>
  );
}
