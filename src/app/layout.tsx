import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SoloTodo AI - Asistente Consultivo de Armado de PC",
  description: "Cotizador inteligente de computadores con validación de compatibilidad de hardware en tiempo real y optimización de presupuesto para Chile.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-100 text-slate-900 antialiased flex flex-col">
        {children}
      </body>
    </html>
  );
}
