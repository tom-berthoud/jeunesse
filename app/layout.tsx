import type { Metadata, Viewport } from "next";
import { lireTheme } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "JCSD",
  description: "Présences de la Jeunesse de Châtel-St-Denis",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "JCSD", statusBarStyle: "black-translucent" },
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
