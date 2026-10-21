import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CalendarDays, ChevronLeft } from "lucide-react";
import { CalendarioEspacio } from "@/components/CalendarioEspacio";
import { EstadoError } from "@/components/EstadoError";
import { Foto } from "@/components/Foto";
import { IndicadorAforo } from "@/components/IndicadorAforo";
import { obtenerEspacio, resolver } from "@/lib/inventario";
import { pesos } from "@/lib/formato";
import { resolverEspacioId } from "@/lib/espacio-id";
import { EsqueletoEspacio } from "./esqueleto-espacio";

type Props = PageProps<"/espacios/[codigo]">;

const SOLICITANTES: Record<string, string> = {
  PERSONA_NATURAL: "Persona natural",
  EMPRESA: "Empresa",
  ENTIDAD: "Entidad",
};

const UNIDADES: Record<string, string> = {
  HORA: "por hora",
  DIA: "por día",
  JORNADA_MANANA: "por jornada de la mañana",
  JORNADA_TARDE: "por jornada de la tarde",
  JORNADA_NOCHE: "por jornada de la noche",
  EVENTO: "por evento",
  PERSONA: "por persona",
};

const etiqueta = (mapa: Record<string, string>, clave: string) =>
  mapa[clave] ?? clave.replaceAll("_", " ").toLowerCase();

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { codigo } = await params;
  return { title: `Espacio ${codigo.toUpperCase()}` };
}

export default function PaginaEspacio(props: Props) {
  return (
    <Suspense fallback={<EsqueletoEspacio />}>
      <FichaDelEspacio params={props.params} />
    </Suspense>
  );
}

async function FichaDelEspacio({ params }: { params: Props["params"] }) {
  const codigo = (await params).codigo.toUpperCase();
  const resultado = await resolver(obtenerEspacio(codigo));

  if (!resultado.ok) {
    return <EstadoError mensaje={resultado.mensaje} />;
  }
  const espacio = resultado.datos;
  const espacioId = await resolverEspacioId(espacio.codigo).catch(() => null);
  const volver = `/sedes/${espacio.sede.codigo}/bloques/${espacio.bloque.codigo}`;
  const fotos = espacio.fotos.map((f) => ({ url: f.urlDetalle, alt: f.alt }));

  return (
    <div className="flex flex-col gap-8">
      <Link
        href={volver}
        className="inline-flex w-fit items-center gap-1 text-azul-oscuro underline underline-offset-4"
      >
        <ChevronLeft aria-hidden className="size-4" />
        Volver a {espacio.bloque.nombre}
      </Link>

      <header className="flex flex-col gap-2">
        <p className="font-bold tracking-wide text-gris">
          {espacio.codigo} · {espacio.tipo.nombre.toLowerCase()} · piso{" "}
          {espacio.piso}
        </p>
        <h1 className="text-3xl font-extrabold sm:text-4xl">{espacio.nombre}</h1>
        <IndicadorAforo
          capacidad={espacio.capacidadPersonas}
          aforo={espacio.aforo}
          grande
        />
      </header>

      <section aria-labelledby="titulo-fotos" className="flex flex-col gap-3">
        <h2 id="titulo-fotos" className="text-2xl font-bold">
          Fotos
        </h2>
        {fotos.length === 0 ? (
          <Foto
            foto={null}
            className="h-48 w-full rounded-lg border border-gris-claro"
            marcador="Este espacio aún no tiene fotos"
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {fotos.map((f) => (
              <li key={f.url}>
                <Foto foto={f} className="h-48 w-full rounded-lg" />
              </li>
            ))}
          </ul>
        )}
      </section>

      {espacio.descripcion && (
        <p className="max-w-prose">{espacio.descripcion}</p>
      )}
      {espacio.condicionesUso && (
        <section aria-labelledby="titulo-condiciones" className="flex flex-col gap-2">
          <h2 id="titulo-condiciones" className="text-2xl font-bold">
            Condiciones de uso
          </h2>
          <p className="max-w-prose">{espacio.condicionesUso}</p>
        </section>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        <section aria-labelledby="titulo-dotacion" className="flex flex-col gap-3">
          <h2 id="titulo-dotacion" className="text-2xl font-bold">
            Dotación
          </h2>
          {espacio.elementos.length === 0 ? (
            <p className="text-gris">Este espacio no tiene dotación registrada.</p>
          ) : (
            <ul className="divide-y divide-gris-claro rounded-lg border border-gris-claro">
              {espacio.elementos.map((d) => (
                <li key={d.nombre} className="flex justify-between gap-4 px-4 py-2">
                  <span>{d.nombre}</span>
                  <span className="font-bold">
                    {d.cantidad}{" "}
                    <span className="font-normal text-gris">{d.unidad}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="titulo-tarifas" className="flex flex-col gap-3">
          <h2 id="titulo-tarifas" className="text-2xl font-bold">
            Tarifas
          </h2>
          {espacio.tarifas.length === 0 ? (
            <p className="text-gris">Las tarifas se confirman en la cotización.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gris-claro">
              <table className="w-full text-left">
                <caption className="sr-only">
                  Tarifas del espacio {espacio.codigo} por tipo de solicitante
                </caption>
                <thead className="bg-fondo-suave">
                  <tr>
                    <th scope="col" className="px-4 py-2">Solicitante</th>
                    <th scope="col" className="px-4 py-2">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gris-claro">
                  {espacio.tarifas.map((t) => (
                    <tr key={`${t.tipoSolicitante}-${t.unidad ?? ""}`}>
                      <th scope="row" className="px-4 py-2 font-medium">
                        {etiqueta(SOLICITANTES, t.tipoSolicitante)}
                      </th>
                      <td className="px-4 py-2">
                        {t.valor === 0 ? "Sin costo" : pesos(t.valor)}{" "}
                        <span className="text-gris">
                          {t.unidad ? etiqueta(UNIDADES, t.unidad) : ""}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <section aria-labelledby="titulo-calendario" className="flex flex-col gap-3">
        <h2 id="titulo-calendario" className="text-2xl font-bold">
          Disponibilidad
        </h2>
        {espacioId ? (
          <CalendarioEspacio espacioId={espacioId} />
        ) : (
          <p className="rounded-lg border border-dashed border-gris-claro bg-fondo-suave p-4 text-gris">
            No pudimos cargar el calendario de este espacio en este momento.
          </p>
        )}
        <Link
          href={`/solicitar?espacio=${espacio.codigo}`}
          className="inline-flex w-fit items-center gap-2 rounded bg-azul px-5 py-3 font-medium text-white hover:bg-azul-oscuro"
        >
          <CalendarDays aria-hidden className="size-5" />
          Solicitar este espacio
        </Link>
      </section>
    </div>
  );
}
