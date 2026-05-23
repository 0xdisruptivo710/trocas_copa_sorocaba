import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#15803d",
          borderRadius: 40,
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 96,
            height: 96,
            borderRadius: "50%",
            background: "#facc15",
            fontSize: 70,
          }}
        >
          ⚽
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 18,
            color: "#fff",
            fontSize: 18,
            fontWeight: 800,
            fontFamily: "sans-serif",
            letterSpacing: 2,
          }}
        >
          2026
        </div>
      </div>
    ),
    { ...size },
  );
}
