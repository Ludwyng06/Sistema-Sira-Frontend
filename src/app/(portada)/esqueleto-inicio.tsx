import { Esqueleto, RegionCargando } from "@/components/Esqueleto";

export function EsqueletoInicio() {
  return (
    <RegionCargando etiqueta="Cargando los bloques">
      <Esqueleto className="mb-4 h-9 w-64" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-gris-claro/60">
            <Esqueleto className="h-44 w-full rounded-none" />
            <div className="flex flex-col gap-3 p-5">
              <Esqueleto className="h-7 w-32" />
              <Esqueleto className="h-5 w-48" />
              <Esqueleto className="h-6 w-36" />
            </div>
          </div>
        ))}
      </div>
    </RegionCargando>
  );
}
