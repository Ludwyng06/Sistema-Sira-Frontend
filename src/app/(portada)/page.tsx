import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Check, CalendarSearch, Search } from "lucide-react";
import { EstadoError } from "@/components/EstadoError";
import { EstadoVacio } from "@/components/EstadoVacio";
import { FilaBloque } from "@/components/FilaBloque";
import { Contenedor } from "@/components/MarcoInstitucional";
import { TarjetaEspacio } from "@/components/TarjetaEspacio";
import { BordeRasgado } from "@/components/marca/BordeRasgado";
import { PlanoCampus } from "@/components/marca/PlanoCampus";
import { SolRadial } from "@/components/marca/SolRadial";
import {
  enteroPositivo,
  listarBloques,
  listarEspacios,
  resolver,
  SEDE_PRINCIPAL,
} from "@/lib/inventario";
import { EsqueletoInicio } from "./esqueleto-inicio";

export const metadata: Metadata = { title: "Inicio" };

const POR_PAGINA = 24;

export default function Inicio(props: PageProps<"/">) {
  // Una sola consulta de bloques para el plano y para la lista.
  const bloques = resolver(listarBloques(SEDE_PRINCIPAL));
  return (
    <>
      <Portada bloques={bloques} searchParams={props.searchParams} />
      <Contenedor className="flex flex-col gap-16 py-12 lg:py-20">
        <Suspense fallback={<EsqueletoInicio />}>
          <Contenido bloques={bloques} searchParams={props.searchParams} />
        </Suspense>
      </Contenedor>
      <ComoFunciona />
    </>
  );
}

type Bloques = ReturnType<typeof resolver<Awaited<ReturnType<typeof listarBloques>>>>;

/** Lo primero que se ve: una pregunta, un campo y el plano del campus. */
function Portada({
  bloques,
  searchParams,
}: {
  bloques: Bloques;
  searchParams: PageProps<"/">["searchParams"];
}) {
  return (
    <section aria-labelledby="titulo-portada" className="relative bg-papel">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className="anim-aparecer flex flex-col justify-center gap-6 px-4 py-12 sm:px-6 lg:py-20 lg:pl-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))] lg:pr-12">
          <p className="w-fit border-b-2 border-turquesa pb-1 font-titulo text-meta font-extrabold uppercase tracking-[0.18em] text-azul-oscuro">
            Sede Mocoa · Reserva de espacios
          </p>
          <h1 id="titulo-portada" className="font-titulo text-display font-black tracking-tight text-tinta">
            ¿Qué espacio
            <br />
            necesitas<span className="text-turquesa">?</span>
          </h1>
          <p className="max-w-md text-lg text-gris">
            Aulas, laboratorios, el auditorio y la cancha. Mira qué está libre y pídelo desde aquí, sin correos
            ni Excel.
          </p>
          <form action="/" method="get" className="flex max-w-lg flex-col gap-3">
            <label htmlFor="asistentes" className="font-bold text-tinta">
              ¿Para cuántas personas es?
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="asistentes"
                name="asistentes"
                type="number"
                inputMode="numeric"
                min={1}
                placeholder="Ej. 35"
                className="min-h-12 w-full rounded-campo border-2 border-azul/40 bg-fondo px-4 text-lg transition-colors hover:border-azul focus:border-azul sm:w-44"
              />
              <button
                type="submit"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-campo bg-azul px-6 text-lg font-bold text-white shadow-boton transition duration-200 hover:-translate-y-px hover:bg-azul-oscuro motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                <Search aria-hidden className="size-5" />
                Ver espacios donde caben
              </button>
            </div>
          </form>
          <Link
            href="/buscar"
            className="inline-flex min-h-11 w-fit items-center gap-2 font-bold text-azul-oscuro underline decoration-turquesa decoration-2 underline-offset-4 hover:decoration-azul-oscuro"
          >
            <CalendarSearch aria-hidden className="size-5" />
            ¿Prefieres buscar por fecha y hora?
          </Link>
        </div>

        <div className="sobre-azul relative isolate bg-gradient-to-b from-azul to-azul-oscuro px-4 pb-10 pt-12 text-white sm:px-8 lg:bg-gradient-to-r lg:py-16 lg:pl-16 lg:pr-[max(2rem,calc((100vw-72rem)/2+1.5rem))]">
          <BordeRasgado
            ocupa="abajo"
            semilla={3}
            className="absolute inset-x-0 top-0 -translate-y-[calc(100%-1px)] text-azul lg:hidden"
          />
          <BordeRasgado
            orientacion="vertical"
            ocupa="derecha"
            semilla={5}
            className="absolute inset-y-0 -left-8 hidden text-azul sm:-left-12 lg:block"
          />
          <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
            <SolRadial className="absolute -right-20 -top-24 size-[26rem] opacity-[0.12]" />
            <SolRadial fase={1} className="absolute -bottom-40 -left-16 size-80 opacity-[0.06]" />
          </div>
          <div className="mx-auto max-w-[40rem]">
            <Suspense fallback={<PlanoCampus sede={SEDE_PRINCIPAL} />}>
              <PlanoConDatos bloques={bloques} searchParams={searchParams} />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
}

async function PlanoConDatos({
  bloques,
  searchParams,
}: {
  bloques: Bloques;
  searchParams: PageProps<"/">["searchParams"];
}) {
  const consulta = await searchParams;
  const resultado = await bloques;
  return (
    <PlanoCampus
      sede={SEDE_PRINCIPAL}
      bloques={resultado.ok ? resultado.datos : undefined}
      asistentes={enteroPositivo(consulta.asistentes)}
    />
  );
}

async function Contenido({
  bloques,
  searchParams,
}: {
  bloques: Bloques;
  searchParams: PageProps<"/">["searchParams"];
}) {
  const consulta = await searchParams;
  const asistentes = enteroPositivo(consulta.asistentes);
  const pagina = enteroPositivo(consulta.pagina) ?? 1;
  const resultado = await bloques;
  const espacios = asistentes
    ? await resolver(listarEspacios({ sede: SEDE_PRINCIPAL, asistentes, pagina, porPagina: POR_PAGINA }))
    : null;

  return (
    <>
      {asistentes && espacios && (
        <section aria-labelledby="titulo-espacios" className="flex flex-col gap-5">
          <h2 id="titulo-espacios" className="text-t2 font-black">
            Espacios para {asistentes} personas
          </h2>
          {!espacios.ok ? (
            <EstadoError mensaje={espacios.mensaje} />
          ) : espacios.datos.total === 0 ? (
            <EstadoVacio
              titulo="No hay espacios para tantas personas"
              mensaje={`En la sede no hay un espacio donde quepan ${asistentes}. Prueba con un número menor.`}
              accion={{ href: "/", texto: "Quitar la búsqueda" }}
            />
          ) : (
            <>
              <p className="text-gris" aria-live="polite">
                {espacios.datos.total} {espacios.datos.total === 1 ? "espacio" : "espacios"}, del que mejor se
                ajusta al que más espacio deja.
              </p>
              <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {espacios.datos.datos.map((e) => (
                  <li key={e.codigo} className="flex flex-col">
                    <TarjetaEspacio espacio={e} />
                  </li>
                ))}
              </ul>
              <Paginacion
                asistentes={asistentes}
                pagina={espacios.datos.pagina}
                total={espacios.datos.total}
                porPagina={espacios.datos.porPagina}
              />
            </>
          )}
        </section>
      )}

      {!resultado.ok ? (
        <EstadoError mensaje={resultado.mensaje} />
      ) : resultado.datos.length === 0 ? (
        <EstadoVacio
          titulo="Aún no hay bloques en esta sede"
          mensaje="Cuando se registren los bloques de la sede aparecerán aquí."
        />
      ) : (
        <section aria-labelledby="titulo-bloques" className="flex flex-col gap-2">
          <h2 id="titulo-bloques" className="text-t2 font-black">
            Entra por el bloque
          </h2>
          <p className="text-gris">Elige el bloque y verás sus espacios por piso.</p>
          <ul className="mt-4 border-t border-gris-claro/60">
            {resultado.datos.map((bloque) => (
              <li key={bloque.codigo}>
                <FilaBloque bloque={bloque} sede={SEDE_PRINCIPAL} asistentes={asistentes} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

const PASOS = [
  { titulo: "Mira qué hay libre", texto: "Entra por el bloque o dinos cuántas personas son. El calendario muestra lo ocupado." },
  { titulo: "Pídelo en cinco pasos", texto: "Eliges el horario, agregas lo que necesites y envías. Tu borrador se guarda solo." },
  { titulo: "Te avisamos qué pasó", texto: "El responsable del espacio y la dependencia lo revisan. Si todo sale bien, queda reservado." },
];

/** Tres estaciones: la misma línea de metro que después acompaña el asistente. */
function ComoFunciona() {
  return (
    <section aria-labelledby="titulo-pasos" className="relative bg-papel">
      <BordeRasgado ocupa="arriba" semilla={9} className="-translate-y-[calc(100%-1px)] text-papel" />
      <Contenedor className="pb-10 pt-2">
        <h2 id="titulo-pasos" className="mb-10 text-t2 font-black">
          Así de simple
        </h2>
        <ol className="grid gap-8 md:grid-cols-3 md:gap-6">
          {PASOS.map((p, i) => (
            <li
              key={p.titulo}
              className="relative flex flex-col gap-2 pl-14 before:absolute before:left-4 before:top-10 before:-bottom-8 before:w-0.5 before:bg-azul/30 last:before:hidden md:pl-0 md:pt-14 md:before:left-10 md:before:right-[-1.5rem] md:before:top-4 md:before:h-0.5 md:before:w-auto md:before:bottom-auto"
            >
              <span
                aria-hidden
                className={
                  i === PASOS.length - 1
                    ? "absolute left-0 top-0 flex size-9 items-center justify-center rounded-full bg-azul text-white"
                    : "absolute left-0 top-0 flex size-9 items-center justify-center rounded-full border-2 border-azul bg-fondo font-bold text-azul-oscuro"
                }
              >
                {i === PASOS.length - 1 ? <Check className="size-5" /> : i + 1}
              </span>
              <h3 className="text-xl font-extrabold">
                <span className="sr-only">Paso {i + 1}: </span>
                {p.titulo}
              </h3>
              <p className="text-gris">{p.texto}</p>
            </li>
          ))}
        </ol>
        <Link
          href="/ayuda"
          className="mt-8 inline-flex min-h-11 items-center font-bold text-azul-oscuro underline decoration-turquesa decoration-2 underline-offset-4"
        >
          Cómo funciona, paso a paso
        </Link>
      </Contenedor>
    </section>
  );
}

function Paginacion({
  asistentes,
  pagina,
  total,
  porPagina,
}: {
  asistentes: number;
  pagina: number;
  total: number;
  porPagina: number;
}) {
  const paginas = Math.ceil(total / porPagina);
  if (paginas <= 1) return null;
  const enlace = (n: number) => `/?asistentes=${asistentes}&pagina=${n}`;
  const clase =
    "inline-flex min-h-11 items-center rounded-campo border-2 border-azul px-4 font-bold text-azul-oscuro hover:bg-turquesa-suave";
  return (
    <nav aria-label="Paginación de espacios" className="flex flex-wrap items-center gap-4">
      {pagina > 1 && (
        <Link href={enlace(pagina - 1)} className={clase}>
          Anterior
        </Link>
      )}
      <p>
        Página {pagina} de {paginas}
      </p>
      {pagina < paginas && (
        <Link href={enlace(pagina + 1)} className={clase}>
          Siguiente
        </Link>
      )}
    </nav>
  );
}
