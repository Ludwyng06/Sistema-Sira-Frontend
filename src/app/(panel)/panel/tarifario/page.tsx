import type { Metadata } from "next";
import { GuardiaSesion } from "@/components/GuardiaSesion";
import { PantallaTarifario } from "./pantalla-tarifario";

export const metadata: Metadata = { title: "Tarifario" };

export default function Tarifario() {
  return (
    <GuardiaSesion roles={["ADMINISTRADOR"]}>
      <PantallaTarifario />
    </GuardiaSesion>
  );
}
