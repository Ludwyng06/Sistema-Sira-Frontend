import type { Metadata } from "next";
import { GuardiaSesion } from "@/components/GuardiaSesion";
import { PantallaConciliacion } from "./pantalla-conciliacion";

export const metadata: Metadata = { title: "Conciliación diaria" };

export default function Conciliacion() {
  return <GuardiaSesion roles={["TESORERIA", "ADMINISTRADOR"]}>
    <PantallaConciliacion />
  </GuardiaSesion>;
}
