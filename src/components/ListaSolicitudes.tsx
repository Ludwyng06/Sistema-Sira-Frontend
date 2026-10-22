"use client";

import Link from "next/link";
import { useState } from "react";
import { Esqueleto, RegionCargando } from "@/components/Esqueleto";
import { EstadoError } from "@/components/EstadoError";
import { EstadoVacio } from "@/components/EstadoVacio";
import { InsigniaEstado } from "@/components/InsigniaEstado";
import { Selector } from "@/components/formularios";
import { fecha } from "@/lib/formato";
import {
  ESTADOS,
  listarSolicitudes,
  type EstadoSolicitud,
} from "@/lib/solicitudes";
import { useConsulta } from "@/lib/useConsulta";

const POR_PAGINA = 20;

/** Lista paginada de solicitudes propias o de la bandeja de revisión. */
export function ListaSolicitudes({
  ambito,
  rutaDetalle,
  vacio,
}: {
  ambito: "PROPIAS" | "BANDEJA";
  /** Ruta base del detalle, sin barra final: `${rutaDetalle}/${id}`. */
  rutaDetalle: string;
  vacio: { titulo: string; mensaje: string; accion?: { href: string; texto: string } };
}) {
  const [estado, setEstado] = useState<EstadoSolicitud | "">("");
  const [pagina, setPagina] = useState(1);
  const { resultado, recargar } = useConsulta(
    () =>
      listarSolicitudes({ ambito, estado: estado || undefined, pagina, porPagina: POR_PAGINA }),
    [ambito, estado, pagina],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="max-w-xs">
        <Selector
          id="filtro-estado"
          etiqueta="Filtrar por estado"
          value={estado}
          onChange={(e) => {
            setEstado(e.target.value as EstadoSolicitud | "");
            setPagina(1);
          }}
        >
          <option value="">Todos</option>
          {(Object.keys(ESTADOS) as EstadoSolicitud[]).map((e) => (
            <option key={e} value={e}>
              {ESTADOS[e].etiqueta}
            </option>
          ))}
        </Selector>
      </div>

      {resultado.estado === "cargando" && (
        <RegionCargando etiqueta="Cargando solicitudes">
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
          <EstadoVacio {...vacio} />
        ) : (
          <>
            <ul className="flex flex-col gap-3">
              {resultado.datos.datos.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`${rutaDetalle}/${s.id}`}
                    className="flex flex-col gap-1 rounded-lg border border-gris-claro p-4 shadow-sm hover:bg-fondo-suave"
                  >
                    <span className="flex flex-wrap items-center gap-3">
                      <span className="font-bold text-azul-oscuro">
                        {s.consecutivo ?? "Sin enviar"}
                      </span>
                      <InsigniaEstado estado={s.estado} />
                      {s.esExenta && (
                        <span className="rounded border border-gris-claro px-2 py-0.5 text-sm">
                          Sin costo
                        </span>
                      )}
                    </span>
                    <span className="font-medium">{s.objetoEvento}</span>
                    <span className="text-sm text-gris">
                      {s.asistentesEstimados} personas · creada el {fecha(s.creadoEn)} ·{" "}
                      {ESTADOS[s.estado].proxima}
                    </span>
                  </Link>
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

export function Paginador({
  pagina,
  total,
  porPagina,
  alCambiar,
}: {
  pagina: number;
  total: number;
  porPagina: number;
  alCambiar: (pagina: number) => void;
}) {
  const paginas = Math.ceil(total / porPagina);
  if (paginas <= 1) return null;
  const clase =
    "rounded-lg border-2 border-azul px-4 py-2 font-bold text-azul-oscuro hover:bg-turquesa-suave";
  return (
    <nav aria-label="Paginación" className="flex flex-wrap items-center gap-4">
      {pagina > 1 && (
        <button type="button" className={clase} onClick={() => alCambiar(pagina - 1)}>
          Anterior
        </button>
      )}
      <p>
        Página {pagina} de {paginas}
      </p>
      {pagina < paginas && (
        <button type="button" className={clase} onClick={() => alCambiar(pagina + 1)}>
          Siguiente
        </button>
      )}
    </nav>
  );
}
