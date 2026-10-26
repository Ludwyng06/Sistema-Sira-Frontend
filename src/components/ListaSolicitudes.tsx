"use client";

import Link from "next/link";
import { useState } from "react";
import { Esqueleto, RegionCargando } from "@/components/Esqueleto";
import { EstadoError } from "@/components/EstadoError";
import { EstadoVacio } from "@/components/EstadoVacio";
import { InsigniaEstado } from "@/components/InsigniaEstado";
import { LineaEstaciones } from "@/components/LineaEstaciones";
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
            <ul className="flex flex-col gap-4">
              {resultado.datos.datos.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`${rutaDetalle}/${s.id}`}
                    className="group grid gap-4 rounded-tarjeta border border-gris-claro/60 bg-fondo p-5 shadow-tarjeta transition duration-200 hover:-translate-y-0.5 hover:shadow-elevada motion-reduce:transition-none motion-reduce:hover:translate-y-0 md:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] md:items-center md:gap-8"
                  >
                    <span className="flex min-w-0 flex-col gap-2">
                      <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <span className="font-titulo text-lg font-extrabold text-azul-oscuro">
                          {s.consecutivo ?? "Sin enviar"}
                        </span>
                        <InsigniaEstado estado={s.estado} />
                        {s.esExenta && (
                          <span className="rounded-full bg-turquesa-suave px-3 py-1 font-bold text-azul-oscuro">
                            Sin costo
                          </span>
                        )}
                      </span>
                      <span className="text-lg font-bold text-tinta">{s.objetoEvento}</span>
                      <span className="text-gris">
                        {s.asistentesEstimados} personas · creada el {fecha(s.creadoEn)}
                      </span>
                    </span>
                    <LineaEstaciones estado={s.estado} esExenta={s.esExenta} compacta />
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
    "rounded-campo border-2 border-azul px-4 py-2 font-bold text-azul-oscuro hover:bg-turquesa-suave";
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
