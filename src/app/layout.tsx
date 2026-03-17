import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SGRT — Sistema de Gestión de Trámites Regulatorios",
  description: "Gestión integral de trámites regulatorios ante ANMAT, INAL, SENASA y más.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
