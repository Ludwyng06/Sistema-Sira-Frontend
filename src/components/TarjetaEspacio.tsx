import Link from "next/link";
import clsx from "clsx";
import type { TarjetaEspacio as TipoTarjeta } from "@/lib/tipos";
import { pesos } from "@/lib/formato";
import { IndicadorAforo } from "./IndicadorAforo";
import { Foto } from "./Foto";

export function TarjetaEspacio({ espacio }: { espacio: TipoTarjeta }) {
  const noCabe = espacio.aforo?.nivel === "NO_CABE";
  return (
    <article
      className={clsx(
        "flex flex-col overflow-hidden rounded-campo border bg-fondo",
        noCabe
          ? "border-dashed border-gris-claro bg-fondo-suave"
          : "border-gris-claro shadow-sm",
      )}
    >
      <Foto foto={espacio.portada} className="h-32 w-full" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-base font-bold tracking-wide text-gris">
          {espacio.codigo} · {espacio.tipo.nombre.toLowerCase()}
        </p>
        <h4 className="text-lg font-bold">
          <Link href={`/espacios/${espacio.codigo}`} className="inline-block py-1 hover:underline">
            {espacio.nombre}
          </Link>
        </h4>
        <IndicadorAforo
          capacidad={espacio.capacidadPersonas}
          aforo={espacio.aforo}
        />
        {espacio.dotacion.length > 0 && (
          <ul className="text-base text-gris">
            {espacio.dotacion.map((d) => (
              <li key={d.nombre}>
                {d.cantidad} × {d.nombre}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-auto pt-2 text-base">
          {espacio.tarifaDesde !== null ? (
            <>
              Desde <strong>{pesos(espacio.tarifaDesde)}</strong> por hora
            </>
          ) : (
            <span className="text-gris">Tarifa por confirmar</span>
          )}
        </p>
      </div>
    </article>
  );
}
