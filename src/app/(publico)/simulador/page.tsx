import type { Metadata } from "next";
import { Suspense } from "react";
import { EstadoError } from "@/components/EstadoError";
import { Esqueleto, RegionCargando } from "@/components/Esqueleto";
import { listarEspacios, resolver, SEDE_PRINCIPAL } from "@/lib/inventario";
import { FormularioSimulador } from "./formulario-simulador";

export const metadata: Metadata = { title: "Simulador de tarifa" };

export default function Simulador() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold sm:text-4xl">Simulador de tarifa</h1>
        <p className="max-w-prose text-gris">
          Estima cuánto costaría alquilar un espacio, sin registrarte. El uso institucional no tiene
          costo.
        </p>
      </header>
      <Suspense
        fallback={
          <RegionCargando etiqueta="Cargando el simulador">
            <Esqueleto className="h-64 w-full" />
          </RegionCargando>
        }
      >
        <Contenido />
      </Suspense>
    </div>
  );
}

async function Contenido() {
  const r = await resolver(listarEspacios({ sede: SEDE_PRINCIPAL, porPagina: 100 }));
  if (!r.ok) return <EstadoError mensaje={r.mensaje} />;
  const espacios = r.datos.datos.map((e) => ({
    codigo: e.codigo,
    nombre: e.nombre,
    bloque: e.bloque.nombre,
  }));
  return <FormularioSimulador espacios={espacios} />;
}
