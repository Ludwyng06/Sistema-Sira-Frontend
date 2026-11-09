"use client";

import { listarDependenciasPublicas } from "@/lib/dependencias";
import { useConsulta } from "@/lib/useConsulta";

/** Nombre (y código) de una dependencia a partir de su id, con el listado público. */
export function NombreDependencia({ id }: { id: string }) {
  const { resultado } = useConsulta(() => listarDependenciasPublicas(), []);
  if (resultado.estado !== "listo") return <span className="text-gris">Cargando…</span>;
  const dependencia = resultado.datos.find((d) => d.id === id);
  if (!dependencia) return <span className="text-gris">Dependencia no disponible</span>;
  return (
    <span>
      {dependencia.nombre} <span className="text-gris">· {dependencia.codigo}</span>
    </span>
  );
}
