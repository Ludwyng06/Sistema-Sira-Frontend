import type { Metadata } from "next";
import { EnConstruccion } from "@/components/EnConstruccion";

export const metadata: Metadata = { title: "Panel" };

export default function Panel() {
  return <EnConstruccion titulo="Panel de gestión" responsable="Jensen Ordóñez (panel)" />;
}
