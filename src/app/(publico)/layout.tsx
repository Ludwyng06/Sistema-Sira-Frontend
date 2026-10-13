import { MarcoInstitucional } from "@/components/MarcoInstitucional";

export default function LayoutPublico({ children }: LayoutProps<"/">) {
  return <MarcoInstitucional>{children}</MarcoInstitucional>;
}
