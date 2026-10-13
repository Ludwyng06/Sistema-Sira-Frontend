import { MarcoInstitucional } from "@/components/MarcoInstitucional";

export default function LayoutAuth({ children }: LayoutProps<"/">) {
  return <MarcoInstitucional>{children}</MarcoInstitucional>;
}
