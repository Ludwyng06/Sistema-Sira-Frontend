import { Esqueleto, RegionCargando } from "@/components/Esqueleto";

export function EsqueletoEspacio() {
  return (
    <RegionCargando etiqueta="Cargando la ficha del espacio">
      <Esqueleto className="mb-6 h-5 w-40" />
      <Esqueleto className="mb-2 h-5 w-56" />
      <Esqueleto className="mb-3 h-10 w-80 max-w-full" />
      <Esqueleto className="mb-8 h-8 w-40" />
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Esqueleto className="h-48 w-full" />
        <Esqueleto className="hidden h-48 w-full sm:block" />
        <Esqueleto className="hidden h-48 w-full lg:block" />
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        <Esqueleto className="h-48 w-full" />
        <Esqueleto className="h-48 w-full" />
      </div>
    </RegionCargando>
  );
}
