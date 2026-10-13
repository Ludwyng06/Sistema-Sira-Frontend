import { MarcoInstitucional } from "@/components/MarcoInstitucional";

export default function LayoutPanel({ children }: LayoutProps<"/">) {
  return <MarcoInstitucional>{children}</MarcoInstitucional>;
}
