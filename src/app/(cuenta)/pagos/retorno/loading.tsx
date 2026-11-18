import { Esqueleto, RegionCargando } from "@/components/Esqueleto";

export default function CargandoRetornoPago() {
  return (
    <RegionCargando etiqueta="Cargando el estado del pago">
      <Esqueleto className="h-10 w-64" />
      <Esqueleto className="mt-5 h-40 w-full" />
    </RegionCargando>
  );
}
