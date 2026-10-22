import { MarcoInstitucional } from "@/components/MarcoInstitucional";

/** La portada ocupa todo el ancho: cada sección pone su propio contenedor. */
export default function LayoutPortada({ children }: LayoutProps<"/">) {
  return <MarcoInstitucional completo>{children}</MarcoInstitucional>;
}
