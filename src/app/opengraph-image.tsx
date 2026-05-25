import { ImageResponse } from "next/og";

export const alt = "Trocas Copa Sorocaba — Álbum da Copa 2026";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background:
            "linear-gradient(135deg, #15803d 0%, #1d4ed8 100%)",
          backgroundImage: `
            linear-gradient(135deg, #15803d 0%, #1d4ed8 100%),
            repeating-linear-gradient(105deg, transparent 0, transparent 40px, rgba(255,255,255,0.04) 40px, rgba(255,255,255,0.04) 80px)
          `,
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top: brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 96,
              height: 96,
              borderRadius: 24,
              background: "#facc15",
            }}
          >
            <span style={{ fontSize: 64 }}>⚽</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: 52,
                fontWeight: 800,
                letterSpacing: -2,
                lineHeight: 1,
              }}
            >
              trocas copa
            </span>
            <span
              style={{
                fontSize: 38,
                fontWeight: 800,
                color: "#facc15",
                letterSpacing: 6,
                marginTop: 4,
              }}
            >
              SOROCABA
            </span>
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h1
            style={{
              fontSize: 84,
              fontWeight: 800,
              letterSpacing: -3,
              lineHeight: 0.95,
              margin: 0,
              maxWidth: 1000,
            }}
          >
            Complete o álbum <br />
            <span style={{ color: "#facc15" }}>trocando com vizinho.</span>
          </h1>
          <p
            style={{
              fontSize: 26,
              fontWeight: 500,
              opacity: 0.9,
              margin: 0,
              maxWidth: 900,
            }}
          >
            Sorocaba · Votorantim · Araçoiaba · Piedade · Itapetininga · região
          </p>
        </div>

        {/* Bottom: bandeirinhas */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20, fontWeight: 600, opacity: 0.7 }}>
            Sediada por
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            {/* USA */}
            <div
              style={{
                width: 48,
                height: 32,
                background: "#bf0a30",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 14,
                color: "#fff",
              }}
            >
              USA
            </div>
            {/* CAN */}
            <div
              style={{
                width: 48,
                height: 32,
                background: "#d52b1e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 14,
                color: "#fff",
              }}
            >
              CAN
            </div>
            {/* MEX */}
            <div
              style={{
                width: 48,
                height: 32,
                background: "#006847",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 14,
                color: "#fff",
              }}
            >
              MEX
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
