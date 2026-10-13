import type { Metadata } from "next";
import { EnConstruccion } from "@/components/EnConstruccion";

export const metadata: Metadata = { title: "Ingresar" };

export default function Ingresar() {
  return <EnConstruccion titulo="Ingresar" responsable="Jensen Ordóñez (identidad)" />;
}
