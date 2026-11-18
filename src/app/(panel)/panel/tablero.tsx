"use client";

import { useState, type FormEvent } from "react";
import { AnclaResultados } from "@/components/AnclaResultados";
import { VentanaBuscando } from "@/components/VentanaBuscando";
import { Esqueleto, RegionCargando } from "@/components/Esqueleto";
import { Alerta, Boton, Campo } from "@/components/formularios";
import { PlanoCampus } from "@/components/marca/PlanoCampus";
import { EstadoError } from "@/components/EstadoError";
import { fecha, pesos } from "@/lib/formato";
import { obtenerTablero } from "@/lib/reportes";
import { ESTADOS, type EstadoSolicitud } from "@/lib/solicitudes";
import { listarBloques, SEDE_PRINCIPAL } from "@/lib/inventario";
import { useConsulta } from "@/lib/useConsulta";
import { useIrAResultados } from "@/lib/useIrAResultados";
import { finDiaBogota, inicioDiaBogota, partesBogota } from "@/lib/zona";
import { ExportacionesTablero } from "./exportaciones";

function Cifra({ titulo, valor, detalle }: { titulo: string; valor: string; detalle?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-tarjeta bg-fondo p-4 shadow-tarjeta">
      <dt className="text-base font-medium text-gris">{titulo}</dt>
      <dd className="font-titulo text-3xl font-extrabold text-azul-oscuro">{valor}</dd>
      {detalle && <dd className="text-meta text-gris">{detalle}</dd>}
    </div>
  );
}

interface Rango {
  desde: string;
  hasta: string;
}

/**
 * Elige el periodo del tablero (días de Bogotá). Sin rango, la API usa los últimos 30 días. Las descargas
 * usan el mismo periodo que devuelve la API.
 */
function SelectorRango({ valor, alCambiar }: { valor: Rango; alCambiar: (rango: Rango | null) => void }) {
  const [error, setError] = useState<string | null>(null);

  function aplicar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    const desde = String(datos.get("desde") ?? "");
    const hasta = String(datos.get("hasta") ?? "");
    if (!desde || !hasta) {
      setError("Elige las dos fechas: desde y hasta.");
      return;
    }
    if (desde > hasta) {
      setError("La fecha «Desde» debe ser anterior o igual a «Hasta».");
      return;
    }
    setError(null);
    alCambiar({ desde, hasta });
  }

  return (
    <form onSubmit={aplicar} className="no-imprimir flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <Campo id="tablero-desde" name="desde" etiqueta="Desde" type="date" defaultValue={valor.desde} />
        <Campo id="tablero-hasta" name="hasta" etiqueta="Hasta" type="date" defaultValue={valor.hasta} />
        <Boton type="submit">Ver periodo</Boton>
        <Boton variante="secundario" onClick={() => alCambiar(null)}>
          Últimos 30 días
        </Boton>
      </div>
      {error && <Alerta tipo="error">{error}</Alerta>}
    </form>
  );
}

/** Los números llegan de la API; nada se calcula en el cliente. */
export function Tablero() {
  const [rango, setRango] = useState<Rango | null>(null);
  const { resultado, recargar } = useConsulta(
    () =>
      rango ? obtenerTablero(inicioDiaBogota(rango.desde), finDiaBogota(rango.hasta)) : obtenerTablero(),
    [rango?.desde ?? "", rango?.hasta ?? ""],
  );
  const { destino: anclaResultados, ir: irAResultados, buscando: buscandoResultados } = useIrAResultados(resultado.estado !== "cargando");
  const bloques = useConsulta(() => listarBloques(SEDE_PRINCIPAL), []);

  if (resultado.estado === "cargando") {
    return (
      <RegionCargando etiqueta="Cargando el tablero">
        <VentanaBuscando visible={buscandoResultados} detalle="Calculando las cifras del periodo." />
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
  // El fin del periodo es exclusivo (00:00 del día siguiente): se muestra el último día incluido.
  const ultimoDia = new Date(new Date(t.hasta).getTime() - 1);
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-t1 font-black">Tablero</h1>
          <p className="text-gris">
            Del {fecha(t.desde)} al {fecha(ultimoDia)}.
          </p>
        </div>
        <SelectorRango
          key={`${t.desde}-${t.hasta}`}
          valor={rango ?? { desde: partesBogota(t.desde).dia, hasta: partesBogota(ultimoDia).dia }}
          alCambiar={(nuevo) => {
            irAResultados();
            setRango(nuevo);
          }}
        />
      </header>

      <AnclaResultados ref={anclaResultados} buscando={buscandoResultados} etiqueta="Cifras del periodo" />
      <dl className="grid gap-4 sm:grid-cols-3">
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
      </dl>

      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="titulo-estados" className="flex flex-col gap-3">
          <h2 id="titulo-estados" className="text-2xl font-extrabold">
            Solicitudes por estado
          </h2>
          {t.solicitudesPorEstado.length === 0 ? (
            <p className="text-gris">No hubo solicitudes en este periodo.</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {t.solicitudesPorEstado.map((c) => (
                <li
                  key={c.estado}
                  className="flex items-baseline justify-between gap-3 rounded-campo border border-gris-claro px-4 py-3"
                >
                  <span>{ESTADOS[c.estado as EstadoSolicitud]?.etiqueta ?? c.estado}</span>
                  <span className="text-xl font-bold">{c.cantidad}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="titulo-ocupacion" className="flex flex-col gap-3">
          <h2 id="titulo-ocupacion" className="text-2xl font-extrabold">
            Ocupación
          </h2>
          <dl className="grid grid-cols-2 gap-4">
            <Cifra titulo="Horas reservadas" valor={String(t.ocupacion.horasReservadas)} />
            <Cifra titulo="Horas bloqueadas" valor={String(t.ocupacion.horasBloqueadas)} />
          </dl>
          <h3 className="text-lg font-bold">Espacios más usados</h3>
          {t.ocupacion.espaciosMasUsados.length === 0 ? (
            <p className="text-gris">Todavía no hay reservas confirmadas en este periodo.</p>
          ) : (
            <div className="rounded-tarjeta border border-gris-claro">
              <table className="tabla-completa text-left">
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
                      <th scope="row" data-etiqueta="Espacio" className="px-4 py-2 font-medium">
                        {e.codigo} · {e.nombre}
                      </th>
                      <td data-etiqueta="Horas reservadas" className="px-4 py-2">{e.horasReservadas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <section aria-labelledby="titulo-plano-campus" className="flex flex-col gap-3">
        <h2 id="titulo-plano-campus" className="text-2xl font-extrabold">
          Campus Mocoa
        </h2>
        <p className="text-gris">Plano del levantamiento topográfico. Elige un bloque para ver sus espacios por piso.</p>
        {bloques.resultado.estado === "listo" ? (
          <div className="sobre-azul max-w-3xl rounded-panel bg-gradient-to-br from-azul to-azul-oscuro p-6 text-white">
            <PlanoCampus sede={SEDE_PRINCIPAL} bloques={bloques.resultado.datos} />
          </div>
        ) : bloques.resultado.estado === "error" ? (
          <EstadoError mensaje={bloques.resultado.mensaje} alReintentar={bloques.recargar} />
        ) : (
          <Esqueleto className="aspect-[68/62] w-full max-w-3xl" />
        )}
      </section>

      <ExportacionesTablero desde={t.desde} hasta={t.hasta} />
    </div>
  );
}
