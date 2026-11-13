"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Alerta, Boton } from "@/components/formularios";
import { ErrorApi } from "@/lib/api";
import { pesos } from "@/lib/formato";
import { consultarEstadoPago, type EstadoPagoEnLinea } from "@/lib/pagos";

const INTERVALO_MS = 5_000;
const LIMITE_MS = 120_000;

const MENSAJES = {
  APROBADA: "Pago aprobado",
  PAGADA: "Pago aprobado",
  RECHAZADA: "Pago rechazado",
  ANULADA: "Pago anulado",
  ERROR: "El pago no pudo completarse",
  PENDIENTE: "Pago pendiente de confirmación",
} satisfies Record<EstadoPagoEnLinea["estado"], string>;

/** Solo usa el identificador de la orden para consultar SIRA (RN-12). */
export function RetornoPago({ ordenId }: { ordenId: string | null }) {
  const titulo = useRef<HTMLHeadingElement>(null);
  const [intento, setIntento] = useState(0);
  const [pago, setPago] = useState<EstadoPagoEnLinea | null>(null);
  const [confirmando, setConfirmando] = useState(Boolean(ordenId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { titulo.current?.focus(); }, []);

  useEffect(() => {
    if (!ordenId) return;
    const controlador = new AbortController();
    let activo = true;
    let proximaConsulta: ReturnType<typeof setTimeout> | undefined;
    let ultimoError: string | null = null;
    const limite = setTimeout(() => terminar(ultimoError), LIMITE_MS);

    function terminar(mensaje: string | null = null) {
      if (!activo) return;
      activo = false;
      clearTimeout(limite);
      clearTimeout(proximaConsulta);
      controlador.abort();
      setConfirmando(false);
      setError(mensaje);
    }

    async function consultar() {
      try {
        const respuesta = await consultarEstadoPago(ordenId!, controlador.signal);
        if (!activo) return;
        ultimoError = null;
        setError(null);
        setPago(respuesta);
        if (respuesta.estado !== "PENDIENTE") {
          terminar();
          return;
        }
      } catch (e) {
        if (!activo) return;
        ultimoError = e instanceof ErrorApi ? e.message : "No pudimos consultar el estado de tu pago.";
        // Fallos de red se reintentan; sin acceso a la orden se detiene la consulta.
        if (e instanceof ErrorApi && [401, 403, 404].includes(e.status)) {
          terminar(ultimoError);
          return;
        }
        setError(ultimoError);
      }
      if (activo) proximaConsulta = setTimeout(consultar, INTERVALO_MS);
    }

    void consultar();
    return () => {
      activo = false;
      clearTimeout(limite);
      clearTimeout(proximaConsulta);
      controlador.abort();
    };
  }, [ordenId, intento]);

  function reintentar() {
    setError(null);
    setPago(null);
    setConfirmando(true);
    setIntento((anterior) => anterior + 1);
    titulo.current?.focus();
  }

  const pendiente = !pago || pago.estado === "PENDIENTE";

  return (
    <section aria-labelledby="titulo-retorno-pago" className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <h1 id="titulo-retorno-pago" ref={titulo} tabIndex={-1} className="text-t1 font-black">
        Estado de tu pago
      </h1>
      {!ordenId ? (
        <Alerta tipo="error">Falta el identificador de la orden. Abre tu solicitud para consultar el pago.</Alerta>
      ) : (
        <>
          <div role="status" aria-live="polite" aria-atomic="true" className="rounded-campo border border-gris-claro bg-fondo-suave p-5">
            <h2 className="text-xl font-bold">
              {confirmando ? "Estamos confirmando tu pago" : pago ? MENSAJES[pago.estado] : "No pudimos confirmar tu pago"}
            </h2>
            {confirmando && <p>Consultamos el estado en SIRA cada 5 segundos, durante un máximo de 2 minutos.</p>}
            {pendiente && (
              <p>Los pagos por PSE pueden tardar varios minutos. Te notificaremos cuando se confirme el resultado. Evita realizar otro pago mientras está pendiente.</p>
            )}
            {pago && (pago.estado === "APROBADA" || pago.estado === "PAGADA") && <p>SIRA confirmó tu pago. Puedes consultar tu reserva en Mis solicitudes.</p>}
            {pago && ["RECHAZADA", "ANULADA", "ERROR"].includes(pago.estado) && <p>Revisa el resultado en tu entidad financiera y vuelve a tu solicitud para consultar las opciones de pago.</p>}
          </div>
          {pago && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
              <dt className="font-bold">Referencia</dt><dd className="break-all">{pago.referencia}</dd>
              <dt className="font-bold">Valor (COP)</dt><dd>{pesos(pago.valor)}</dd>
            </dl>
          )}
          {error && <Alerta tipo="error">{error} {confirmando && "Volveremos a consultar automáticamente."}</Alerta>}
          {!confirmando && pendiente && <Boton onClick={reintentar}>Volver a consultar el estado</Boton>}
        </>
      )}
      <Link href="/mis-solicitudes" className="inline-flex min-h-12 items-center font-bold text-azul-oscuro underline underline-offset-4">Ir a Mis solicitudes</Link>
    </section>
  );
}
