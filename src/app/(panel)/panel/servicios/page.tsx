import type { Metadata } from "next";
import { GuardiaSesion } from "@/components/GuardiaSesion";
import { PantallaServicios } from "./pantalla-servicios";

export const metadata: Metadata = { title: "Servicios y proveedores" };

export default function ServiciosPanel() {
  return (
    <GuardiaSesion roles={["ADMINISTRADOR"]}>
      <PantallaServicios />
    </GuardiaSesion>
  );
}
