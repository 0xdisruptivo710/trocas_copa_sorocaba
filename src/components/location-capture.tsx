"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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

async function reverseGeocode(lat: number, lng: number): Promise<{ city: string; state: string }> {
  const r = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=10&accept-language=pt-BR`,
    { headers: { "User-Agent": "TrocasCopa/1.0" } },
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

export function LocationCapture({ nextHref }: Props) {
  const [pending, start] = useTransition();
  const [resolved, setResolved] = useState<ResolvedLocation | null>(null);
  const router = useRouter();

  const detect = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      toast.error("Seu navegador não suporta geolocalização.");
      return;
    }
    start(async () => {
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, {
            enableHighAccuracy: true,
            timeout: 15000,
          }),
        );
        const { latitude, longitude } = pos.coords;
        const { city, state } = await reverseGeocode(latitude, longitude);
        setResolved({ latitude, longitude, city, state });
        toast.success(`Localização: ${city}, ${state}`);
      } catch {
        toast.error("Não consegui pegar sua localização. Verifique permissões.");
      }
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
        Usamos sua localização só pra calcular distância com outros colecionadores. Sua posição
        exata nunca aparece pra terceiros — só a distância arredondada.
      </p>
      {!resolved ? (
        <Button onClick={detect} className="w-full" disabled={pending}>
          {pending ? "Detectando…" : "Detectar minha localização"}
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="rounded-lg border bg-card p-4 text-sm">
            <p className="font-medium">
              {resolved.city}, {resolved.state}
            </p>
            <p className="text-muted-foreground">
              {resolved.latitude.toFixed(4)}, {resolved.longitude.toFixed(4)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={detect} disabled={pending}>
              Refazer
            </Button>
            <Button className="flex-1" onClick={save} disabled={pending}>
              {pending ? "Salvando…" : "Confirmar"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
