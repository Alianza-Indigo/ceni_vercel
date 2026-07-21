import type { Metadata } from "next";
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/400-italic.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://ceni.alianzaindigo.org"),
  title: {
    default: "CENI - Certificación de Entornos Neuroinclusivos",
    template: "%s · CENI",
  },
  description:
    "Plataforma oficial del programa CENI de Alianza Índigo Neurodivergente A.C. No necesitas PARECER para SER.",
  icons: {
    icon: [{ url: "/assets/favicon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: "CENI - Certificación de Entornos Neuroinclusivos",
    description: "No necesitas PARECER para SER.",
    images: ["/assets/og-image.png"],
  },
};

const calmModeInitScript = `
try {
  if (localStorage.getItem("ceni-calm") === "true") {
    document.documentElement.setAttribute("data-calm", "true");
  }
} catch (e) {}
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-MX">
      <head>
        <script dangerouslySetInnerHTML={{ __html: calmModeInitScript }} />
      </head>
      <body className="flex min-h-screen flex-col antialiased">
        <a href="#contenido-principal" className="skip-link">
          Ir al contenido principal
        </a>
        <SiteHeader />
        <main id="contenido-principal" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
