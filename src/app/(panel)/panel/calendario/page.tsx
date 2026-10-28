import type { Metadata } from "next";
import { Suspense } from "react";
import { EstadoError } from "@/components/EstadoError";
import { GuardiaSesion } from "@/components/GuardiaSesion";
import { Esqueleto, RegionCargando } from "@/components/Esqueleto";
import { listarEspacios, resolver, SEDE_PRINCIPAL } from "@/lib/inventario";
import { PantallaBloqueos } from "./pantalla-bloqueos";

export const metadata: Metadata = { title: "Calendario y bloqueos" };

export default function Calendario() {
  return (
    <GuardiaSesion roles={["ADMINISTRADOR", "RESPONSABLE_ESPACIO"]}>
      <Suspense
        fallback={
          <RegionCargando etiqueta="Cargando el calendario">
            <Esqueleto className="h-64 w-full" />
          </RegionCargando>
        }
      >
        <Contenido />
      </Suspense>
    </GuardiaSesion>
  );
}

async function Contenido() {
  const r = await resolver(listarEspacios({ sede: SEDE_PRINCIPAL, porPagina: 100 }));
  if (!r.ok) return <EstadoError mensaje={r.mensaje} />;
  return (
    <PantallaBloqueos
      espacios={r.datos.datos.map((e) => ({ codigo: e.codigo, nombre: e.nombre, bloque: e.bloque.nombre }))}
    />
  );
}
