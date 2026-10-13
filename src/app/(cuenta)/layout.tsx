import { MarcoInstitucional } from "@/components/MarcoInstitucional";

export default function LayoutCuenta({ children }: LayoutProps<"/">) {
  return <MarcoInstitucional>{children}</MarcoInstitucional>;
}
