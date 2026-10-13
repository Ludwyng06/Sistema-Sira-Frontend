import { Esqueleto, RegionCargando } from "@/components/Esqueleto";

export function EsqueletoBloque() {
  return (
    <RegionCargando etiqueta="Cargando el bloque">
      <Esqueleto className="mb-6 h-5 w-40" />
      <Esqueleto className="mb-2 h-10 w-64" />
      <Esqueleto className="mb-8 h-5 w-32" />
      <Esqueleto className="mb-8 h-56 w-full" />
      <Esqueleto className="mb-8 h-20 w-full" />
      <Esqueleto className="mb-4 h-8 w-32" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="overflow-hidden rounded-lg border border-gris-claro">
            <Esqueleto className="h-32 w-full rounded-none" />
            <div className="flex flex-col gap-2 p-4">
              <Esqueleto className="h-4 w-32" />
              <Esqueleto className="h-6 w-48" />
              <Esqueleto className="h-6 w-28" />
              <Esqueleto className="h-4 w-36" />
            </div>
          </div>
        ))}
      </div>
    </RegionCargando>
  );
}
