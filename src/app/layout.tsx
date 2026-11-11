import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cotizador de computadores | SoloTodo",
  description: "Cotizador inteligente de computadores con validación de compatibilidad de hardware en tiempo real y optimización de presupuesto para Chile.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
