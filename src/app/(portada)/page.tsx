import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, CalendarSearch, Search } from "lucide-react";
import { EstadoError } from "@/components/EstadoError";
import { EstadoVacio } from "@/components/EstadoVacio";
import { Contenedor } from "@/components/MarcoInstitucional";
import { TarjetaBloque } from "@/components/TarjetaBloque";
import { TarjetaEspacio } from "@/components/TarjetaEspacio";
import { BordeRasgado } from "@/components/marca/BordeRasgado";
import { EscenaCampus } from "@/components/marca/EscenaCampus";
import { Logo } from "@/components/marca/Logo";
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
  return (
    <>
      <Portada />
      <Contenedor className="flex flex-col gap-16 py-14">
        <Suspense fallback={<EsqueletoInicio />}>
          <Contenido searchParams={props.searchParams} />
        </Suspense>
      </Contenedor>
      <ComoFunciona />
    </>
  );
}

/** Lo primero que se ve: una pregunta, un campo y el sol del logo. */
function Portada() {
  return (
    <section aria-labelledby="titulo-portada" className="relative overflow-hidden bg-papel">
      <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.1fr)_minmax(0,0.95fr)]">
        <div className="hidden xl:block">
          <EscenaCampus />
        </div>
        <div className="anim-aparecer flex flex-col justify-center gap-6 px-4 py-12 sm:px-6 lg:py-20 lg:pl-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))] lg:pr-14 xl:pl-4 xl:pr-12">
          <p className="w-fit border-b-2 border-turquesa pb-1 font-titulo text-sm font-extrabold uppercase tracking-[0.2em] text-azul-oscuro">
            Sede Mocoa · Reserva de espacios
          </p>
          <h1
            id="titulo-portada"
            className="font-titulo text-5xl font-black leading-[0.95] tracking-tight text-tinta sm:text-6xl lg:text-7xl"
          >
            ¿Qué espacio
            <br />
            necesitas<span className="text-turquesa">?</span>
          </h1>
          <p className="max-w-md text-lg text-gris">
            Aulas, laboratorios, el auditorio y la cancha. Mira qué está libre y pídelo desde aquí, sin
            correos ni Excel.
          </p>
          <form action="/" method="get" className="flex max-w-lg flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 flex-col gap-1">
              <label htmlFor="asistentes" className="text-sm font-bold text-tinta">
                ¿Para cuántas personas es?
              </label>
              <input
                id="asistentes"
                name="asistentes"
                type="number"
                inputMode="numeric"
                min={1}
                placeholder="Ej. 35"
                className="w-full rounded-lg border-2 border-azul/40 bg-fondo px-4 py-3 text-lg transition-colors hover:border-azul focus:border-azul"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 self-end rounded-lg bg-azul px-6 py-3.5 text-lg font-bold text-white shadow-[0_2px_0_0_var(--color-azul-oscuro)] transition duration-200 hover:-translate-y-px hover:bg-azul-oscuro motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:w-auto"
            >
              <Search aria-hidden className="size-5" />
              Ver dónde caben
            </button>
          </form>
          <Link
            href="/buscar"
            className="inline-flex w-fit items-center gap-2 font-bold text-azul-oscuro underline decoration-turquesa decoration-2 underline-offset-4 hover:decoration-azul-oscuro"
          >
            <CalendarSearch aria-hidden className="size-5" />
            ¿Prefieres buscar por fecha y hora?
          </Link>
        </div>

        <div className="sobre-azul relative isolate flex min-h-[20rem] items-center justify-center bg-gradient-to-b from-turquesa via-azul to-azul-oscuro text-white lg:min-h-[34rem] lg:bg-gradient-to-r">
          <BordeRasgado
            ocupa="abajo"
            semilla={3}
            className="absolute inset-x-0 top-0 -translate-y-[calc(100%-1px)] text-turquesa lg:hidden"
          />
          <BordeRasgado
            orientacion="vertical"
            ocupa="derecha"
            semilla={5}
            className="absolute inset-y-0 -left-8 hidden text-turquesa sm:-left-12 lg:block"
          />
          <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
            <SolRadial className="absolute -right-24 -top-28 size-[30rem] opacity-[0.16]" />
            <SolRadial fase={1} className="absolute -bottom-44 -left-20 size-[24rem] opacity-[0.08]" />
          </div>
          <div className="flex flex-col items-center gap-7 px-8 py-14 text-center">
            <Logo variante="blanco" alto={150} titulo="Uniputumayo" prioridad className="anim-flotar drop-shadow-lg" />
            <p className="font-titulo text-3xl font-extrabold italic leading-tight sm:text-4xl">
              #Un Sueño
              <br />
              hecho <span className="font-black">Realidad</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

async function Contenido({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const consulta = await searchParams;
  const asistentes = enteroPositivo(consulta.asistentes);
  const pagina = enteroPositivo(consulta.pagina) ?? 1;
  const resultado = await resolver(listarBloques(SEDE_PRINCIPAL));
  const espacios = asistentes
    ? await resolver(
        listarEspacios({ sede: SEDE_PRINCIPAL, asistentes, pagina, porPagina: POR_PAGINA }),
      )
    : null;

  return (
    <>
      {asistentes && espacios && (
        <section aria-labelledby="titulo-espacios" className="flex flex-col gap-5">
          <h2 id="titulo-espacios" className="text-3xl font-black sm:text-4xl">
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
                {espacios.datos.total}{" "}
                {espacios.datos.total === 1 ? "espacio" : "espacios"}, del que mejor se ajusta al que más
                espacio deja.
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
        <section aria-labelledby="titulo-bloques" className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h2 id="titulo-bloques" className="text-3xl font-black sm:text-4xl">
              Entra por el bloque
            </h2>
            <p className="text-gris">Así está organizado el campus: elige el bloque y verás sus espacios por piso.</p>
          </div>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {resultado.datos.map((bloque, i) => (
              <li
                key={bloque.codigo}
                className={`anim-aparecer ${i === 1 ? "retardo-1" : i === 2 ? "retardo-2" : ""}`}
              >
                <TarjetaBloque bloque={bloque} sede={SEDE_PRINCIPAL} asistentes={asistentes} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

const PASOS = [
  {
    titulo: "Mira qué hay libre",
    texto: "Entra por el bloque o dinos cuántas personas son. El calendario muestra lo que ya está ocupado.",
  },
  {
    titulo: "Pídelo en cinco pasos",
    texto: "Eliges el horario, agregas lo que necesites y envías. Tu borrador se guarda solo.",
  },
  {
    titulo: "Te avisamos qué pasó",
    texto: "El responsable del espacio y la dependencia lo revisan. Si todo sale bien, queda reservado.",
  },
];

function ComoFunciona() {
  return (
    <section aria-labelledby="titulo-pasos" className="relative bg-papel">
      <BordeRasgado ocupa="arriba" semilla={9} className="-translate-y-[calc(100%-1px)] text-papel" />
      <Contenedor className="pb-6 pt-2">
        <h2 id="titulo-pasos" className="mb-8 text-3xl font-black sm:text-4xl">
          Así de simple
        </h2>
        <ol className="grid gap-8 md:grid-cols-3">
          {PASOS.map((p, i) => (
            <li key={p.titulo} className="relative flex flex-col gap-2 pl-1">
              <span
                aria-hidden
                className="font-titulo text-7xl font-black leading-none text-turquesa/40"
              >
                {i + 1}
              </span>
              <h3 className="text-xl font-extrabold">{p.titulo}</h3>
              <p className="text-gris">{p.texto}</p>
            </li>
          ))}
        </ol>
        <Link
          href="/ayuda"
          className="mt-8 inline-flex items-center gap-2 font-bold text-azul-oscuro underline decoration-turquesa decoration-2 underline-offset-4"
        >
          Más ayuda
          <ArrowRight aria-hidden className="size-4" />
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
    "rounded-lg border-2 border-azul px-4 py-2 font-bold text-azul-oscuro hover:bg-turquesa-suave";
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
