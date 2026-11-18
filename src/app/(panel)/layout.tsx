import { GuardiaSesion } from "@/components/GuardiaSesion";
import { MarcoInstitucional } from "@/components/MarcoInstitucional";
import { MenuPanel } from "@/components/MenuPanel";

export default function LayoutPanel({ children }: LayoutProps<"/">) {
  return (
    <MarcoInstitucional>
      <GuardiaSesion soloPersonal>
        <div className="flex flex-col gap-6 md:flex-row md:gap-8">
          <MenuPanel />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </GuardiaSesion>
    </MarcoInstitucional>
  );
}
