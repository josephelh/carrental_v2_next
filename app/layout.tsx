import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AutoFleet — Gestion de flotte",
  description: "Tableau de bord de location de véhicules",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full" suppressHydrationWarning>
      <body className={`${inter.className} min-h-full flex flex-col font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
