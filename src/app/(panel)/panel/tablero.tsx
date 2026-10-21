"use client";

import { Esqueleto, RegionCargando } from "@/components/Esqueleto";
import { EstadoError } from "@/components/EstadoError";
import { fecha, pesos } from "@/lib/formato";
import { obtenerTablero } from "@/lib/reportes";
import { ESTADOS, type EstadoSolicitud } from "@/lib/solicitudes";
import { useConsulta } from "@/lib/useConsulta";

function Cifra({ titulo, valor, detalle }: { titulo: string; valor: string; detalle?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-gris-claro p-4 shadow-sm">
      <dt className="text-sm font-medium text-gris">{titulo}</dt>
      <dd className="font-titulo text-3xl font-extrabold text-azul-oscuro">{valor}</dd>
      {detalle && <dd className="text-sm text-gris">{detalle}</dd>}
    </div>
  );
}

/** Los números llegan de la API; nada se calcula en el cliente. */
export function Tablero() {
  const { resultado, recargar } = useConsulta(() => obtenerTablero(), []);

  if (resultado.estado === "cargando") {
    return (
      <RegionCargando etiqueta="Cargando el tablero">
        <div className="flex flex-col gap-4">
          <Esqueleto className="h-10 w-64" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Esqueleto key={i} className="h-28" />
            ))}
          </div>
        </div>
      </RegionCargando>
    );
  }
  if (resultado.estado === "error") {
    return <EstadoError mensaje={resultado.mensaje} alReintentar={recargar} />;
  }

  const t = resultado.datos;
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold sm:text-4xl">Tablero</h1>
        <p className="text-gris">
          Del {fecha(t.desde)} al {fecha(t.hasta)}.
        </p>
      </header>

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Cifra
          titulo="Recaudo aprobado"
          valor={pesos(t.recaudo.total)}
          detalle={`${t.recaudo.ordenesAprobadas} órdenes aprobadas`}
        />
        <Cifra
          titulo="Uso institucional sin cobro"
          valor={pesos(t.usoInternoNoCobrado.valorReferencia)}
          detalle={`${t.usoInternoNoCobrado.solicitudesExentas} solicitudes exentas`}
        />
        <Cifra
          titulo="Tiempo medio de aprobación"
          valor={
            t.tiempoMedioAprobacionHoras === null || t.tiempoMedioAprobacionHoras === undefined
              ? "Sin datos"
              : `${t.tiempoMedioAprobacionHoras} h`
          }
        />
        <Cifra titulo="Horas reservadas" valor={String(t.ocupacion.horasReservadas)} />
        <Cifra titulo="Horas bloqueadas" valor={String(t.ocupacion.horasBloqueadas)} />
      </dl>

      <section aria-labelledby="titulo-estados" className="flex flex-col gap-3">
        <h2 id="titulo-estados" className="text-2xl font-bold">
          Solicitudes por estado
        </h2>
        {t.solicitudesPorEstado.length === 0 ? (
          <p className="text-gris">No hubo solicitudes en este periodo.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {t.solicitudesPorEstado.map((c) => (
              <li
                key={c.estado}
                className="flex items-baseline justify-between rounded border border-gris-claro px-4 py-2"
              >
                <span>{ESTADOS[c.estado as EstadoSolicitud]?.etiqueta ?? c.estado}</span>
                <span className="text-xl font-bold">{c.cantidad}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="titulo-usados" className="flex flex-col gap-3">
        <h2 id="titulo-usados" className="text-2xl font-bold">
          Espacios más usados
        </h2>
        {t.ocupacion.espaciosMasUsados.length === 0 ? (
          <p className="text-gris">Todavía no hay reservas confirmadas en este periodo.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gris-claro">
            <table className="w-full text-left">
              <caption className="sr-only">Espacios con más horas reservadas</caption>
              <thead className="bg-fondo-suave">
                <tr>
                  <th scope="col" className="px-4 py-2">Espacio</th>
                  <th scope="col" className="px-4 py-2">Horas reservadas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gris-claro">
                {t.ocupacion.espaciosMasUsados.map((e) => (
                  <tr key={e.espacioId}>
                    <th scope="row" className="px-4 py-2 font-medium">
                      {e.codigo} · {e.nombre}
                    </th>
                    <td className="px-4 py-2">{e.horasReservadas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
