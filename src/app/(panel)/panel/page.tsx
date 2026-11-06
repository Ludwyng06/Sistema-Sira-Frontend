import type { Metadata } from "next";
import { GuardiaSesion } from "@/components/GuardiaSesion";
import { Tablero } from "./tablero";

export const metadata: Metadata = { title: "Tablero" };

export default function Panel() {
  return (
    <GuardiaSesion roles={["ADMINISTRADOR", "APROBADOR", "TESORERIA", "AUDITOR"]}>
      <Tablero />
    </GuardiaSesion>
  );
}
