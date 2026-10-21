import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Search } from "lucide-react";
import { EstadoError } from "@/components/EstadoError";
import { EstadoVacio } from "@/components/EstadoVacio";
import { IndicadorAforo } from "@/components/IndicadorAforo";
import { Esqueleto, RegionCargando } from "@/components/Esqueleto";
import { api } from "@/lib/api";
import type { components } from "@/lib/contrato";
import { enteroPositivo, resolver } from "@/lib/inventario";

export const metadata: Metadata = { title: "Buscar por fecha y hora" };

type Resultado = components["schemas"]["ResultadoBusquedaDto"];

const unico = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default function Buscar(props: PageProps<"/buscar">) {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold sm:text-4xl">Buscar por fecha y hora</h1>
        <p className="max-w-prose text-gris">
          Dinos cuándo es tu evento y cuántas personas van. Te mostramos los espacios libres donde
          caben, del que mejor se ajusta al que más espacio deja.
        </p>
      </header>
      <Suspense
        fallback={
          <RegionCargando etiqueta="Cargando la búsqueda">
            <Esqueleto className="h-40 w-full" />
          </RegionCargando>
        }
      >
        <Contenido searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function Contenido({ searchParams }: { searchParams: PageProps<"/buscar">["searchParams"] }) {
  const consulta = await searchParams;
  const fecha = unico(consulta.fecha);
  const horaInicio = unico(consulta.horaInicio);
  const horaFin = unico(consulta.horaFin);
  const asistentes = enteroPositivo(consulta.asistentes);
  const completa = Boolean(fecha && horaInicio && horaFin && asistentes);

  const resultado = completa
    ? await resolver(
        api<Resultado>("/disponibilidad/buscar", {
          query: { fecha, horaInicio, horaFin, asistentes },
        }),
      )
    : null;

  const campo = "rounded border border-gris bg-fondo px-3 py-2";
  return (
    <>
      <form
        action="/buscar"
        method="get"
        className="flex flex-wrap items-end gap-4 rounded-lg border border-gris-claro bg-fondo-suave p-4"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="fecha" className="font-medium">Día</label>
          <input id="fecha" name="fecha" type="date" required defaultValue={fecha} className={campo} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="horaInicio" className="font-medium">Desde</label>
          <input id="horaInicio" name="horaInicio" type="time" required defaultValue={horaInicio ?? "08:00"} className={campo} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="horaFin" className="font-medium">Hasta</label>
          <input id="horaFin" name="horaFin" type="time" required defaultValue={horaFin ?? "12:00"} className={campo} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="asistentes" className="font-medium">Personas</label>
          <input id="asistentes" name="asistentes" type="number" min={1} inputMode="numeric" required defaultValue={asistentes} placeholder="Ej. 60" className={`${campo} w-28`} />
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded bg-azul px-4 py-2 font-medium text-white hover:bg-azul-oscuro"
        >
          <Search aria-hidden className="size-4" />
          Buscar
        </button>
      </form>

      {resultado &&
        (!resultado.ok ? (
          <EstadoError mensaje={resultado.mensaje} />
        ) : resultado.datos.total === 0 ? (
          <EstadoVacio
            titulo="No hay espacios libres en ese horario"
            mensaje="Prueba con otro horario, otro día o menos personas."
          />
        ) : (
          <section aria-labelledby="titulo-resultados" className="flex flex-col gap-4">
            <h2 id="titulo-resultados" className="text-2xl font-bold">
              {resultado.datos.total}{" "}
              {resultado.datos.total === 1 ? "espacio libre" : "espacios libres"}
            </h2>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {resultado.datos.espacios.map((e) => (
                <li
                  key={e.codigo}
                  className="flex flex-col gap-2 rounded-lg border border-gris-claro p-4 shadow-sm"
                >
                  <p className="text-sm font-bold tracking-wide text-gris">
                    {e.codigo} · {e.bloque.nombre} · piso {e.piso}
                  </p>
                  <h3 className="text-lg font-bold">
                    <Link href={`/espacios/${e.codigo}`} className="inline-block py-1 hover:underline">
                      {e.nombre}
                    </Link>
                  </h3>
                  <IndicadorAforo capacidad={e.capacidadPersonas} aforo={e.aforo} />
                </li>
              ))}
            </ul>
          </section>
        ))}
    </>
  );
}
