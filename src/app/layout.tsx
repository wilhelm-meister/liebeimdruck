import type { Metadata } from "next";
import { Inter, Spectral } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spectral = Spectral({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-spectral",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LIEBE IM DRUCK – Kartenposter selbst gestalten",
  description: "Gestalte dein persönliches Karten-Poster auf Basis von OpenStreetMap – als hochauflösendes Bild oder druckfertiges Vektor-PDF.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={`${inter.variable} ${spectral.variable}`}>
      <body className="font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
