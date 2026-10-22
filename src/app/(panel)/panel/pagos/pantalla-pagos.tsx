"use client";

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
  ETIQUETAS_ORDEN,
  listarOrdenes,
  verificarPago,
  type EstadoOrden,
  type OrdenPagoResumen,
} from "@/lib/pagos";
import { useConsulta } from "@/lib/useConsulta";
import { avisar } from "@/lib/avisos";

const PESTANAS: { estado: EstadoOrden; texto: string }[] = [
  { estado: "EN_VERIFICACION", texto: "Por verificar" },
  { estado: "APROBADA", texto: "Aprobados" },
  { estado: "RECHAZADA", texto: "Rechazados" },
  { estado: "VENCIDA", texto: "Vencidos" },
];

const POR_PAGINA = 20;

export function PantallaPagos() {
  const { tieneRol } = useSesion();
  const puedeVerificar = tieneRol("TESORERIA");
  const [estado, setEstado] = useState<EstadoOrden>("EN_VERIFICACION");
  const [pagina, setPagina] = useState(1);
  const [rechazando, setRechazando] = useState<OrdenPagoResumen | null>(null);
  const [errorSoporte, setErrorSoporte] = useState<string | null>(null);
  const { resultado, recargar } = useConsulta(
    () => listarOrdenes({ estado, pagina, porPagina: POR_PAGINA }),
    [estado, pagina],
  );

  async function verSoporte(orden: OrdenPagoResumen) {
    setErrorSoporte(null);
    try {
      const archivo = await descargarSoporte(orden.id);
      const url = URL.createObjectURL(archivo);
      window.open(url, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
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
        <h1 className="text-4xl font-black sm:text-5xl">Pagos</h1>
        <p className="text-gris">Verifica las consignaciones de las solicitudes cotizadas.</p>
      </header>

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
            }}
            className={clsx(
              "rounded px-4 py-2 font-medium",
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
                  className="flex flex-col gap-2 rounded-lg border border-gris-claro p-4 shadow-sm"
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
                  <p className="text-sm text-gris">
                    {ETIQUETAS_ORDEN[o.estado]} · vence el {fecha(o.venceEn)} a las{" "}
                    {hora(o.venceEn)}
                    {o.pagadoEn && <> · pagado el {fecha(o.pagadoEn)}</>}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {o.tieneSoporte && (
                      <Boton variante="secundario" onClick={() => verSoporte(o)}>
                        Ver comprobante
                      </Boton>
                    )}
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
              alCambiar={setPagina}
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
    </div>
  );
}
