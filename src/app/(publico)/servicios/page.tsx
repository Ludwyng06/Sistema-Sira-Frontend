import type { Metadata } from "next";
import { Suspense } from "react";
import { EstadoError } from "@/components/EstadoError";
import { EstadoVacio } from "@/components/EstadoVacio";
import { Esqueleto, RegionCargando } from "@/components/Esqueleto";
import { resolver } from "@/lib/inventario";
import {
  CATEGORIAS,
  listarServicios,
  UNIDADES_COBRO,
  type CategoriaServicio,
  type Servicio,
} from "@/lib/servicios";

export const metadata: Metadata = { title: "Servicios complementarios" };

export default function PaginaServicios() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold sm:text-4xl">Servicios complementarios</h1>
        <p className="max-w-prose text-gris">
          Además del espacio, puedes pedir servicios para tu evento. Los eliges en el paso 2 de la
          solicitud y su valor se confirma en la cotización.
        </p>
      </header>
      <Suspense fallback={<EsqueletoServicios />}>
        <Catalogo />
      </Suspense>
    </div>
  );
}

async function Catalogo() {
  const resultado = await resolver(listarServicios());
  if (!resultado.ok) return <EstadoError mensaje={resultado.mensaje} />;
  if (resultado.datos.length === 0) {
    return (
      <EstadoVacio
        titulo="Aún no hay servicios publicados"
        mensaje="Cuando se registren servicios complementarios aparecerán aquí."
        accion={{ href: "/", texto: "Ver los espacios" }}
      />
    );
  }

  const porCategoria = new Map<CategoriaServicio, Servicio[]>();
  for (const s of resultado.datos) {
    porCategoria.set(s.categoria, [...(porCategoria.get(s.categoria) ?? []), s]);
  }

  return (
    <>
      {[...porCategoria.entries()].map(([categoria, servicios]) => (
        <section
          key={categoria}
          aria-labelledby={`categoria-${categoria}`}
          className="flex flex-col gap-4"
        >
          <h2 id={`categoria-${categoria}`} className="text-2xl font-bold">
            {CATEGORIAS[categoria]}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {servicios.map((s) => (
              <li
                key={s.id}
                className="flex flex-col gap-2 rounded-lg border border-gris-claro p-4 shadow-sm"
              >
                <h3 className="text-lg font-bold">{s.nombre}</h3>
                {s.descripcion && <p className="text-gris">{s.descripcion}</p>}
                <dl className="mt-auto grid gap-1 pt-2 text-sm">
                  <div className="flex gap-2">
                    <dt className="font-medium">Se cobra:</dt>
                    <dd>{UNIDADES_COBRO[s.unidadCobro]}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="font-medium">Pídelo con:</dt>
                    <dd>
                      {s.anticipacionMinimaDias}{" "}
                      {s.anticipacionMinimaDias === 1 ? "día" : "días"} de anticipación
                    </dd>
                  </div>
                  {s.requiereConfirmacion && (
                    <p className="w-fit rounded border-l-4 border-naranja bg-fondo-suave px-2 py-0.5">
                      El proveedor confirma la disponibilidad
                    </p>
                  )}
                </dl>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

function EsqueletoServicios() {
  return (
    <RegionCargando etiqueta="Cargando servicios">
      <div className="flex flex-col gap-4">
        <Esqueleto className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Esqueleto key={i} className="h-32" />
          ))}
        </div>
      </div>
    </RegionCargando>
  );
}
