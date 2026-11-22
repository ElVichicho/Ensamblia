import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ensamblia | Cotizador de PC para tu tienda",
  description: "Ensamblia ayuda a elegir componentes de PC según uso, presupuesto y compatibilidad. Demostración del cotizador para tiendas de tecnología.",
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
