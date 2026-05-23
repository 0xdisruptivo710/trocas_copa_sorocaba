"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setLocationAction } from "@/lib/actions/profile";

interface Props {
  nextHref?: string;
}

interface ResolvedLocation {
  latitude: number;
  longitude: number;
  city: string;
  state: string;
}

const STATE_MAP: Record<string, string> = {
  Acre: "AC",
  Alagoas: "AL",
  "Amapá": "AP",
  Amazonas: "AM",
  Bahia: "BA",
  "Ceará": "CE",
  "Distrito Federal": "DF",
  "Espírito Santo": "ES",
  "Goiás": "GO",
  "Maranhão": "MA",
  "Mato Grosso": "MT",
  "Mato Grosso do Sul": "MS",
  "Minas Gerais": "MG",
  "Pará": "PA",
  "Paraíba": "PB",
  "Paraná": "PR",
  Pernambuco: "PE",
  "Piauí": "PI",
  "Rio de Janeiro": "RJ",
  "Rio Grande do Norte": "RN",
  "Rio Grande do Sul": "RS",
  "Rondônia": "RO",
  Roraima: "RR",
  "Santa Catarina": "SC",
  "São Paulo": "SP",
  Sergipe: "SE",
  Tocantins: "TO",
};

const UF_LIST = Object.values(STATE_MAP).sort();

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
    "Cidade desconhecida";
  const state = (addr.state && STATE_MAP[addr.state]) ?? "SP";
  return { city, state };
}

async function forwardGeocode(
  city: string,
  state: string,
): Promise<{ lat: number; lng: number } | null> {
  const q = encodeURIComponent(`${city}, ${state}, Brasil`);
  const r = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${q}&limit=1&accept-language=pt-BR`,
  );
  if (!r.ok) return null;
  const arr = (await r.json()) as Array<{ lat: string; lon: string }>;
  if (arr.length === 0) return null;
  return { lat: parseFloat(arr[0].lat), lng: parseFloat(arr[0].lon) };
}

function explainError(err: GeolocationPositionError): string {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return "Você bloqueou a permissão de localização. Clica no cadeado da URL → Permitir localização e tenta de novo.";
    case err.POSITION_UNAVAILABLE:
      return "GPS indisponível agora (sem sinal ou desligado). Tenta de novo perto da janela ou usa entrada manual.";
    case err.TIMEOUT:
      return "GPS demorou demais pra responder. Tenta de novo ou usa entrada manual.";
    default:
      return "Não consegui pegar localização. Tenta entrada manual.";
  }
}

export function LocationCapture({ nextHref }: Props) {
  const [pending, start] = useTransition();
  const [resolved, setResolved] = useState<ResolvedLocation | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [manualCity, setManualCity] = useState("");
  const [manualState, setManualState] = useState("SP");
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
          // Se foi timeout com GPS, tenta uma vez sem highAccuracy (IP-based)
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

  const detectFromManual = () => {
    if (!manualCity.trim()) {
      toast.error("Digita o nome da cidade.");
      return;
    }
    start(async () => {
      const coords = await forwardGeocode(manualCity.trim(), manualState);
      if (!coords) {
        toast.error("Cidade não encontrada. Confere a grafia.");
        return;
      }
      setResolved({
        latitude: coords.lat,
        longitude: coords.lng,
        city: manualCity.trim(),
        state: manualState,
      });
      setShowManual(false);
      toast.success(`Localização: ${manualCity.trim()}, ${manualState}`);
    });
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
        Usamos sua localização só pra calcular distância com outros colecionadores.
        Sua posição exata nunca aparece pra terceiros — só a distância arredondada.
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
            {pending ? "Detectando…" : "Detectar minha localização"}
          </Button>
          <button
            type="button"
            onClick={() => setShowManual(true)}
            className="block w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            Não funciona? Digitar cidade manualmente
          </button>
        </>
      )}

      {!resolved && showManual && (
        <div className="space-y-3 rounded-lg border bg-card p-4">
          <div className="space-y-2">
            <Label htmlFor="city">Cidade</Label>
            <Input
              id="city"
              value={manualCity}
              onChange={(e) => setManualCity(e.target.value)}
              placeholder="Ex: Sorocaba"
              autoComplete="address-level2"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="uf">UF</Label>
            <select
              id="uf"
              value={manualState}
              onChange={(e) => setManualState(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
            >
              {UF_LIST.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowManual(false)}
              disabled={pending}
            >
              Voltar ao GPS
            </Button>
            <Button
              className="flex-1"
              onClick={detectFromManual}
              disabled={pending || manualCity.trim().length === 0}
              variant="festa"
            >
              {pending ? "Buscando…" : "Buscar"}
            </Button>
          </div>
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
