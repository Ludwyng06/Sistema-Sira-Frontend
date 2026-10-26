import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft } from "lucide-react";
import { EstadoError } from "@/components/EstadoError";
import { EstadoVacio } from "@/components/EstadoVacio";
import { Foto } from "@/components/Foto";
import { TarjetaEspacio } from "@/components/TarjetaEspacio";
import { enteroPositivo, obtenerBloque, resolver } from "@/lib/inventario";
import { EsqueletoBloque } from "./esqueleto-bloque";

type Props = PageProps<"/sedes/[sede]/bloques/[bloque]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { bloque } = await params;
  return { title: `Bloque ${bloque.toUpperCase()}` };
}

export default function PaginaBloque(props: Props) {
  return (
    <Suspense fallback={<EsqueletoBloque />}>
      <ContenidoBloque params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}

async function ContenidoBloque({
  params,
  searchParams,
}: {
  params: Props["params"];
  searchParams: Props["searchParams"];
}) {
  const { sede: sedeParam, bloque: bloqueParam } = await params;
  const consulta = await searchParams;
  const sede = sedeParam.toUpperCase();
  const codigo = bloqueParam.toUpperCase();
  const asistentes = enteroPositivo(consulta.asistentes);
  const tipoPedido = Array.isArray(consulta.tipo) ? consulta.tipo[0] : consulta.tipo;

  const resultado = await resolver(obtenerBloque(sede, codigo, asistentes));

  const migas = (
    <Link
      href="/"
      className="inline-flex min-h-11 items-center gap-1 font-bold text-azul-oscuro underline underline-offset-4"
    >
      <ChevronLeft aria-hidden className="size-4" />
      Volver a los bloques
    </Link>
  );

  if (!resultado.ok) {
    return (
      <div className="flex flex-col gap-6">
        {migas}
        <EstadoError mensaje={resultado.mensaje} />
      </div>
    );
  }

  const bloque = resultado.datos;
  const tipo = bloque.tipos.some((t) => t.tipo === tipoPedido) ? tipoPedido : undefined;
  const pisos = bloque.pisos
    .map((p) => ({
      ...p,
      espacios: tipo ? p.espacios.filter((e) => e.tipo.codigo === tipo) : p.espacios,
    }))
    .filter((p) => p.espacios.length > 0);

  return (
    <div className="flex flex-col gap-8">
      {migas}
      <header className="flex flex-col gap-1">
        <h1 className="text-t1 font-black">
          Bloque {bloque.codigo}
        </h1>
        <p className="text-gris">Sede {bloque.sede.nombre}</p>
      </header>

      <section aria-labelledby="titulo-plano" className="flex flex-col gap-3">
        <h2 id="titulo-plano" className="text-2xl font-bold">
          Plano
        </h2>
        <Foto
          foto={
            bloque.planoUrl
              ? {
                  url: bloque.planoUrl,
                  alt: `Plano del bloque ${bloque.codigo} con la numeración de sus espacios`,
                }
              : null
          }
          className="h-56 w-full rounded-campo border border-gris-claro"
          marcador="El plano de este bloque aún no está disponible"
        />
      </section>

      <form
        action={`/sedes/${bloque.sede.codigo}/bloques/${bloque.codigo}`}
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-campo border border-gris-claro bg-fondo-suave p-4"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="tipo" className="font-medium">
            Tipo de espacio
          </label>
          <select
            id="tipo"
            name="tipo"
            defaultValue={tipo ?? ""}
            className="rounded-campo border border-gris/70 bg-fondo px-3.5 py-2.5 transition-colors hover:border-azul focus:border-azul"
          >
            <option value="">Todos</option>
            {bloque.tipos.map((t) => (
              <option key={t.tipo} value={t.tipo}>
                {t.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="asistentes" className="font-medium">
            Número de personas
          </label>
          <input
            id="asistentes"
            name="asistentes"
            type="number"
            inputMode="numeric"
            min={1}
            defaultValue={asistentes}
            placeholder="Ej. 35"
            className="w-40 rounded-campo border border-gris/70 bg-fondo px-3.5 py-2.5 transition-colors hover:border-azul focus:border-azul"
          />
        </div>
        <button
          type="submit"
          className="rounded-campo bg-azul px-5 py-2.5 font-bold text-white shadow-[0_2px_0_0_var(--color-azul-oscuro)] transition duration-200 hover:-translate-y-px hover:bg-azul-oscuro motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        >
          Aplicar filtros
        </button>
      </form>

      {pisos.length === 0 ? (
        <EstadoVacio
          titulo={
            tipo || asistentes
              ? "Ningún espacio coincide con tu búsqueda"
              : "Aún no hay espacios en este bloque"
          }
          mensaje={
            tipo || asistentes
              ? "Prueba con otro tipo de espacio o con un número de personas distinto."
              : "Cuando se registren los espacios del bloque aparecerán aquí."
          }
          accion={
            tipo || asistentes
              ? {
                  href: `/sedes/${bloque.sede.codigo}/bloques/${bloque.codigo}`,
                  texto: "Quitar filtros",
                }
              : undefined
          }
        />
      ) : (
        pisos.map((p) => (
          <section
            key={p.piso}
            aria-labelledby={`piso-${p.piso}`}
            className="flex flex-col gap-4"
          >
            <h2 id={`piso-${p.piso}`} className="text-2xl font-bold">
              Piso {p.piso}
            </h2>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {p.espacios.map((e) => (
                <li key={e.codigo} className="flex flex-col">
                  <TarjetaEspacio espacio={e} />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
