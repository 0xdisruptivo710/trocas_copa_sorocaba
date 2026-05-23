import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 7,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "#facc15",
            color: "#0f172a",
            fontSize: 12,
            fontWeight: 900,
            fontFamily: "sans-serif",
          }}
        >
          ⚽
        </div>
      </div>
    ),
    { ...size },
  );
}
