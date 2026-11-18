import { Esqueleto, RegionCargando } from "@/components/Esqueleto";

export function EsqueletoInicio() {
  return (
    <RegionCargando etiqueta="Cargando los bloques">
      <Esqueleto className="mb-6 h-9 w-64" />
      <div className="flex flex-col">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-6 border-b border-gris-claro/60 py-5">
            <Esqueleto className="size-14 shrink-0" />
            <div className="flex w-full flex-col gap-2">
              <Esqueleto className="h-7 w-40" />
              <Esqueleto className="h-5 w-64 max-w-full" />
            </div>
          </div>
        ))}
      </div>
    </RegionCargando>
  );
}
