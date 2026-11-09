"use client";

import { AnclaResultados } from "@/components/AnclaResultados";
import { useIrAResultados } from "@/lib/useIrAResultados";
import Link from "next/link";
import { useState } from "react";
import clsx from "clsx";
import { DialogoConfirmacion } from "@/components/DialogoConfirmacion";
import { Esqueleto, RegionCargando } from "@/components/Esqueleto";
import { EstadoError } from "@/components/EstadoError";
import { EstadoVacio } from "@/components/EstadoVacio";
import { Paginador } from "@/components/ListaSolicitudes";
import { Alerta, Boton } from "@/components/formularios";
import { useSesion } from "@/components/SesionProvider";
import { fecha, hora, pesos } from "@/lib/formato";
import {
  descargarSoporte,
  descargarSoporteReembolso,
  ETIQUETAS_ORDEN,
  ETIQUETAS_REEMBOLSO,
  listarOrdenes,
  listarReembolsos,
  resolverReembolso,
  verificarPago,
  type EstadoOrden,
  type EstadoReembolso,
  type OrdenPagoResumen,
  type ReembolsoResumen,
} from "@/lib/pagos";
import { guardarArchivo } from "@/lib/descarga";
import { useConsulta } from "@/lib/useConsulta";
import { avisar } from "@/lib/avisos";

const PESTANAS: { estado: EstadoOrden; texto: string }[] = [
  { estado: "EN_VERIFICACION", texto: "Por verificar" },
  { estado: "APROBADA", texto: "Aprobados" },
  { estado: "RECHAZADA", texto: "Rechazados" },
  { estado: "VENCIDA", texto: "Vencidos" },
];

const PESTANAS_REEMBOLSO: { estado: EstadoReembolso | "TODOS"; texto: string }[] = [
  { estado: "SOLICITADO", texto: "Por reembolsar" },
  { estado: "APLICADO", texto: "Reembolsados" },
  { estado: "RECHAZADO", texto: "Rechazados" },
  { estado: "TODOS", texto: "Todos" },
];

const POR_PAGINA = 20;

export function PantallaPagos() {
  const { tieneRol } = useSesion();
  const puedeVerificar = tieneRol("TESORERIA");
  const [seccion, setSeccion] = useState<"ORDENES" | "REEMBOLSOS">("ORDENES");
  const [estado, setEstado] = useState<EstadoOrden>("EN_VERIFICACION");
  const [pagina, setPagina] = useState(1);
  const [rechazando, setRechazando] = useState<OrdenPagoResumen | null>(null);
  const [errorSoporte, setErrorSoporte] = useState<string | null>(null);
  const [soporte, setSoporte] = useState<{ id: string; url: string; tipo: string } | null>(null);
  const { resultado, recargar } = useConsulta(
    () => listarOrdenes({ estado, pagina, porPagina: POR_PAGINA }),
    [estado, pagina],
  );
  const { destino: anclaResultados, ir: irAResultados, buscando: buscandoResultados } = useIrAResultados(resultado.estado !== "cargando");

  function cerrarSoporte() {
    if (soporte) URL.revokeObjectURL(soporte.url);
    setSoporte(null);
  }

  /** El comprobante se abre junto a la orden para compararlos sin salir de la página. */
  async function verSoporte(orden: OrdenPagoResumen) {
    setErrorSoporte(null);
    try {
      const archivo = await descargarSoporte(orden.id);
      if (soporte) URL.revokeObjectURL(soporte.url);
      setSoporte({ id: orden.id, url: URL.createObjectURL(archivo), tipo: archivo.type });
    } catch (e) {
      setErrorSoporte(e instanceof Error ? e.message : "No pudimos abrir el comprobante.");
    }
  }

  async function aprobar(orden: OrdenPagoResumen) {
    try {
      await verificarPago(orden.id, "APROBADA");
      avisar.exito(`Pago ${orden.referencia} aprobado. La solicitud quedó confirmada.`);
      recargar();
    } catch (e) {
      setErrorSoporte(e instanceof Error ? e.message : "No pudimos aprobar el pago.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-t1 font-black">Pagos y reembolsos</h1>
        <p className="text-gris">Verifica las consignaciones de las solicitudes cotizadas y gestiona los reembolsos por cancelación.</p>
      </header>

      <div role="tablist" aria-label="Sección de pagos" className="flex flex-wrap gap-2 border-b border-gris-claro pb-3">
        <button
          type="button"
          role="tab"
          aria-selected={seccion === "ORDENES"}
          onClick={() => setSeccion("ORDENES")}
          className={clsx(
            "min-h-11 rounded-campo px-5 font-bold",
            seccion === "ORDENES" ? "bg-azul-oscuro text-white" : "border border-gris-claro text-azul-oscuro hover:bg-fondo-suave",
          )}
        >
          Órdenes de pago
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={seccion === "REEMBOLSOS"}
          onClick={() => setSeccion("REEMBOLSOS")}
          className={clsx(
            "min-h-11 rounded-campo px-5 font-bold",
            seccion === "REEMBOLSOS" ? "bg-azul-oscuro text-white" : "border border-gris-claro text-azul-oscuro hover:bg-fondo-suave",
          )}
        >
          Reembolsos
        </button>
      </div>

      {seccion === "REEMBOLSOS" ? (
        <SeccionReembolsos puedeVerificar={puedeVerificar} />
      ) : (
        <>
      <div role="tablist" aria-label="Estado del pago" className="flex flex-wrap gap-2">
        {PESTANAS.map((p) => (
          <button
            key={p.estado}
            type="button"
            role="tab"
            aria-selected={estado === p.estado}
            onClick={() => {
              setEstado(p.estado);
              setPagina(1);
              irAResultados();
            }}
            className={clsx(
              "min-h-11 rounded-full px-5 text-base font-bold",
              estado === p.estado
                ? "bg-azul text-white"
                : "border border-gris-claro text-azul-oscuro hover:bg-fondo-suave",
            )}
          >
            {p.texto}
          </button>
        ))}
      </div>
      {errorSoporte && <Alerta tipo="error">{errorSoporte}</Alerta>}

      <AnclaResultados ref={anclaResultados} buscando={buscandoResultados} etiqueta="Resultados de los pagos" />
      {resultado.estado === "cargando" && (
        <RegionCargando etiqueta="Cargando pagos">
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <Esqueleto key={i} className="h-24 w-full" />
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
            titulo="No hay pagos en este estado"
            mensaje="Cuando una orden llegue a este estado aparecerá aquí."
          />
        ) : (
          <>
            <ul className="flex flex-col gap-3">
              {resultado.datos.datos.map((o) => (
                <li
                  key={o.id}
                  className="flex flex-col gap-3 rounded-tarjeta bg-fondo p-4 shadow-tarjeta"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-bold text-azul-oscuro">
                      Referencia {o.referencia}
                      {o.consecutivoSolicitud && (
                        <>
                          {" · "}
                          <Link
                            href={`/panel/aprobaciones/${o.solicitudId}`}
                            className="underline underline-offset-4"
                          >
                            {o.consecutivoSolicitud}
                          </Link>
                        </>
                      )}
                    </p>
                    <p className="text-xl font-bold">{pesos(o.valor)}</p>
                  </div>
                  <p className="text-base text-gris">
                    {ETIQUETAS_ORDEN[o.estado]} · vence el {fecha(o.venceEn)} a las{" "}
                    {hora(o.venceEn)}
                    {o.pagadoEn && <> · pagado el {fecha(o.pagadoEn)}</>}
                  </p>
                  {soporte?.id === o.id && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <dl className="flex flex-col gap-2 rounded-campo bg-fondo-suave p-4">
                        <div>
                          <dt className="text-meta font-bold text-gris">Referencia de la orden</dt>
                          <dd className="text-xl font-extrabold text-azul-oscuro">{o.referencia}</dd>
                        </div>
                        <div>
                          <dt className="text-meta font-bold text-gris">Valor que debe aparecer</dt>
                          <dd className="text-xl font-extrabold text-azul-oscuro">{pesos(o.valor)}</dd>
                        </div>
                        <p className="text-base text-gris">Compara estos datos con el comprobante de la derecha.</p>
                      </dl>
                      <div className="overflow-hidden rounded-campo border border-gris-claro bg-fondo">
                        {soporte.tipo.startsWith("image/") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={soporte.url} alt={`Comprobante de la orden ${o.referencia}`} className="max-h-[32rem] w-full object-contain" />
                        ) : (
                          <iframe src={soporte.url} title={`Comprobante de la orden ${o.referencia}`} className="h-[32rem] w-full" />
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-3">
                    {o.tieneSoporte &&
                      (soporte?.id === o.id ? (
                        <>
                          <Boton variante="secundario" onClick={cerrarSoporte}>
                            Ocultar comprobante
                          </Boton>
                          <Boton
                            variante="secundario"
                            onClick={() =>
                              fetch(soporte.url)
                                .then((r) => r.blob())
                                .then((b) => guardarArchivo(b, `Comprobante-${o.referencia}.${soporte.tipo === "application/pdf" ? "pdf" : soporte.tipo.split("/")[1] ?? "bin"}`))
                            }
                          >
                            Descargar comprobante
                          </Boton>
                        </>
                      ) : (
                        <Boton variante="secundario" onClick={() => verSoporte(o)}>
                          Ver comprobante junto a la orden
                        </Boton>
                      ))}
                    {puedeVerificar && o.estado === "EN_VERIFICACION" && (
                      <>
                        <Boton onClick={() => aprobar(o)}>Aprobar pago</Boton>
                        <Boton variante="secundario" onClick={() => setRechazando(o)}>
                          Rechazar pago
                        </Boton>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <Paginador
              pagina={resultado.datos.pagina}
              total={resultado.datos.total}
              porPagina={resultado.datos.porPagina}
              alCambiar={(p) => {
                irAResultados();
                setPagina(p);
              }}
            />
          </>
        ))}

      <DialogoConfirmacion
        abierto={rechazando !== null}
        titulo="Rechazar el pago"
        textoConfirmar="Rechazar pago"
        variante="peligro"
        pedirMotivo
        etiquetaMotivo="Qué está mal con el comprobante"
        alConfirmar={async (observacion) => {
          if (!rechazando) return;
          await verificarPago(rechazando.id, "RECHAZADA", observacion);
          avisar.exito(`Pago ${rechazando.referencia} rechazado. El solicitante podrá generar una nueva orden.`);
          recargar();
        }}
        alCerrar={() => setRechazando(null)}
      >
        <p className="text-gris">Compara el comprobante con la referencia y el valor de la orden.</p>
      </DialogoConfirmacion>
        </>
      )}
    </div>
  );
}

function SeccionReembolsos({ puedeVerificar }: { puedeVerificar: boolean }) {
  const [estado, setEstado] = useState<EstadoReembolso | "TODOS">("SOLICITADO");
  const [pagina, setPagina] = useState(1);
  const [aplicando, setAplicando] = useState<ReembolsoResumen | null>(null);
  const [rechazando, setRechazando] = useState<ReembolsoResumen | null>(null);
  const [archivoSoporte, setArchivoSoporte] = useState<File | null>(null);
  const [observacionAplicar, setObservacionAplicar] = useState("");
  const [enviandoAplicar, setEnviandoAplicar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { resultado, recargar } = useConsulta(
    () =>
      listarReembolsos({
        estado: estado === "TODOS" ? undefined : estado,
        pagina,
        porPagina: POR_PAGINA,
      }),
    [estado, pagina],
  );
  const { destino: anclaResultados, ir: irAResultados, buscando: buscandoResultados } = useIrAResultados(resultado.estado !== "cargando");

  async function confirmarAplicar() {
    if (!aplicando) return;
    setEnviandoAplicar(true);
    setError(null);
    try {
      await resolverReembolso(aplicando.id, "APLICADO", {
        observacion: observacionAplicar.trim() || undefined,
        archivo: archivoSoporte ?? undefined,
      });
      avisar.exito(
        `Reembolso de ${aplicando.consecutivoSolicitud ?? aplicando.referenciaOrden} marcado como aplicado.`,
      );
      setAplicando(null);
      setArchivoSoporte(null);
      setObservacionAplicar("");
      recargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos aplicar el reembolso.");
    } finally {
      setEnviandoAplicar(false);
    }
  }

  async function bajarSoporte(r: ReembolsoResumen) {
    setError(null);
    try {
      const blob = await descargarSoporteReembolso(r.id);
      const ext = blob.type === "application/pdf" ? "pdf" : blob.type.split("/")[1] ?? "pdf";
      guardarArchivo(blob, `Reembolso-${r.consecutivoSolicitud ?? r.referenciaOrden}.${ext}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos descargar el soporte del reembolso.");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div role="tablist" aria-label="Estado del reembolso" className="flex flex-wrap gap-2">
        {PESTANAS_REEMBOLSO.map((p) => (
          <button
            key={p.estado}
            type="button"
            role="tab"
            aria-selected={estado === p.estado}
            onClick={() => {
              setEstado(p.estado);
              setPagina(1);
              irAResultados();
            }}
            className={clsx(
              "min-h-11 rounded-full px-5 text-base font-bold",
              estado === p.estado
                ? "bg-azul text-white"
                : "border border-gris-claro text-azul-oscuro hover:bg-fondo-suave",
            )}
          >
            {p.texto}
          </button>
        ))}
      </div>

      {error && <Alerta tipo="error">{error}</Alerta>}

      <AnclaResultados ref={anclaResultados} buscando={buscandoResultados} etiqueta="Reembolsos encontrados" />
      {resultado.estado === "cargando" && (
        <RegionCargando etiqueta="Cargando reembolsos">
          <div className="flex flex-col gap-3">
            {[0, 1].map((i) => (
              <Esqueleto key={i} className="h-24 w-full" />
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
            titulo="No hay reembolsos en este estado"
            mensaje="Cuando se cancele una solicitud pagada con derecho a devolución aparecerá aquí."
          />
        ) : (
          <>
            <ul className="flex flex-col gap-3">
              {resultado.datos.datos.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-col gap-3 rounded-tarjeta bg-fondo p-4 shadow-tarjeta"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-bold text-azul-oscuro">
                      {r.consecutivoSolicitud ? (
                        <Link
                          href={`/panel/aprobaciones/${r.solicitudId}`}
                          className="underline underline-offset-4"
                        >
                          {r.consecutivoSolicitud}
                        </Link>
                      ) : (
                        "Solicitud"
                      )}
                      {" · Orden "}
                      {r.referenciaOrden}
                    </p>
                    <p className="text-xl font-bold text-azul-oscuro">{pesos(r.valor)}</p>
                  </div>
                  <p className="text-base text-gris">
                    <span className="font-semibold text-azul-oscuro">
                      {ETIQUETAS_REEMBOLSO[r.estado]}
                    </span>
                    {" · solicitado el "}
                    {fecha(r.creadoEn)} a las {hora(r.creadoEn)}
                    {r.resueltoEn && <> · resuelto el {fecha(r.resueltoEn)}</>}
                  </p>
                  <p className="text-base">{r.motivo}</p>

                  {aplicando?.id === r.id && (
                    <div className="flex flex-col gap-3 rounded-campo border border-gris-claro bg-fondo-suave p-4">
                      <p className="font-bold text-azul-oscuro">
                        Registrar devolución de {pesos(r.valor)}
                      </p>
                      <label className="flex flex-col gap-1 text-base font-medium">
                        Comprobante de transferencia o devolución (PDF, PNG o JPG, opcional)
                        <input
                          type="file"
                          accept=".pdf,image/png,image/jpeg"
                          onChange={(e) => setArchivoSoporte(e.target.files?.[0] ?? null)}
                          className="rounded-campo border border-gris/70 bg-fondo p-2"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-base font-medium">
                        Observación (opcional)
                        <input
                          type="text"
                          value={observacionAplicar}
                          onChange={(e) => setObservacionAplicar(e.target.value)}
                          placeholder="Ej. Transferencia realizada según comprobante..."
                          className="rounded-campo border border-gris/70 bg-fondo px-3 py-2"
                        />
                      </label>
                      <div className="flex flex-wrap gap-3">
                        <Boton onClick={confirmarAplicar} cargando={enviandoAplicar}>
                          Confirmar reembolso aplicado
                        </Boton>
                        <Boton
                          variante="secundario"
                          onClick={() => {
                            setAplicando(null);
                            setArchivoSoporte(null);
                            setObservacionAplicar("");
                          }}
                          disabled={enviandoAplicar}
                        >
                          Cancelar
                        </Boton>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    {r.tieneSoporte && (
                      <Boton variante="secundario" onClick={() => bajarSoporte(r)}>
                        Descargar comprobante de reembolso
                      </Boton>
                    )}
                    {puedeVerificar &&
                      (r.estado === "SOLICITADO" || r.estado === "APROBADO") &&
                      aplicando?.id !== r.id && (
                        <>
                          <Boton onClick={() => setAplicando(r)}>Aplicar reembolso</Boton>
                          <Boton variante="secundario" onClick={() => setRechazando(r)}>
                            Rechazar reembolso
                          </Boton>
                        </>
                      )}
                  </div>
                </li>
              ))}
            </ul>
            <Paginador
              pagina={resultado.datos.pagina}
              total={resultado.datos.total}
              porPagina={resultado.datos.porPagina}
              alCambiar={(p) => {
                irAResultados();
                setPagina(p);
              }}
            />
          </>
        ))}

      <DialogoConfirmacion
        abierto={rechazando !== null}
        titulo="Rechazar el reembolso"
        textoConfirmar="Rechazar reembolso"
        variante="peligro"
        pedirMotivo
        etiquetaMotivo="Motivo por el que no procede el reembolso"
        alConfirmar={async (observacion) => {
          if (!rechazando) return;
          await resolverReembolso(rechazando.id, "RECHAZADO", { observacion });
          avisar.exito("Reembolso rechazado.");
          recargar();
        }}
        alCerrar={() => setRechazando(null)}
      >
        <p className="text-gris">
          Se notificará al solicitante el motivo del rechazo.
        </p>
      </DialogoConfirmacion>
    </div>
  );
}
