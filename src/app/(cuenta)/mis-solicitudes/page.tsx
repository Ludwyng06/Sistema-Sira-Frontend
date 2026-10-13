import type { Metadata } from "next";
import { EnConstruccion } from "@/components/EnConstruccion";

export const metadata: Metadata = { title: "Mis solicitudes" };

export default function MisSolicitudes() {
  return (
    <EnConstruccion titulo="Mis solicitudes" responsable="Isabel Cerón (mis solicitudes)" />
  );
}
