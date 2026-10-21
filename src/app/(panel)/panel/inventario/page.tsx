import type { Metadata } from "next";
import { GuardiaSesion } from "@/components/GuardiaSesion";
import { PantallaInventario } from "./pantalla-inventario";

export const metadata: Metadata = { title: "Inventario" };

export default function Inventario() {
  return (
    <GuardiaSesion roles={["ADMINISTRADOR", "AUDITOR"]}>
      <PantallaInventario />
    </GuardiaSesion>
  );
}
