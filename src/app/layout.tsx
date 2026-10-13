import type { Metadata } from "next";
import { Raleway, Roboto } from "next/font/google";
import "./globals.css";

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SIRA · Uniputumayo",
    template: "%s · SIRA · Uniputumayo",
  },
  description:
    "Sistema de Inventario y Reserva de Activos de la Institución Universitaria del Putumayo.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${raleway.variable} ${roboto.variable}`}>
      <body className="flex min-h-dvh flex-col bg-fondo font-texto text-texto antialiased">
        {children}
      </body>
    </html>
  );
}
