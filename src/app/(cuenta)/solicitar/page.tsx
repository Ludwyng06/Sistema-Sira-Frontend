import type { Metadata } from "next";
import { Suspense } from "react";
import { EstadoError } from "@/components/EstadoError";
import { Esqueleto, RegionCargando } from "@/components/Esqueleto";
import { enteroPositivo, listarEspacios, resolver, SEDE_PRINCIPAL } from "@/lib/inventario";
import { Asistente } from "./asistente";

export const metadata: Metadata = { title: "Solicitar un espacio" };

const unico = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default function Solicitar(props: PageProps<"/solicitar">) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-extrabold sm:text-4xl">Solicitar un espacio</h1>
      <Suspense
        fallback={
          <RegionCargando etiqueta="Cargando el asistente">
            <Esqueleto className="h-72 w-full" />
          </RegionCargando>
        }
      >
        <Contenido searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function Contenido({ searchParams }: { searchParams: PageProps<"/solicitar">["searchParams"] }) {
  const consulta = await searchParams;
  const r = await resolver(listarEspacios({ sede: SEDE_PRINCIPAL, porPagina: 100 }));
  if (!r.ok) return <EstadoError mensaje={r.mensaje} />;
  return (
    <Asistente
      espacios={r.datos.datos.map((e) => ({
        codigo: e.codigo,
        nombre: e.nombre,
        bloque: e.bloque.nombre,
        capacidad: e.capacidadPersonas,
      }))}
      espacioInicial={unico(consulta.espacio)?.toUpperCase()}
      borradorInicial={unico(consulta.borrador)}
      asistentesInicial={enteroPositivo(consulta.asistentes)}
    />
  );
}
