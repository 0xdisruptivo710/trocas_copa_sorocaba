import type { Metadata, Viewport } from "next";
import { Inter, Bricolage_Grotesque } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { CelebrateLayer } from "@/components/motion/celebrate";
import "./globals.css";

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Trocas Copa Sorocaba — Álbum da Copa 2026",
    template: "%s · Trocas Copa Sorocaba",
  },
  description:
    "Complete seu álbum Panini da Copa 2026 sem repetir sozinho. Encontre colecionadores em Sorocaba, Votorantim, Araçoiaba, Piedade, Itapetininga e região, e troque figurinhas direto pelo app.",
  manifest: "/manifest.webmanifest",
  applicationName: "Trocas Copa Sorocaba",
  appleWebApp: {
    capable: true,
    title: "Trocas Copa Sorocaba",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    type: "website",
    siteName: "Trocas Copa Sorocaba",
    locale: "pt_BR",
    title: "Trocas Copa Sorocaba — Álbum da Copa 2026",
    description:
      "Complete seu álbum Panini da Copa 2026 em Sorocaba e região. Encontre colecionadores perto, troque figurinhas, viva a Copa.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trocas Copa Sorocaba — Álbum da Copa 2026",
    description:
      "Complete seu álbum Panini da Copa 2026. Encontre colecionadores em Sorocaba e região.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#15803d" },
    { media: "(prefers-color-scheme: dark)", color: "#1b1330" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${sans.variable} ${display.variable} h-full antialiased`}
    >
      <body
        className="min-h-dvh bg-background font-sans text-foreground"
        suppressHydrationWarning
      >
        {children}
        <CelebrateLayer />
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
