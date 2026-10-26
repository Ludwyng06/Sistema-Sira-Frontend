import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { CalendarDays, ChevronLeft } from "lucide-react";
import { CalendarioEspacio } from "@/components/CalendarioEspacio";
import { EstadoError } from "@/components/EstadoError";
import { Foto } from "@/components/Foto";
import { IndicadorAforo } from "@/components/IndicadorAforo";
import { BordeRasgado } from "@/components/marca/BordeRasgado";
import { IlustracionBloque } from "@/components/marca/IlustracionBloque";
import { SolDeHoras } from "@/components/marca/SolDeHoras";
import { SolRadial } from "@/components/marca/SolRadial";
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
  // La búsqueda del id depende de la fecha de hoy: se pide al atender la petición, no al prerenderizar.
  await connection();
  const espacioId = await resolverEspacioId(espacio.codigo).catch(() => null);
  const volver = `/sedes/${espacio.sede.codigo}/bloques/${espacio.bloque.codigo}`;
  const fotos = espacio.fotos.map((f) => ({ url: f.urlDetalle, alt: f.alt }));

  return (
    <div className="flex flex-col gap-8">
      <header className="sobre-azul relative isolate overflow-hidden rounded-tarjeta bg-gradient-to-br from-turquesa via-azul to-azul-oscuro text-white shadow-elevada">
        <div aria-hidden className="absolute inset-0 -z-10">
          <SolRadial className="absolute -right-16 -top-24 size-80 opacity-[0.16]" />
          <IlustracionBloque
            codigo={espacio.bloque.codigo}
            className="absolute bottom-0 right-6 hidden h-48 w-80 opacity-45 md:block"
          />
        </div>
        <div className="flex flex-col gap-5 px-6 pb-12 pt-6 sm:px-10 sm:pt-8">
          <Link
            href={volver}
            className="inline-flex w-fit items-center gap-1 font-medium text-white underline-offset-4 hover:underline"
          >
            <ChevronLeft aria-hidden className="size-4" />
            Volver a {espacio.bloque.nombre}
          </Link>
          <div className="flex flex-col gap-2">
            <p className="w-fit rounded-full bg-white/15 px-3 py-1 text-base font-bold tracking-wide">
              {espacio.codigo} · {espacio.tipo.nombre.toLowerCase()} · piso {espacio.piso}
            </p>
            <h1 className="max-w-xl text-t1 font-black leading-[1.02] text-white">
              {espacio.nombre}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="rounded-tarjeta bg-white p-3 pr-5 text-tinta shadow-tarjeta">
              <IndicadorAforo capacidad={espacio.capacidadPersonas} aforo={espacio.aforo} grande />
            </div>
            <Link
              href={`/solicitar?espacio=${espacio.codigo}`}
              className="inline-flex items-center gap-2 rounded-campo bg-white px-5 py-3 font-bold text-azul-oscuro transition duration-200 hover:-translate-y-px hover:bg-turquesa-suave motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <CalendarDays aria-hidden className="size-5" />
              Solicitar este espacio
            </Link>
          </div>
        </div>
        <BordeRasgado ocupa="abajo" tamano="fino" semilla={espacio.codigo.charCodeAt(2)} className="absolute inset-x-0 bottom-0 text-fondo" />
      </header>

      {fotos.length > 0 && (
        <section aria-labelledby="titulo-fotos" className="flex flex-col gap-3">
          <h2 id="titulo-fotos" className="text-2xl font-black">
            Fotos
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {fotos.map((f) => (
              <li key={f.url}>
                <Foto foto={f} className="h-48 w-full rounded-tarjeta" />
              </li>
            ))}
          </ul>
        </section>
      )}

      {espacio.descripcion && (
        <p className="max-w-prose text-lg text-gris">{espacio.descripcion}</p>
      )}
      {espacio.condicionesUso && (
        <section aria-labelledby="titulo-condiciones" className="flex flex-col gap-2">
          <h2 id="titulo-condiciones" className="text-2xl font-black">
            Condiciones de uso
          </h2>
          <p className="max-w-prose">{espacio.condicionesUso}</p>
        </section>
      )}

      {espacio.horarios.length > 0 && (
        <section aria-labelledby="titulo-horarios" className="flex flex-col gap-3">
          <h2 id="titulo-horarios" className="text-2xl font-black">
            ¿A qué horas está abierto?
          </h2>
          <SolDeHoras horarios={espacio.horarios} />
        </section>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        <section aria-labelledby="titulo-dotacion" className="flex flex-col gap-3">
          <h2 id="titulo-dotacion" className="text-2xl font-black">
            Dotación
          </h2>
          {espacio.elementos.length === 0 ? (
            <p className="text-gris">Este espacio no tiene dotación registrada.</p>
          ) : (
            <ul className="divide-y divide-gris-claro rounded-campo border border-gris-claro">
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
          <h2 id="titulo-tarifas" className="text-2xl font-black">
            Tarifas
          </h2>
          {espacio.tarifas.length === 0 ? (
            <p className="text-gris">Las tarifas se confirman en la cotización.</p>
          ) : (
            <div className="overflow-x-auto rounded-campo border border-gris-claro">
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
        <h2 id="titulo-calendario" className="text-2xl font-black">
          Disponibilidad
        </h2>
        {espacioId ? (
          <CalendarioEspacio espacioId={espacioId} />
        ) : (
          <p className="rounded-campo border border-dashed border-gris-claro bg-fondo-suave p-4 text-gris">
            No pudimos cargar el calendario de este espacio en este momento.
          </p>
        )}
        <Link
          href={`/solicitar?espacio=${espacio.codigo}`}
          className="inline-flex w-fit items-center gap-2 rounded-campo bg-azul px-5 py-3 font-bold text-white shadow-[0_2px_0_0_var(--color-azul-oscuro)] transition duration-200 hover:-translate-y-px hover:bg-azul-oscuro motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        >
          <CalendarDays aria-hidden className="size-5" />
          Solicitar este espacio
        </Link>
      </section>
    </div>
  );
}
