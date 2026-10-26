"use client";

import Link from "next/link";
import { useState } from "react";
import clsx from "clsx";
import { Esqueleto, RegionCargando } from "@/components/Esqueleto";
import { EstadoError } from "@/components/EstadoError";
import { EstadoVacio } from "@/components/EstadoVacio";
import { fecha } from "@/lib/formato";
import { listarSolicitudes } from "@/lib/solicitudes";
import { useConsulta } from "@/lib/useConsulta";

const PESTANAS = [
  { tipo: "ENTREGA", estado: "CONFIRMADA", texto: "Por entregar", accion: "Hacer acta de entrega" },
  { tipo: "DEVOLUCION", estado: "EN_USO", texto: "Por recibir", accion: "Hacer acta de devolución" },
] as const;

export function PantallaActas() {
  const [indice, setIndice] = useState(0);
  const pestana = PESTANAS[indice];
  const { resultado, recargar } = useConsulta(
    () => listarSolicitudes({ ambito: "BANDEJA", estado: pestana.estado, porPagina: 50 }),
    [pestana.estado],
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-4xl font-black sm:text-5xl">Actas</h1>
        <p className="text-gris">Entrega y devolución de los espacios y sus elementos.</p>
      </header>

      <div role="tablist" aria-label="Tipo de acta" className="flex flex-wrap gap-2">
        {PESTANAS.map((p, i) => (
          <button
            key={p.tipo}
            type="button"
            role="tab"
            aria-selected={indice === i}
            onClick={() => setIndice(i)}
            className={clsx(
              "rounded-campo px-4 py-2 font-medium",
              indice === i
                ? "bg-azul text-white"
                : "border border-gris-claro text-azul-oscuro hover:bg-fondo-suave",
            )}
          >
            {p.texto}
          </button>
        ))}
      </div>

      {resultado.estado === "cargando" && (
        <RegionCargando etiqueta="Cargando solicitudes">
          <Esqueleto className="h-24 w-full" />
        </RegionCargando>
      )}
      {resultado.estado === "error" && (
        <EstadoError mensaje={resultado.mensaje} alReintentar={recargar} />
      )}
      {resultado.estado === "listo" &&
        (resultado.datos.total === 0 ? (
          <EstadoVacio
            titulo="No hay actas pendientes"
            mensaje="Cuando una solicitud esté lista para entrega o devolución aparecerá aquí."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {resultado.datos.datos.map((s) => (
              <li
                key={s.id}
                className="flex flex-col gap-2 rounded-campo border border-gris-claro p-4 shadow-sm"
              >
                <p className="font-bold text-azul-oscuro">{s.consecutivo}</p>
                <p className="font-medium">{s.objetoEvento}</p>
                <p className="text-base text-gris">
                  {s.asistentesEstimados} personas · creada el {fecha(s.creadoEn)}
                </p>
                <Link
                  href={`/panel/actas/${s.id}?tipo=${pestana.tipo}`}
                  className="w-fit rounded-campo bg-azul px-5 py-2.5 font-bold text-white shadow-[0_2px_0_0_var(--color-azul-oscuro)] transition duration-200 hover:-translate-y-px hover:bg-azul-oscuro motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  {pestana.accion}
                </Link>
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}
