"use client";

import Link from "next/link";
import { useState } from "react";
import clsx from "clsx";
import { Esqueleto, RegionCargando } from "@/components/Esqueleto";
import { EstadoError } from "@/components/EstadoError";
import { EstadoVacio } from "@/components/EstadoVacio";
import { Paginador } from "@/components/ListaSolicitudes";
import { fecha, hora } from "@/lib/formato";
import { listarNotificaciones, marcarLeida } from "@/lib/notificaciones";
import { useConsulta } from "@/lib/useConsulta";

const POR_PAGINA = 20;

export function CentroNotificaciones() {
  const [soloNoLeidas, setSoloNoLeidas] = useState(false);
  const [pagina, setPagina] = useState(1);
  const { resultado, recargar } = useConsulta(
    () => listarNotificaciones({ soloNoLeidas: soloNoLeidas || undefined, pagina, porPagina: POR_PAGINA }),
    [soloNoLeidas, pagina],
  );

  async function leer(id: string) {
    try {
      await marcarLeida(id);
    } finally {
      recargar();
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <label className="flex w-fit items-center gap-2 font-medium">
        <input
          type="checkbox"
          checked={soloNoLeidas}
          onChange={(e) => {
            setSoloNoLeidas(e.target.checked);
            setPagina(1);
          }}
          className="size-5"
        />
        Ver solo las no leídas
      </label>

      {resultado.estado === "cargando" && (
        <RegionCargando etiqueta="Cargando notificaciones">
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <Esqueleto key={i} className="h-20 w-full" />
            ))}
          </div>
        </RegionCargando>
      )}
      {resultado.estado === "error" && (
        <EstadoError mensaje={resultado.mensaje} alReintentar={recargar} />
      )}
      {resultado.estado === "listo" &&
        (resultado.datos.total === 0 ? (
          <EstadoVacio
            titulo={soloNoLeidas ? "No tienes notificaciones sin leer" : "Todavía no tienes notificaciones"}
            mensaje="Te avisaremos aquí cuando cambie el estado de tus solicitudes."
          />
        ) : (
          <>
            <p aria-live="polite" className="text-gris">
              {resultado.datos.noLeidas === 0
                ? "No tienes notificaciones sin leer."
                : `${resultado.datos.noLeidas} sin leer.`}
            </p>
            <ul className="flex flex-col gap-3">
              {resultado.datos.datos.map((n) => (
                <li
                  key={n.id}
                  className={clsx(
                    "flex flex-col gap-1 rounded-lg border p-4",
                    n.leida ? "border-gris-claro" : "border-l-4 border-azul bg-fondo-suave",
                  )}
                >
                  <p className="font-bold">
                    {!n.leida && <span className="mr-2 rounded-full bg-azul px-2.5 py-0.5 text-sm font-bold text-white">Nueva</span>}
                    {n.titulo}
                  </p>
                  <p>{n.cuerpo}</p>
                  <p className="text-sm text-gris">
                    {fecha(n.creadaEn)} · {hora(n.creadaEn)}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    {n.enlace && n.enlace.startsWith("/") && (
                      <Link href={n.enlace} className="text-azul-oscuro underline underline-offset-4">
                        Abrir
                      </Link>
                    )}
                    {!n.leida && (
                      <button
                        type="button"
                        onClick={() => leer(n.id)}
                        className="text-azul-oscuro underline underline-offset-4"
                      >
                        Marcar como leída
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <Paginador
              pagina={resultado.datos.pagina}
              total={resultado.datos.total}
              porPagina={resultado.datos.porPagina}
              alCambiar={setPagina}
            />
          </>
        ))}
    </div>
  );
}
