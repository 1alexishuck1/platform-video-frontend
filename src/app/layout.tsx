import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

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
        <Toaster position="bottom-right" expand={false} richColors theme="dark" />
      </body>
    </html>
  );
}
