import type { Metadata } from "next";
import { GuardiaSesion } from "@/components/GuardiaSesion";
import { PantallaActas } from "./pantalla-actas";

export const metadata: Metadata = { title: "Actas" };

export default function Actas() {
  return (
    <GuardiaSesion roles={["RESPONSABLE_ESPACIO"]}>
      <PantallaActas />
    </GuardiaSesion>
  );
}
