import type { Metadata } from "next";
import { GuardiaSesion } from "@/components/GuardiaSesion";
import { PantallaBitacora } from "./pantalla-bitacora";

export const metadata: Metadata = { title: "Bitácora" };

export default function Bitacora() {
  return (
    <GuardiaSesion roles={["ADMINISTRADOR", "AUDITOR"]}>
      <PantallaBitacora />
    </GuardiaSesion>
  );
}
