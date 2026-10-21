"use client";

import { useState } from "react";
import { CargadorArchivos } from "@/components/CargadorArchivos";
import { Alerta, Boton } from "@/components/formularios";
import { ErrorApi } from "@/lib/api";
import { fecha, hora, pesos } from "@/lib/formato";
import { crearOrden, ETIQUETAS_ORDEN, subirSoporte, type OrdenPago } from "@/lib/pagos";
import { descargarCotizacionPdf } from "@/lib/solicitudes";

/**
 * Pago por consignación de una solicitud cotizada. En solicitudes exentas este componente no se
 * muestra (lo decide quien lo usa con `esExenta`, que viene del servidor).
 */
export function PanelPago({
  solicitudId,
  consecutivo,
  alCambiar,
}: {
  solicitudId: string;
  consecutivo: string | null;
  alCambiar: () => void;
}) {
  const [orden, setOrden] = useState<OrdenPago | null>(null);
  const [cargando, setCargando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function obtenerOrden() {
    setCargando(true);
    setError(null);
    try {
      setOrden(await crearOrden(solicitudId));
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : "No pudimos generar la orden de pago.");
    } finally {
      setCargando(false);
    }
  }

  async function subir(archivo: File) {
    if (!orden) return;
    setSubiendo(true);
    setError(null);
    try {
      setOrden(await subirSoporte(orden.id, archivo));
      setAviso("Recibimos tu comprobante. Tesorería lo verificará.");
      alCambiar();
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : "No pudimos subir el comprobante.");
    } finally {
      setSubiendo(false);
    }
  }

  async function abrirCotizacion() {
    setError(null);
    try {
      const archivo = await descargarCotizacionPdf(solicitudId);
      const url = URL.createObjectURL(archivo);
      window.open(url, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : "No pudimos abrir la cotización.");
    }
  }

  return (
    <section aria-labelledby="titulo-pago" className="flex flex-col gap-4">
      <h2 id="titulo-pago" className="text-2xl font-bold">
        Pago
      </h2>
      {error && <Alerta tipo="error">{error}</Alerta>}
      {aviso && <Alerta tipo="exito">{aviso}</Alerta>}

      <div className="flex flex-wrap gap-3">
        <Boton variante="secundario" onClick={abrirCotizacion}>
          Ver la cotización en PDF
        </Boton>
        {!orden && (
          <Boton onClick={obtenerOrden} cargando={cargando}>
            Ver datos para consignar
          </Boton>
        )}
      </div>

      {orden && (
        <div className="flex flex-col gap-4 rounded-lg border border-gris-claro p-4">
          <p className="text-gris">
            Consigna el valor exacto y escribe esta referencia en el comprobante. Después sube la foto o el
            PDF.
          </p>
          <dl className="grid max-w-lg grid-cols-[auto_1fr] gap-x-6 gap-y-1">
            <dt className="font-medium">Referencia</dt>
            <dd className="font-bold">{orden.referencia}</dd>
            <dt className="font-medium">Valor a consignar</dt>
            <dd className="font-bold">{pesos(orden.valor)}</dd>
            <dt className="font-medium">Banco</dt>
            <dd>
              {orden.cuentaRecaudo.banco} · cuenta {orden.cuentaRecaudo.tipo}
            </dd>
            <dt className="font-medium">Número</dt>
            <dd>{orden.cuentaRecaudo.numero}</dd>
            <dt className="font-medium">Titular</dt>
            <dd>
              {orden.cuentaRecaudo.titular} · NIT {orden.cuentaRecaudo.nit}
            </dd>
            <dt className="font-medium">Plazo</dt>
            <dd>
              hasta el {fecha(orden.venceEn)} a las {hora(orden.venceEn)}
            </dd>
            <dt className="font-medium">Estado</dt>
            <dd>{ETIQUETAS_ORDEN[orden.estado]}</dd>
          </dl>
          {orden.observacionTesoreria && <Alerta tipo="info">{orden.observacionTesoreria}</Alerta>}
          {orden.estado === "PENDIENTE" || orden.estado === "RECHAZADA" ? (
            <CargadorArchivos
              etiqueta={`Subir comprobante de ${consecutivo ?? "la solicitud"}`}
              alElegir={subir}
              deshabilitado={subiendo}
            />
          ) : (
            <p className="text-gris">Ya subiste el comprobante.</p>
          )}
        </div>
      )}
    </section>
  );
}
