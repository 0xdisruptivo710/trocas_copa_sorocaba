"use client";

import { useMemo } from "react";
import Link from "next/link";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Match } from "@/lib/explorar/data";

// Centro de Sorocaba (fallback quando user logado não tem location).
const SOROCABA_CENTER: [number, number] = [-23.5015, -47.4526];

interface Props {
  matches: Match[];
  /** Posição aproximada do user logado (também snap a ~500m). Pode ser null. */
  myLatLng: [number, number] | null;
  /** Raio em km do filtro atual — desenha círculo só se temos myLatLng. */
  radiusKm: number;
}

function buildAvatarIcon(name: string, avatarUrl: string | null, score: number) {
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const ring = score >= 4 ? "ring-amber-400" : score > 0 ? "ring-primary" : "ring-border";
  const bg = avatarUrl
    ? `background-image:url('${avatarUrl.replace(/'/g, "%27")}');background-size:cover;background-position:center;`
    : `background:linear-gradient(135deg,var(--color-primary,#2bb673),var(--color-accent,#f6c544));color:#fff;`;

  const html = `
    <div class="explore-marker-wrap">
      <div class="explore-marker ${ring}" style="${bg}">
        ${avatarUrl ? "" : `<span>${initials}</span>`}
      </div>
      ${score > 0 ? `<div class="explore-marker-badge">${score}</div>` : ""}
    </div>
  `;

  return L.divIcon({
    html,
    className: "explore-marker-root",
    iconSize: [44, 44],
    iconAnchor: [22, 44],
    popupAnchor: [0, -42],
  });
}

export default function ExploreMap({ matches, myLatLng, radiusKm }: Props) {
  const center = myLatLng ?? SOROCABA_CENTER;

  const points = useMemo(
    () => matches.filter((m) => m.lat_approx !== null && m.lng_approx !== null),
    [matches],
  );

  return (
    <div className="relative h-[520px] w-full overflow-hidden rounded-2xl border shadow-[var(--shadow-cromo)]">
      <MapContainer
        center={center}
        zoom={11}
        scrollWheelZoom
        className="h-full w-full"
        style={{ background: "#f3f4f6" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {myLatLng && (
          <>
            <Marker
              position={myLatLng}
              icon={L.divIcon({
                html: '<div class="explore-me-pin" aria-label="Você está aqui"></div>',
                className: "explore-me-root",
                iconSize: [20, 20],
                iconAnchor: [10, 10],
              })}
            >
              <Popup>Você (aproximado por privacidade)</Popup>
            </Marker>
            <Circle
              center={myLatLng}
              radius={radiusKm * 1000}
              pathOptions={{
                color: "var(--color-primary, #2bb673)",
                weight: 1,
                fillOpacity: 0.06,
              }}
            />
          </>
        )}

        {points.map((m) => (
          <Marker
            key={m.other_user}
            position={[m.lat_approx as number, m.lng_approx as number]}
            icon={buildAvatarIcon(m.full_name, m.avatar_url, m.match_score)}
          >
            <Popup>
              <div className="space-y-1 font-sans">
                <p className="font-display text-sm font-bold leading-tight">
                  {m.full_name}
                </p>
                <p className="text-xs text-muted-foreground">@{m.username}</p>
                {m.city && (
                  <p className="text-xs text-muted-foreground">
                    {m.city}, {m.state}
                    {m.distance_km !== null && <> · {m.distance_km} km</>}
                  </p>
                )}
                {m.match_score > 0 && (
                  <p className="text-xs">
                    <span className="font-semibold text-primary">{m.i_can_give} dá</span>
                    {" · "}
                    <span className="font-semibold">{m.i_can_get} recebe</span>
                  </p>
                )}
                <Link
                  href={`/u/${m.username}`}
                  className="mt-1 inline-block rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Ver perfil &rarr;
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <style>{`
        .explore-marker-root,
        .explore-me-root {
          background: transparent !important;
          border: none !important;
        }
        .explore-marker-wrap {
          position: relative;
          width: 44px;
          height: 44px;
        }
        .explore-marker {
          width: 44px;
          height: 44px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display, system-ui);
          font-weight: 800;
          font-size: 14px;
          color: white;
          box-shadow: 0 4px 12px rgba(0,0,0,.18);
          border: 2px solid white;
          overflow: hidden;
        }
        .explore-marker.ring-primary { outline: 2px solid color-mix(in oklab, var(--color-primary, #2bb673) 70%, transparent); outline-offset: 1px; }
        .explore-marker.ring-amber-400 { outline: 2px solid #f59e0b; outline-offset: 1px; }
        .explore-marker.ring-border { outline: 2px solid rgba(0,0,0,.12); outline-offset: 1px; }
        .explore-marker-badge {
          position: absolute;
          right: -4px;
          top: -4px;
          background: var(--color-primary, #2bb673);
          color: white;
          font-family: var(--font-display, system-ui);
          font-weight: 800;
          font-size: 11px;
          line-height: 1;
          padding: 3px 6px;
          border-radius: 999px;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,.2);
        }
        .explore-me-pin {
          width: 20px;
          height: 20px;
          border-radius: 999px;
          background: #2563eb;
          border: 3px solid white;
          box-shadow: 0 0 0 2px rgba(37,99,235,.35), 0 4px 12px rgba(0,0,0,.2);
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
        }
      `}</style>
    </div>
  );
}
