import type { Metadata } from "next";
import "./globals.css";
import "./pulso.css";

export const metadata: Metadata = {
  title: "Ensamblia | Tu próximo PC, todo encaja",
  description: "Cotiza un PC compatible con tu presupuesto. Compara componentes entre una o varias tiendas con Ensamblia.",
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
