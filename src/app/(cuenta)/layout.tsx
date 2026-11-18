import { GuardiaSesion } from "@/components/GuardiaSesion";
import { MarcoInstitucional } from "@/components/MarcoInstitucional";

export default function LayoutCuenta({ children }: LayoutProps<"/">) {
  return (
    <MarcoInstitucional>
      <GuardiaSesion>{children}</GuardiaSesion>
    </MarcoInstitucional>
  );
}
