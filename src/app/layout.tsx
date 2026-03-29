import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PlatfomLive — Videollamadas con tus favoritos",
  description: "Reserva una sesión de videollamada exclusiva con tus celebridades y talentos favoritos.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.className} animated-bg min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
