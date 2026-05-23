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
    default: "TrocasCopa — Álbum da Copa 2026",
    template: "%s · TrocasCopa",
  },
  description:
    "Complete seu álbum Panini da Copa 2026 sem repetir sozinho. Encontre colecionadores perto, troque figurinhas e viva a Copa.",
  manifest: "/manifest.webmanifest",
  applicationName: "TrocasCopa",
  appleWebApp: {
    capable: true,
    title: "TrocasCopa",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    type: "website",
    siteName: "TrocasCopa",
    locale: "pt_BR",
    title: "TrocasCopa — Álbum da Copa 2026",
    description:
      "Complete seu álbum Panini da Copa 2026. Encontre colecionadores perto, troque figurinhas, viva a Copa.",
  },
  twitter: {
    card: "summary_large_image",
    title: "TrocasCopa — Álbum da Copa 2026",
    description:
      "Complete seu álbum Panini da Copa 2026. Encontre colecionadores perto e troque.",
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
