import type { NextConfig } from "next";
import path from "node:path";

const securityHeaders = [
  // Força HTTPS por 2 anos. Subdomínios incluídos. Preload-ready.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Bloqueia clickjacking (iframe externo).
  { key: "X-Frame-Options", value: "DENY" },
  // Browser não tenta adivinhar MIME (previne XSS via Content-Type spoof).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Não vaza URL completa pra origens cruzadas.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Restringe APIs sensíveis a self.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), payment=(), usb=()",
  },
];

const nextConfig: NextConfig = {
  // Remove "x-powered-by: Next.js" — não vaza stack.
  poweredByHeader: false,
  turbopack: {
    root: path.resolve(__dirname),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
