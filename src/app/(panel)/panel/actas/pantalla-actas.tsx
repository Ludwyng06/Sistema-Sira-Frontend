"use client";

import Link from "next/link";
import { useState } from "react";
import clsx from "clsx";
import { Esqueleto, RegionCargando } from "@/components/Esqueleto";
import { EstadoError } from "@/components/EstadoError";
import { EstadoVacio } from "@/components/EstadoVacio";
import { Alerta, Boton, Selector } from "@/components/formularios";
import { useSesion } from "@/components/SesionProvider";
import { avisar } from "@/lib/avisos";
import { fecha } from "@/lib/formato";
import {
  cerrarSolicitud,
  listarSolicitudes,
  type ResultadoDepositoCierre,
  type Solicitud,
} from "@/lib/solicitudes";
import { useConsulta } from "@/lib/useConsulta";
import { useIrAResultados } from "@/lib/useIrAResultados";
import { AnclaResultados } from "@/components/AnclaResultados";

const PESTANAS = [
  { tipo: "ENTREGA", estado: "CONFIRMADA", texto: "Por entregar", accion: "Hacer acta de entrega" },
  { tipo: "DEVOLUCION", estado: "EN_USO", texto: "Por recibir", accion: "Hacer acta de devolución" },
  { tipo: "CIERRE", estado: "FINALIZADA", texto: "Por cerrar", accion: "Cerrar solicitud" },
] as const;

export function PantallaActas() {
  const { tieneRol } = useSesion();
  const puedeOperar = tieneRol("RESPONSABLE_ESPACIO", "ADMINISTRADOR");
  const [indice, setIndice] = useState(0);
  const [cerrando, setCerrando] = useState<Solicitud | null>(null);
  const [resultadoDeposito, setResultadoDeposito] = useState<ResultadoDepositoCierre>("DEVUELTO");
  const [observacionesCierre, setObservacionesCierre] = useState("");
  const [enviandoCierre, setEnviandoCierre] = useState(false);
  const [errorCierre, setErrorCierre] = useState<string | null>(null);
  const pestana = PESTANAS[indice];
  const { resultado, recargar } = useConsulta(
    () => listarSolicitudes({ ambito: "BANDEJA", estado: pestana.estado, porPagina: 50 }),
    [pestana.estado],
  );
  const { destino: anclaResultados, ir: irAResultados, buscando: buscandoResultados } = useIrAResultados(resultado.estado !== "cargando");

  async function confirmarCierre(s: Solicitud) {
    setEnviandoCierre(true);
    setErrorCierre(null);
    try {
      await cerrarSolicitud(s.id, {
        resultadoDeposito,
        observaciones: observacionesCierre.trim() || undefined,
      });
      avisar.exito(`La solicitud ${s.consecutivo ?? s.id} quedó cerrada.`);
      setCerrando(null);
      setObservacionesCierre("");
      recargar();
    } catch (e) {
      setErrorCierre(e instanceof Error ? e.message : "No pudimos cerrar la solicitud.");
    } finally {
      setEnviandoCierre(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-t1 font-black">Actas</h1>
        <p className="text-gris">Entrega y devolución de los espacios y sus elementos.</p>
      </header>

      <div role="tablist" aria-label="Tipo de acta" className="flex flex-wrap gap-2">
        {PESTANAS.map((p, i) => (
          <button
            key={p.tipo}
            type="button"
            role="tab"
            aria-selected={indice === i}
            onClick={() => {
              setIndice(i);
              irAResultados();
            }}
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

      <AnclaResultados ref={anclaResultados} buscando={buscandoResultados} etiqueta="Solicitudes de esta pestaña" />
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
                className="flex flex-col gap-2 rounded-campo border border-gris-claro p-4 shadow-tarjeta"
              >
                <p className="font-bold text-azul-oscuro">{s.consecutivo}</p>
                <p className="font-medium">{s.objetoEvento}</p>
                <p className="text-base text-gris">
                  {s.asistentesEstimados} personas · creada el {fecha(s.creadoEn)}
                </p>
                {errorCierre && cerrando?.id === s.id && (
                  <Alerta tipo="error">{errorCierre}</Alerta>
                )}
                {pestana.tipo === "CIERRE" ? (
                  cerrando?.id === s.id ? (
                    <div className="mt-2 flex flex-col gap-3 rounded-campo border border-gris-claro bg-fondo-suave p-4">
                      <p className="font-bold text-azul-oscuro">
                        Cerrar {s.consecutivo ?? "solicitud"} (novedades y depósito resueltos)
                      </p>
                      <Selector
                        id={`deposito-${s.id}`}
                        etiqueta="Resultado del depósito de garantía"
                        value={resultadoDeposito}
                        onChange={(e) =>
                          setResultadoDeposito(e.target.value as ResultadoDepositoCierre)
                        }
                      >
                        <option value="DEVUELTO">Devuelto al solicitante</option>
                        <option value="NO_APLICA">No aplica (sin depósito o exenta)</option>
                        <option value="RETENIDO_PARCIAL">Retenido parcialmente por daños</option>
                        <option value="RETENIDO_TOTAL">Retenido totalmente por daños</option>
                      </Selector>
                      <label className="flex flex-col gap-1 text-base font-medium">
                        Observaciones del cierre (opcional)
                        <input
                          type="text"
                          value={observacionesCierre}
                          onChange={(e) => setObservacionesCierre(e.target.value)}
                          placeholder="Ej. Espacio recibido a satisfacción y paz y salvo emitido."
                          className="rounded-campo border border-gris/70 bg-fondo px-3 py-2"
                        />
                      </label>
                      <div className="flex flex-wrap gap-3">
                        <Boton onClick={() => confirmarCierre(s)} cargando={enviandoCierre}>
                          Confirmar cierre
                        </Boton>
                        <Boton
                          variante="secundario"
                          onClick={() => {
                            setCerrando(null);
                            setErrorCierre(null);
                          }}
                          disabled={enviandoCierre}
                        >
                          Cancelar
                        </Boton>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-3">
                      {puedeOperar && (
                        <Boton onClick={() => setCerrando(s)}>{pestana.accion}</Boton>
                      )}
                      <Link
                        href={`/panel/aprobaciones/${s.id}`}
                        className="font-bold text-azul underline underline-offset-4"
                      >
                        Ver detalle y actas
                      </Link>
                    </div>
                  )
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    {puedeOperar && (
                      <Link
                        href={`/panel/actas/${s.id}?tipo=${pestana.tipo}`}
                        className="w-fit rounded-campo bg-azul px-5 py-2.5 font-bold text-white shadow-[0_2px_0_0_var(--color-azul-oscuro)] transition duration-200 hover:-translate-y-px hover:bg-azul-oscuro motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                      >
                        {pestana.accion}
                      </Link>
                    )}
                    <Link
                      href={`/panel/aprobaciones/${s.id}`}
                      className="font-bold text-azul underline underline-offset-4"
                    >
                      Ver detalle
                    </Link>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}
