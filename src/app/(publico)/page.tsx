import type { Metadata } from "next";
import { Suspense } from "react";
import { Search } from "lucide-react";
import { EstadoError } from "@/components/EstadoError";
import { EstadoVacio } from "@/components/EstadoVacio";
import { TarjetaBloque } from "@/components/TarjetaBloque";
import Link from "next/link";
import { TarjetaEspacio } from "@/components/TarjetaEspacio";
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
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold sm:text-4xl">
          Espacios de la sede Mocoa
        </h1>
        <p className="max-w-prose text-gris">
          Entra por el bloque donde quieres reservar, o cuéntanos para cuántas
          personas es tu evento y te mostramos los espacios donde caben.
        </p>
      </section>

      <Suspense fallback={<EsqueletoInicio />}>
        <Bloques searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function Bloques({
  searchParams,
}: {
  searchParams: PageProps<"/">["searchParams"];
}) {
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
      <form
        action="/"
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-lg border border-gris-claro bg-fondo-suave p-4"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="asistentes" className="font-medium">
            ¿Para cuántas personas es tu evento?
          </label>
          <input
            id="asistentes"
            name="asistentes"
            type="number"
            inputMode="numeric"
            min={1}
            defaultValue={asistentes}
            placeholder="Ej. 35"
            className="w-44 rounded border border-gris bg-fondo px-3 py-2"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded bg-azul px-4 py-2 font-medium text-white hover:bg-azul-oscuro"
        >
          <Search aria-hidden className="size-4" />
          Buscar espacios
        </button>
      </form>

      {!resultado.ok ? (
        <EstadoError mensaje={resultado.mensaje} />
      ) : resultado.datos.length === 0 ? (
        <EstadoVacio
          titulo="Aún no hay bloques en esta sede"
          mensaje="Cuando se registren los bloques de la sede aparecerán aquí."
        />
      ) : (
        <section aria-labelledby="titulo-bloques" className="flex flex-col gap-4">
          <h2 id="titulo-bloques" className="text-2xl font-bold">
            Bloques
          </h2>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {resultado.datos.map((bloque) => (
              <li key={bloque.codigo} className="flex">
                <div className="flex w-full flex-col">
                  <TarjetaBloque
                    bloque={bloque}
                    sede={SEDE_PRINCIPAL}
                    asistentes={asistentes}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {asistentes && espacios && (
        <section aria-labelledby="titulo-espacios" className="flex flex-col gap-4">
          <h2 id="titulo-espacios" className="text-2xl font-bold">
            Espacios para {asistentes} personas
          </h2>
          {!espacios.ok ? (
            <EstadoError mensaje={espacios.mensaje} />
          ) : espacios.datos.total === 0 ? (
            <EstadoVacio
              titulo="No hay espacios para esa cantidad de personas"
              mensaje={`No encontramos espacios en la sede donde quepan ${asistentes} personas. Prueba con un número menor.`}
              accion={{ href: "/", texto: "Quitar la búsqueda" }}
            />
          ) : (
            <>
              <p className="text-gris" aria-live="polite">
                {espacios.datos.total}{" "}
                {espacios.datos.total === 1 ? "espacio encontrado" : "espacios encontrados"}
                , del que mejor se ajusta al que más espacio deja.
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
    </>
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
  const clase = "rounded border border-azul px-4 py-2 font-medium text-azul-oscuro hover:bg-fondo-suave";
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
