"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setLocationAction, geocodeCityAction } from "@/lib/actions/profile";
import { SOROCABA_CITIES, REGION_UF } from "@/lib/explorar/states";

interface Props {
  nextHref?: string;
}

interface ResolvedLocation {
  latitude: number;
  longitude: number;
  city: string;
  state: string;
}

interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
}

interface NominatimResponse {
  address?: NominatimAddress;
}

async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<{ city: string; state: string }> {
  const r = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=10&accept-language=pt-BR`,
  );
  if (!r.ok) throw new Error("reverse-geocode failed");
  const json = (await r.json()) as NominatimResponse;
  const addr = json.address ?? {};
  const city =
    addr.city ??
    addr.town ??
    addr.village ??
    addr.municipality ??
    addr.county ??
    "Sorocaba";
  return { city, state: REGION_UF };
}

function explainError(err: GeolocationPositionError): string {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return "Você bloqueou a permissão. Clica no 🔒 da URL → Permitir localização e tenta de novo.";
    case err.POSITION_UNAVAILABLE:
      return "GPS indisponível (sem sinal ou desligado). Usa entrada manual abaixo.";
    case err.TIMEOUT:
      return "GPS demorou demais. Usa entrada manual abaixo.";
    default:
      return "Não consegui pegar localização. Usa entrada manual.";
  }
}

export function LocationCapture({ nextHref }: Props) {
  const [pending, start] = useTransition();
  const [resolved, setResolved] = useState<ResolvedLocation | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [manualCity, setManualCity] = useState("");
  const router = useRouter();

  const detect = (highAccuracy = true) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      toast.error("Seu navegador não suporta geolocalização.");
      setShowManual(true);
      return;
    }
    start(async () => {
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, {
            enableHighAccuracy: highAccuracy,
            timeout: 20000,
            maximumAge: 60_000,
          }),
        );
        const { latitude, longitude } = pos.coords;
        const { city, state } = await reverseGeocode(latitude, longitude);
        setResolved({ latitude, longitude, city, state });
        toast.success(`Localização: ${city}, ${state}`);
      } catch (err) {
        if (err instanceof GeolocationPositionError) {
          if (err.code === err.TIMEOUT && highAccuracy) {
            toast.info("GPS demorou. Tentando rede/Wi-Fi…");
            detect(false);
            return;
          }
          toast.error(explainError(err));
        } else {
          toast.error("Erro inesperado ao buscar localização.");
        }
        setShowManual(true);
      }
    });
  };

  const pickCity = (city: string) => {
    setManualCity(city);
    start(async () => {
      try {
        const coords = await geocodeCityAction(city);
        if (!coords) {
          toast.error("Não achei essa cidade. Confere a grafia ou usa o GPS.");
          return;
        }
        setResolved({
          latitude: coords.lat,
          longitude: coords.lng,
          city,
          state: REGION_UF,
        });
        setShowManual(false);
        toast.success(`Localização: ${city}, ${REGION_UF}`);
      } catch {
        toast.error("Erro ao buscar a cidade. Tenta de novo em instantes.");
      }
    });
  };

  const submitManual = () => {
    if (!manualCity.trim()) {
      toast.error("Digita o nome da cidade.");
      return;
    }
    pickCity(manualCity.trim());
  };

  const save = () => {
    if (!resolved) return;
    start(async () => {
      const r = await setLocationAction(
        resolved.latitude,
        resolved.longitude,
        resolved.city,
        resolved.state,
      );
      if (r.error) {
        toast.error(r.error);
        return;
      }
      toast.success("Localização salva.");
      if (nextHref) router.push(nextHref);
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        O Trocas Copa Sorocaba conecta colecionadores de{" "}
        <strong className="text-foreground">Sorocaba e região</strong>. Sua posição
        exata nunca aparece pra terceiros — só a distância arredondada.
      </p>

      {!resolved && !showManual && (
        <>
          <Button
            onClick={() => detect(true)}
            className="w-full"
            disabled={pending}
            variant="festa"
            size="lg"
          >
            {pending ? "Detectando…" : "Detectar pelo GPS"}
          </Button>
          <button
            type="button"
            onClick={() => setShowManual(true)}
            className="block w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            Ou escolhe sua cidade manualmente
          </button>
        </>
      )}

      {!resolved && showManual && (
        <div className="space-y-4 rounded-lg border bg-card p-4">
          <div>
            <p className="mb-2 font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Cidades da região
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SOROCABA_CITIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => pickCity(c)}
                  disabled={pending}
                  className="rounded-full border border-border bg-background px-2.5 py-1 text-xs hover:border-primary hover:bg-primary/5 disabled:opacity-50"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t pt-3">
            <Label htmlFor="city" className="mb-2 block">
              Outra cidade?
            </Label>
            <div className="flex gap-2">
              <Input
                id="city"
                value={manualCity}
                onChange={(e) => setManualCity(e.target.value)}
                placeholder="Ex: Salto"
                autoComplete="address-level2"
              />
              <Button
                onClick={submitManual}
                disabled={pending || manualCity.trim().length === 0}
                variant="festa"
              >
                Buscar
              </Button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowManual(false)}
            className="block w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            ← Voltar ao GPS
          </button>
        </div>
      )}

      {resolved && (
        <div className="space-y-3">
          <div className="rounded-lg border bg-card p-4 text-sm">
            <p className="font-display font-bold">
              {resolved.city}, {resolved.state}
            </p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {resolved.latitude.toFixed(4)}, {resolved.longitude.toFixed(4)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setResolved(null);
                setShowManual(false);
              }}
              disabled={pending}
            >
              Refazer
            </Button>
            <Button
              className="flex-1"
              onClick={save}
              disabled={pending}
              variant="festa"
            >
              {pending ? "Salvando…" : "Confirmar"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
