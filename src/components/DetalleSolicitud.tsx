"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Esqueleto, RegionCargando } from "@/components/Esqueleto";
import { EstadoError } from "@/components/EstadoError";
import { DialogoConfirmacion } from "@/components/DialogoConfirmacion";
import { InsigniaEstado } from "@/components/InsigniaEstado";
import { LineaTiempoSolicitud } from "@/components/LineaTiempoSolicitud";
import { PanelPago } from "@/components/PanelPago";
import { ResumenCotizacion } from "@/components/ResumenCotizacion";
import { Alerta, Boton } from "@/components/formularios";
import { useSesion } from "@/components/SesionProvider";
import { fecha, hora, pesos } from "@/lib/formato";
import {
  cancelarSolicitud,
  decidirSolicitud,
  ESTADOS,
  obtenerSolicitud,
  type DecidirSolicitud,
  type SolicitudDetalle,
} from "@/lib/solicitudes";
import { useConsulta } from "@/lib/useConsulta";

type Accion =
  | "cancelar"
  | "aprobar"
  | "devolver"
  | "rechazar"
  | "reclasificar"
  | null;

const ESTADOS_CANCELABLES = new Set(["ENVIADA", "EN_REVISION", "COTIZADA", "PAGO_PENDIENTE", "CONFIRMADA"]);
const ESTADOS_DECIDIBLES = new Set(["ENVIADA", "EN_REVISION"]);

/** Detalle de una solicitud. `modo` decide qué acciones se ofrecen. */
export function DetalleSolicitud({
  id,
  modo,
  rutaVolver,
}: {
  id: string;
  modo: "solicitante" | "revisor";
  rutaVolver: string;
}) {
  const { resultado, recargar } = useConsulta(() => obtenerSolicitud(id), [id]);
  const { tieneRol } = useSesion();
  const [accion, setAccion] = useState<Accion>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const volver = (
    <Link
      href={rutaVolver}
      className="inline-flex w-fit items-center gap-1 text-azul-oscuro underline underline-offset-4"
    >
      <ChevronLeft aria-hidden className="size-4" />
      Volver a la lista
    </Link>
  );

  if (resultado.estado === "cargando") {
    return (
      <RegionCargando etiqueta="Cargando la solicitud">
        <div className="flex flex-col gap-4">
          <Esqueleto className="h-6 w-40" />
          <Esqueleto className="h-10 w-2/3" />
          <Esqueleto className="h-48 w-full" />
        </div>
      </RegionCargando>
    );
  }

  if (resultado.estado === "error") {
    // Un id ajeno o inexistente responde 404.
    if (resultado.status === 404) {
      return (
        <div className="flex flex-col gap-4">
          {volver}
          <section className="rounded-lg border border-gris-claro bg-fondo-suave px-6 py-12 text-center">
            <h1 className="text-2xl font-bold">No encontramos esa solicitud</h1>
            <p className="mt-2 text-gris">Puede que el enlace esté mal o que no tengas acceso a ella.</p>
          </section>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-4">
        {volver}
        <EstadoError mensaje={resultado.mensaje} alReintentar={recargar} />
      </div>
    );
  }

  const s: SolicitudDetalle = resultado.datos;
  const avalAprobado = s.decisiones.some((d) => d.tipo === "AVAL" && d.resultado === "APROBADA");
  const tipoDecision: DecidirSolicitud["tipo"] =
    !avalAprobado && tieneRol("RESPONSABLE_ESPACIO") ? "AVAL" : "APROBACION";
  const puedeCancelar = modo === "solicitante" && ESTADOS_CANCELABLES.has(s.estado);
  const puedeDecidir =
    modo === "revisor" &&
    ESTADOS_DECIDIBLES.has(s.estado) &&
    tieneRol("RESPONSABLE_ESPACIO", "APROBADOR");

  async function decidir(resultadoDecision: DecidirSolicitud["resultado"], motivo: string) {
    await decidirSolicitud(s.id, {
      tipo: tipoDecision,
      resultado: resultadoDecision,
      motivo: motivo || undefined,
    });
    setAviso("Tu decisión quedó registrada.");
    recargar();
  }

  async function cancelar(motivo: string) {
    const r = await cancelarSolicitud(s.id, motivo);
    setAviso(
      r.valorReembolso > 0
        ? `Solicitud cancelada. Se reembolsará ${pesos(r.valorReembolso)} (${r.porcentajeReembolso} %).`
        : "Solicitud cancelada.",
    );
    recargar();
  }

  return (
    <div className="flex flex-col gap-8">
      {volver}

      <header className="flex flex-col gap-2">
        <p className="font-bold tracking-wide text-gris">{s.consecutivo ?? "Borrador sin enviar"}</p>
        <h1 className="text-3xl font-extrabold sm:text-4xl">{s.objetoEvento}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <InsigniaEstado estado={s.estado} />
          <span className="text-gris">{ESTADOS[s.estado].proxima}</span>
        </div>
      </header>

      {aviso && <Alerta tipo="exito">{aviso}</Alerta>}

      {(puedeCancelar || puedeDecidir) && (
        <div className="flex flex-wrap gap-3">
          {puedeDecidir && (
            <>
              <Boton onClick={() => setAccion("aprobar")}>
                {tipoDecision === "AVAL" ? "Dar aval" : "Aprobar"}
              </Boton>
              <Boton variante="secundario" onClick={() => setAccion("devolver")}>
                Devolver
              </Boton>
              <Boton variante="secundario" onClick={() => setAccion("rechazar")}>
                Rechazar
              </Boton>
              {tipoDecision === "APROBACION" && s.esExenta && (
                <Boton variante="secundario" onClick={() => setAccion("reclasificar")}>
                  Reclasificar como uso particular
                </Boton>
              )}
            </>
          )}
          {puedeCancelar && (
            <Boton variante="secundario" onClick={() => setAccion("cancelar")}>
              Cancelar solicitud
            </Boton>
          )}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="titulo-evento" className="flex flex-col gap-2">
          <h2 id="titulo-evento" className="text-2xl font-bold">
            El evento
          </h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            <dt className="font-medium">Asistentes</dt>
            <dd>{s.asistentesEstimados}</dd>
            {s.descripcion && (
              <>
                <dt className="font-medium">Descripción</dt>
                <dd>{s.descripcion}</dd>
              </>
            )}
            {s.responsableEnSitio && (
              <>
                <dt className="font-medium">Responsable</dt>
                <dd>{s.responsableEnSitio}</dd>
              </>
            )}
            {s.telefonoContacto && (
              <>
                <dt className="font-medium">Teléfono</dt>
                <dd>{s.telefonoContacto}</dd>
              </>
            )}
            <dt className="font-medium">Evento público</dt>
            <dd>{s.eventoPublico ? "Sí" : "No"}</dd>
            <dt className="font-medium">Uso</dt>
            <dd>{s.esExenta ? "Institucional · sin costo" : "Con tarifa"}</dd>
            {s.venceEn && (
              <>
                <dt className="font-medium">Vence</dt>
                <dd>
                  {fecha(s.venceEn)} · {hora(s.venceEn)}
                </dd>
              </>
            )}
          </dl>
        </section>

        <section aria-labelledby="titulo-historial" className="flex flex-col gap-3">
          <h2 id="titulo-historial" className="text-2xl font-bold">
            Seguimiento
          </h2>
          <LineaTiempoSolicitud solicitud={s} />
        </section>
      </div>

      <section aria-labelledby="titulo-franjas" className="flex flex-col gap-3">
        <h2 id="titulo-franjas" className="text-2xl font-bold">
          Horarios solicitados
        </h2>
        {s.reservas.length === 0 ? (
          <p className="text-gris">Esta solicitud todavía no tiene horarios.</p>
        ) : (
          <ul className="divide-y divide-gris-claro rounded-lg border border-gris-claro">
            {s.reservas.map((r) => (
              <li key={r.id} className="flex flex-wrap justify-between gap-2 px-4 py-2">
                <span>
                  {fecha(r.inicio)} · {hora(r.inicio)} a {hora(r.fin)}
                </span>
                {!s.esExenta && <span className="font-medium">{pesos(r.subtotal)}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {s.servicios.length > 0 && (
        <section aria-labelledby="titulo-servicios" className="flex flex-col gap-3">
          <h2 id="titulo-servicios" className="text-2xl font-bold">
            Servicios
          </h2>
          <ul className="divide-y divide-gris-claro rounded-lg border border-gris-claro">
            {s.servicios.map((x) => (
              <li key={x.id} className="flex flex-wrap justify-between gap-2 px-4 py-2">
                <span>
                  {x.cantidad} × {x.nombre}
                </span>
                {!s.esExenta && <span className="font-medium">{pesos(x.subtotal)}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {s.cotizacion && <ResumenCotizacion cotizacion={s.cotizacion} esExenta={s.esExenta} />}

      {modo === "solicitante" && !s.esExenta && (s.estado === "COTIZADA" || s.estado === "PAGO_PENDIENTE") && (
        <PanelPago solicitudId={s.id} consecutivo={s.consecutivo} alCambiar={recargar} />
      )}

      <DialogoConfirmacion
        abierto={accion === "cancelar"}
        titulo="¿Cancelar esta solicitud?"
        textoConfirmar="Cancelar solicitud"
        variante="peligro"
        pedirMotivo
        etiquetaMotivo="Motivo de la cancelación"
        alConfirmar={cancelar}
        alCerrar={() => setAccion(null)}
      >
        <p className="text-gris">
          Se libera el horario. Si ya pagaste, el valor a reembolsar depende de la política de
          cancelación.
        </p>
      </DialogoConfirmacion>

      <DialogoConfirmacion
        abierto={accion === "aprobar"}
        titulo={tipoDecision === "AVAL" ? "¿Dar el aval?" : "¿Aprobar la solicitud?"}
        textoConfirmar={tipoDecision === "AVAL" ? "Dar aval" : "Aprobar"}
        alConfirmar={(motivo) => decidir("APROBADA", motivo)}
        alCerrar={() => setAccion(null)}
      />
      <DialogoConfirmacion
        abierto={accion === "devolver"}
        titulo="Devolver la solicitud"
        textoConfirmar="Devolver"
        pedirMotivo
        etiquetaMotivo="Qué debe corregir el solicitante"
        alConfirmar={(motivo) => decidir("DEVUELTA", motivo)}
        alCerrar={() => setAccion(null)}
      />
      <DialogoConfirmacion
        abierto={accion === "rechazar"}
        titulo="Rechazar la solicitud"
        textoConfirmar="Rechazar"
        variante="peligro"
        pedirMotivo
        etiquetaMotivo="Motivo del rechazo"
        alConfirmar={(motivo) => decidir("RECHAZADA", motivo)}
        alCerrar={() => setAccion(null)}
      />
      <DialogoConfirmacion
        abierto={accion === "reclasificar"}
        titulo="Reclasificar como uso particular"
        textoConfirmar="Reclasificar"
        pedirMotivo
        etiquetaMotivo="Por qué no es uso institucional"
        alConfirmar={(motivo) => decidir("RECLASIFICADA", motivo)}
        alCerrar={() => setAccion(null)}
      >
        <p className="text-gris">La solicitud pasará a tarifa de persona natural y se cotizará.</p>
      </DialogoConfirmacion>
    </div>
  );
}
