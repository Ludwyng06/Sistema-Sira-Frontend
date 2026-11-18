import type { Metadata } from "next";
import { Montserrat, Raleway, Roboto } from "next/font/google";
import { Avisos } from "@/components/Avisos";
import { SesionProvider } from "@/components/SesionProvider";
import "./globals.css";

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  display: "swap",
});

/** Lo más parecido en Google Fonts al rótulo del logo (Heavitas, que no se puede usar como fuente web). */
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["800", "900"],
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
    <html lang="es" className={`${raleway.variable} ${roboto.variable} ${montserrat.variable}`}>
      <body className="flex min-h-dvh flex-col bg-fondo font-texto text-texto antialiased">
        <SesionProvider>{children}</SesionProvider>
        <Avisos />
      </body>
    </html>
  );
}
