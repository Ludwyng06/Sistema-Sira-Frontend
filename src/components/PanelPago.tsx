"use client";

import { useEffect, useRef, useState } from "react";
import { CargadorArchivos } from "@/components/CargadorArchivos";
import { Alerta, Boton } from "@/components/formularios";
import { fecha, hora, pesos } from "@/lib/formato";
import { crearOrden, ETIQUETAS_ORDEN, iniciarPagoEnLinea, obtenerInstruccionesPago, subirSoporte, type InstruccionesPago, type OrdenPago } from "@/lib/pagos";
import { ErrorApi } from "@/lib/api";
import { guardarArchivo } from "@/lib/descarga";
import { descargarCotizacionPdf } from "@/lib/solicitudes";
import { avisar } from "@/lib/avisos";

/**
 * Pago por enlace y verificación manual. La disponibilidad de la pasarela viene del servidor.
 */
export function PanelPago({
  solicitudId,
  consecutivo,
  esExenta,
  valorCotizado,
  alCambiar,
}: {
  solicitudId: string;
  consecutivo: string | null;
  esExenta: boolean;
  valorCotizado: number | null;
  alCambiar: () => void;
}) {
  const [orden, setOrden] = useState<OrdenPago | null>(null);
  const [instrucciones, setInstrucciones] = useState<InstruccionesPago | null>(null);
  const [copiada, setCopiada] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [abriendoPasarela, setAbriendoPasarela] = useState(false);
  const [conflictoPago, setConflictoPago] = useState(false);
  const iniciando = useRef(false);
  const mensajeError = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState<{ archivo: File; url: string } | null>(null);

  useEffect(() => {
    if (error) mensajeError.current?.focus();
  }, [error]);

  const puedePagarEnLinea = instrucciones?.pasarelaEnLinea === true && !esExenta && valorCotizado !== null && valorCotizado > 0 &&
    !conflictoPago && (!orden || (orden.valor > 0 &&
      (orden.estado === "PENDIENTE" || orden.estado === "RECHAZADA")));

  async function pagarEnLinea() {
    if (!puedePagarEnLinea || iniciando.current) return;
    iniciando.current = true;
    setAbriendoPasarela(true);
    setError(null);
    try {
      const actual = orden ?? await crearOrden(solicitudId);
      setOrden(actual);
      if (actual.valor <= 0 || (actual.estado !== "PENDIENTE" && actual.estado !== "RECHAZADA")) {
        setConflictoPago(true);
        setError("Esta orden no está disponible para pago en línea. Actualiza la solicitud para consultar su estado.");
        return;
      }
      const { urlCheckout } = await iniciarPagoEnLinea(actual.id);
      const destino = new URL(urlCheckout);
      if (destino.protocol !== "https:") throw new Error("Checkout inválido");
      window.location.assign(destino.href);
    } catch (e) {
      if (e instanceof ErrorApi && e.status === 409) setConflictoPago(true);
      setError(e instanceof ErrorApi ? e.message : "No pudimos abrir el pago en línea. Intenta de nuevo.");
    } finally {
      iniciando.current = false;
      setAbriendoPasarela(false);
    }
  }

  function elegir(archivo: File) {
    if (revision) URL.revokeObjectURL(revision.url);
    setRevision({ archivo, url: URL.createObjectURL(archivo) });
  }

  function descartar() {
    if (revision) URL.revokeObjectURL(revision.url);
    setRevision(null);
  }

  async function obtenerOrden() {
    setCargando(true);
    setError(null);
    setInstrucciones(null);
    setCopiada(false);
    try {
      const actual = await crearOrden(solicitudId);
      setOrden(actual);
      if (["PENDIENTE", "RECHAZADA", "EN_VERIFICACION"].includes(actual.estado)) {
        const datos = await obtenerInstruccionesPago(actual.id);
        setInstrucciones(datos);
        setOrden({ ...actual, estado: datos.estado, valor: datos.valor, referencia: datos.referencia, venceEn: datos.venceEn });
      }
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : "No pudimos cargar las instrucciones de pago. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  async function copiarReferencia() {
    if (!instrucciones) return;
    try {
      await navigator.clipboard.writeText(instrucciones.referencia);
      setCopiada(true);
    } catch {
      setError("No pudimos copiar la referencia. Puedes seleccionarla y copiarla manualmente.");
    }
  }

  async function subir(archivo: File) {
    if (!orden) return;
    setSubiendo(true);
    setError(null);
    try {
      setOrden(await subirSoporte(orden.id, archivo));
      descartar();
      avisar.exito("Recibimos tu comprobante. Tesorería lo verificará.");
      alCambiar();
    } catch (e) {
      avisar.error(e, "No pudimos subir el comprobante.");
    } finally {
      setSubiendo(false);
    }
  }

  async function abrirCotizacion() {
    setError(null);
    try {
      const archivo = await descargarCotizacionPdf(solicitudId);
      guardarArchivo(archivo, `Cotizacion-${consecutivo ?? "SIRA"}.pdf`);
    } catch (e) {
      avisar.error(e, "No pudimos descargar la cotización.");
    }
  }

  if (esExenta) return null;

  return (
    <section aria-labelledby="titulo-pago" className="flex flex-col gap-4">
      <h2 id="titulo-pago" className="text-2xl font-bold">
        Pagar tu orden
      </h2>
      {error && <div ref={mensajeError} tabIndex={-1}><Alerta tipo="error">{error}</Alerta></div>}
      <p role="status" aria-live="polite" aria-atomic="true">
        {abriendoPasarela ? "Estamos abriendo el pago en línea…" : cargando ? "Cargando instrucciones de pago…" : copiada ? "Referencia copiada" : ""}
      </p>

      <div className="flex flex-wrap gap-3">
        <Boton variante="secundario" onClick={abrirCotizacion}>
          Descargar la cotización en PDF
        </Boton>
        {(!orden || (!instrucciones && !cargando)) && (
          <Boton onClick={obtenerOrden} cargando={cargando} disabled={abriendoPasarela}>
            Ver instrucciones de pago
          </Boton>
        )}
        {puedePagarEnLinea && (
          <Boton onClick={pagarEnLinea} cargando={abriendoPasarela} disabled={cargando || subiendo} aria-busy={abriendoPasarela}>
            Pagar en línea (PSE, tarjeta, Nequi)
          </Boton>
        )}
      </div>

      {orden && !instrucciones && !cargando && !error && (
        <p role="status">{ETIQUETAS_ORDEN[orden.estado]}</p>
      )}

      {orden && instrucciones && (
        <ol aria-label="Pasos para pagar tu orden" className="flex list-none flex-col gap-6 rounded-campo border border-gris-claro p-4 sm:p-6">
          <li className="flex min-w-0 flex-col gap-4">
            <h3 className="text-xl font-bold">1. Realiza el pago</h3>
            <p className="text-gris">
              Paga el valor exacto e indica esta referencia. Después carga el comprobante para que tesorería lo revise.
            </p>
            <dl className="grid min-w-0 grid-cols-1 gap-y-2 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-x-6">
              <dt className="font-medium">Referencia</dt>
              <dd className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="break-all font-bold">{instrucciones.referencia}</span>
                <Boton variante="secundario" onClick={copiarReferencia}>Copiar referencia</Boton>
              </dd>
              <dt className="font-medium">Valor en pesos</dt>
              <dd className="font-bold">{pesos(instrucciones.valor)}</dd>
              <dt className="font-medium">Tipo</dt>
              <dd>{{ TOTAL: "Pago total", ANTICIPO: "Anticipo", SALDO: "Saldo" }[instrucciones.tipo]}</dd>
              <dt className="font-medium">Fecha límite</dt>
              <dd>
                <time dateTime={instrucciones.venceEn}>hasta el {fecha(instrucciones.venceEn)} a las {hora(instrucciones.venceEn)}</time>
              </dd>
              <dt className="font-medium">Estado</dt>
              <dd>{ETIQUETAS_ORDEN[orden.estado]}</dd>
            </dl>
            {instrucciones.instrucciones && <p className="whitespace-pre-wrap break-words">{instrucciones.instrucciones}</p>}
            {instrucciones.enlacePago ? (
              <a href={instrucciones.enlacePago} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-campo bg-azul px-5 py-3 text-center font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azul">
                Ir al enlace de pago<span className="sr-only"> (abre en una pestaña nueva)</span>
              </a>
            ) : <Alerta tipo="info">La universidad aún no publica el enlace de pago</Alerta>}
          </li>
          <li className="flex min-w-0 flex-col gap-4">
            <h3 className="text-xl font-bold">2. Carga el comprobante</h3>
            {orden.observacionTesoreria && <Alerta tipo="info">{orden.observacionTesoreria}</Alerta>}
            {orden.estado === "RECHAZADA" && <Alerta tipo="info">El comprobante fue rechazado. Revisa la observación de tesorería y sube uno nuevo.</Alerta>}
            {orden.estado === "PENDIENTE" || orden.estado === "RECHAZADA" ? (
              revision ? (
                <div className="flex flex-col gap-3 rounded-tarjeta bg-fondo-suave p-4">
                  <h3 className="text-xl font-extrabold">Revisa tu comprobante antes de enviarlo</h3>
                  <p className="text-base">
                    Debe verse el valor de <strong>{pesos(orden.valor)}</strong> y la referencia{" "}
                    <strong>{orden.referencia}</strong>. Una vez enviado, Tesorería lo revisa.
                  </p>
                  <div className="overflow-hidden rounded-campo border border-gris-claro bg-fondo">
                    {revision.archivo.type.startsWith("image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={revision.url} alt={`Vista previa de ${revision.archivo.name}`} className="max-h-[28rem] w-full object-contain" />
                    ) : (
                      <iframe src={revision.url} title={`Vista previa de ${revision.archivo.name}`} className="h-[28rem] w-full" />
                    )}
                  </div>
                  <p className="text-meta text-gris">
                    {revision.archivo.name} · {(revision.archivo.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Boton onClick={() => subir(revision.archivo)} cargando={subiendo} disabled={abriendoPasarela}>
                      Enviar comprobante
                    </Boton>
                    <Boton variante="secundario" onClick={descartar} disabled={subiendo}>
                      Elegir otro archivo
                    </Boton>
                  </div>
                </div>
              ) : (
                <CargadorArchivos
                  etiqueta={`Subir comprobante de ${consecutivo ?? "la solicitud"}`}
                  alElegir={elegir}
                  deshabilitado={subiendo || abriendoPasarela}
                />
              )
            ) : (
              <p role="status" className="text-gris">{orden.estado === "EN_VERIFICACION" ? "Comprobante en revisión por tesorería" : ETIQUETAS_ORDEN[orden.estado]}</p>
            )}
          </li>
          {instrucciones.whatsapp && (
            <li className="flex min-w-0 flex-col gap-3">
              <h3 className="text-xl font-bold">3. Avisa al área</h3>
              <p className="text-gris">Después de cargar el comprobante, avisa al área para que revise tu pago.</p>
              <a href={instrucciones.whatsapp.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-campo border-2 border-azul px-5 py-3 text-center font-bold text-azul-oscuro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azul">
                Avisar al área por WhatsApp<span className="sr-only"> (abre en una pestaña nueva)</span>
              </a>
            </li>
          )}
        </ol>
      )}
    </section>
  );
}
