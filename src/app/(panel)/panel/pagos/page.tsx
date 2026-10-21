import type { Metadata } from "next";
import { GuardiaSesion } from "@/components/GuardiaSesion";
import { PantallaPagos } from "./pantalla-pagos";

export const metadata: Metadata = { title: "Pagos" };

export default function Pagos() {
  return (
    <GuardiaSesion roles={["TESORERIA", "ADMINISTRADOR", "AUDITOR"]}>
      <PantallaPagos />
    </GuardiaSesion>
  );
}
