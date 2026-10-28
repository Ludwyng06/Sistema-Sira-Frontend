import type { Metadata } from "next";
import { GuardiaSesion } from "@/components/GuardiaSesion";
import { PantallaConfiguracion } from "./pantalla-configuracion";

export const metadata: Metadata = { title: "Configuración" };

export default function Configuracion() {
  return (
    <GuardiaSesion roles={["ADMINISTRADOR"]}>
      <PantallaConfiguracion />
    </GuardiaSesion>
  );
}
