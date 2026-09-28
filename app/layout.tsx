import type { Metadata, Viewport } from "next";
import { lireTheme } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "JCSD",
  description: "Présences de la Jeunesse de Châtel-St-Denis",
  manifest: "/manifest.json",
  // Barre d'état opaque, pas black-translucent : en app installée sur iOS 26,
  // la vue web translucide est placée en haut de l'écran mais dimensionnée
  // comme si la barre était opaque (793 au lieu de 852 sur un iPhone 16) :
  // 59 pt noirs non affichables en bas, par-dessus la barre de navigation.
  appleWebApp: { capable: true, title: "JCSD", statusBarStyle: "black" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f6f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0b" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Thème lu côté serveur : la page arrive déjà dans le bon mode, sans flash.
  const theme = await lireTheme();
  return (
    <html lang="fr-CH" data-theme={theme === "system" ? undefined : theme} className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
