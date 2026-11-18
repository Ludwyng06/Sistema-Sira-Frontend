"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, PartyPopper } from "lucide-react";
import { Esqueleto, RegionCargando } from "@/components/Esqueleto";
import { EstadoError } from "@/components/EstadoError";
import { DialogoConfirmacion } from "@/components/DialogoConfirmacion";
import { InsigniaEstado } from "@/components/InsigniaEstado";
import { LineaEstaciones } from "@/components/LineaEstaciones";
import { LineaTiempoSolicitud } from "@/components/LineaTiempoSolicitud";
import { BotonImprimir } from "@/components/BotonImprimir";
import { EncabezadoImpresion } from "@/components/EncabezadoImpresion";
import { PanelPago } from "@/components/PanelPago";
import { ResumenCotizacion } from "@/components/ResumenCotizacion";
import { BotonDescarga } from "@/components/BotonDescarga";
import { DocumentosSolicitud } from "@/components/DocumentosSolicitud";
import { CalendarioEspacio } from "@/components/CalendarioEspacio";
import { DetalleFranja, DetalleServicio, TotalesEstimados } from "@/components/DesgloseEstimado";
import { NombreDependencia } from "@/components/NombreDependencia";
import { SimulacionCancelacion } from "@/components/SimulacionCancelacion";
import { Alerta, Boton } from "@/components/formularios";
import { useSesion } from "@/components/SesionProvider";
import { fecha, hora, pesos } from "@/lib/formato";
import {
  cancelarSolicitud,
  decidirSolicitud,
  ESTADOS,
  obtenerSolicitud,
  descargarCotizacionPdf,
  type DecidirSolicitud,
  type SolicitudDetalle,
} from "@/lib/solicitudes";

const ESTADO_REEMBOLSO = {
  SOLICITADO: "En trámite con Tesorería",
  APLICADO: "Reembolsado",
  RECHAZADO: "Rechazado",
} as const;
import { useConsulta } from "@/lib/useConsulta";
import { avisar } from "@/lib/avisos";
import { descargarActaPdf } from "@/lib/actas";

type Accion =
  | "cancelar"
  | "aprobar"
  | "devolver"
  | "rechazar"
  | "reclasificar"
  | null;

/** RN-14: el backend solo deja cancelar una solicitud confirmada (en otro estado responde 409 SOLICITUD_NO_CANCELABLE). */
const ESTADOS_CANCELABLES = new Set(["CONFIRMADA"]);
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
  // Hora en que se abrió la ficha: basta para saber si el evento ya empezó (la API lo vuelve a validar).
  const [abiertaEn] = useState(() => Date.now());

  const volver = (
    <Link
      href={rutaVolver}
      className="inline-flex min-h-11 w-fit items-center gap-1 font-bold text-azul-oscuro underline underline-offset-4"
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
          <section className="rounded-campo border border-gris-claro bg-fondo-suave px-6 py-12 text-center">
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
  const puedeAvalar = !avalAprobado && tieneRol("RESPONSABLE_ESPACIO");
  const tipoDecision: DecidirSolicitud["tipo"] =
    puedeAvalar ? "AVAL" : "APROBACION";
  // El administrador también cancela desde la bandeja: es una cancelación por causa institucional (100 % de reembolso).
  const cancelaInstitucion = modo === "revisor" && tieneRol("ADMINISTRADOR");
  // La API no deja cancelar cuando el evento ya empezó (primera franja en curso o pasada).
  const eventoEmpezado =
    s.reservas.length > 0 && Math.min(...s.reservas.map((r) => Date.parse(r.inicio))) <= abiertaEn;
  const cancelable = ESTADOS_CANCELABLES.has(s.estado) && (modo === "solicitante" || cancelaInstitucion);
  const puedeCancelar = cancelable && !eventoEmpezado;
  const ultimaDecision = s.decisiones.at(-1);
  // Solo se destaca el motivo mientras siga vigente: rechazada, o devuelta y todavía en borrador.
  const motivoVigente =
    ultimaDecision?.motivo &&
    ((s.estado === "RECHAZADA" && ultimaDecision.resultado === "RECHAZADA") ||
      (s.estado === "BORRADOR" && ultimaDecision.resultado === "DEVUELTA"))
      ? ultimaDecision
      : null;
  const puedeDecidir =
    modo === "revisor" &&
    ESTADOS_DECIDIBLES.has(s.estado) &&
    (puedeAvalar || tieneRol("APROBADOR"));

  async function decidir(resultadoDecision: DecidirSolicitud["resultado"], motivo: string) {
    await decidirSolicitud(s.id, {
      tipo: tipoDecision,
      resultado: resultadoDecision,
      motivo: motivo || undefined,
    });
    avisar.exito("Tu decisión quedó registrada.");
    recargar();
  }

  async function cancelar(motivo: string) {
    const r = await cancelarSolicitud(s.id, motivo);
    avisar.exito(
      r.valorReembolso > 0
        ? `Solicitud cancelada. Se reembolsará ${pesos(r.valorReembolso)} (${r.porcentajeReembolso} %).`
        : "Solicitud cancelada.",
    );
    recargar();
  }

  return (
    <div className="flex flex-col gap-8">
      <EncabezadoImpresion documento={`Solicitud ${s.consecutivo ?? "(borrador)"}`} />
      <div className="no-imprimir">{volver}</div>

      <header className="flex flex-col gap-2">
        <p className="font-bold tracking-wide text-gris">{s.consecutivo ?? "Borrador sin enviar"}</p>
        <h1 className="text-t1 font-black">{s.objetoEvento}</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <InsigniaEstado estado={s.estado} />
          <span className="text-lg text-gris">{ESTADOS[s.estado].proxima}</span>
        </div>
        <BotonImprimir titulo={`Solicitud ${s.consecutivo ?? "borrador"} - SIRA`} className="mt-2" />
      </header>

      {s.reembolso ? (
        <section
          aria-labelledby="titulo-reembolso"
          className="flex flex-col gap-2 rounded-tarjeta border-2 border-azul bg-turquesa-suave p-5"
        >
          <h2 id="titulo-reembolso" className="text-xl font-extrabold">
            Reembolso
          </h2>
          <p className="text-t2 font-black">{pesos(s.reembolso.valor)}</p>
          {s.reembolso.porcentaje !== null && <p>{s.reembolso.porcentaje} % del valor pagado</p>}
          <p>
            <span className="font-bold">Estado: </span>
            {ESTADO_REEMBOLSO[s.reembolso.estado]}
          </p>
          <p>
            <span className="font-bold">Motivo: </span>
            {s.reembolso.motivo}
          </p>
          <p className="text-gris">
            Registrado el {fecha(s.reembolso.creadoEn)} a las {hora(s.reembolso.creadoEn)}
          </p>
        </section>
      ) : (
        s.reembolso === null &&
        (s.estado === "CANCELADA" || s.estado === "REEMBOLSADA") && (
          <section aria-labelledby="titulo-reembolso" className="rounded-tarjeta border border-gris-claro/60 bg-fondo-suave p-5">
            <h2 id="titulo-reembolso" className="text-xl font-extrabold">
              Reembolso
            </h2>
            <p>Esta cancelación no tiene reembolso.</p>
          </section>
        )
      )}

      {motivoVigente && (
        <Alerta
          tipo={motivoVigente.resultado === "RECHAZADA" ? "error" : "info"}
          titulo={motivoVigente.resultado === "RECHAZADA" ? "Motivo del rechazo" : "Solicitud devuelta para corregir"}
          queHacer={
            motivoVigente.resultado === "RECHAZADA"
              ? undefined
              : modo === "solicitante"
                ? "Corrige lo que te pidieron y vuelve a enviar la solicitud."
                : undefined
          }
        >
          <p className="whitespace-pre-line">{motivoVigente.motivo}</p>
          <p className="text-base text-gris">
            {fecha(motivoVigente.decididaEn)} · {hora(motivoVigente.decididaEn)}
          </p>
        </Alerta>
      )}

      {modo === "solicitante" && motivoVigente?.resultado === "DEVUELTA" && (
        <Link
          href={`/solicitar?borrador=${encodeURIComponent(s.id)}`}
          className="no-imprimir w-fit rounded-campo bg-azul px-5 py-3 font-bold text-white shadow-[0_2px_0_0_var(--color-azul-oscuro)] transition duration-200 hover:-translate-y-px hover:bg-azul-oscuro motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        >
          Corregir la solicitud
        </Link>
      )}

      <section aria-labelledby="titulo-linea" className="rounded-tarjeta border border-gris-claro/60 bg-fondo-suave px-4 py-6 sm:px-8">
        <h2 id="titulo-linea" className="mb-5 text-xl font-extrabold">
          Dónde va tu solicitud
        </h2>
        <LineaEstaciones estado={s.estado} esExenta={s.esExenta} />
      </section>

      {puedeDecidir && tipoDecision === "APROBACION" && !avalAprobado && (
        <Alerta tipo="info" titulo="Primero el aval del responsable">
          Si el espacio pide aval, el responsable debe darlo antes de que puedas aprobar. Si ves el aviso “Falta el
          aval”, pídele que revise esta solicitud. Si el espacio no tiene responsable, avisa a administración para
          que le asigne uno en Inventario.
        </Alerta>
      )}

      {puedeDecidir && tipoDecision === "APROBACION" && avalAprobado && (
        <section
          aria-labelledby="titulo-aval"
          className="anim-sello flex items-start gap-4 rounded-tarjeta border-2 border-verde bg-exito-suave p-5 text-exito-texto"
        >
          <PartyPopper aria-hidden className="mt-1 size-8 shrink-0" />
          <div className="flex flex-col gap-1">
            <h2 id="titulo-aval" className="text-xl font-extrabold">
              ¡El responsable del espacio ya dio su aval!
            </h2>
            <p className="text-base">
              {(() => {
                const aval = s.decisiones.find((d) => d.tipo === "AVAL" && d.resultado === "APROBADA");
                return aval ? `Lo dio el ${fecha(aval.decididaEn)} a las ${hora(aval.decididaEn)} ` : "";
              })()}
              Ya puedes revisar la solicitud y aprobarla.
            </p>
          </div>
        </section>
      )}

      {cancelable && eventoEmpezado && (
        <p className="text-sm text-gris">El evento ya empezó, así que esta solicitud ya no se puede cancelar.</p>
      )}

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
            <dd>
              {s.esExenta
                ? "Institucional · sin costo"
                : s.estado === "BORRADOR" && s.declaraUsoInstitucional
                  ? "Institucional (se confirma al enviar)"
                  : "Con tarifa"}
            </dd>
            {s.dependenciaId && (s.esExenta || s.declaraUsoInstitucional) && (
              <>
                <dt className="font-medium">Dependencia</dt>
                <dd>
                  <NombreDependencia id={s.dependenciaId} />
                </dd>
              </>
            )}
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
            Historial
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
          <ul className="divide-y divide-gris-claro rounded-campo border border-gris-claro">
            {s.reservas.map((r) => (
              <li key={r.id} className="flex flex-wrap justify-between gap-2 px-4 py-2">
                <span>
                  {r.espacioCodigo && r.espacioNombre ? `${r.espacioCodigo} · ${r.espacioNombre} — ` : ""}
                  {fecha(r.inicio)} · {hora(r.inicio)} a {hora(r.fin)}
                  {!s.esExenta && <DetalleFranja reserva={r} />}
                </span>
                {!s.esExenta && <span className="font-medium">{pesos(r.subtotal)}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {modo === "revisor" && s.reservas.length > 0 && <section className="flex flex-col gap-4" aria-labelledby="titulo-calendario-revision">
        <h2 id="titulo-calendario-revision" className="text-2xl font-bold">Calendario de revisión</h2>
        {s.reservas.filter((reserva, indice, reservas) => reservas.findIndex((otra) => otra.espacioId === reserva.espacioId) === indice).map((reserva) =>
          <CalendarioEspacio key={reserva.espacioId} espacioId={reserva.espacioId} fechaInicial={reserva.inicio} seleccion={{ inicio: reserva.inicio, fin: reserva.fin }} />)}
      </section>}

      {s.servicios.length > 0 && (
        <section aria-labelledby="titulo-servicios" className="flex flex-col gap-3">
          <h2 id="titulo-servicios" className="text-2xl font-bold">
            Servicios
          </h2>
          <ul className="divide-y divide-gris-claro rounded-campo border border-gris-claro">
            {s.servicios.map((x) => (
              <li key={x.id} className="flex flex-wrap justify-between gap-2 px-4 py-2">
                <span>
                  {x.cantidad} × {x.nombre}
                  {!s.esExenta && <DetalleServicio servicio={x} />}
                </span>
                {!s.esExenta && <span className="font-medium">{pesos(x.subtotal)}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Mientras no hay cotización, el estimado es lo único que dice cuánto vale lo pedido. */}
      {!s.cotizacion && s.estimado && (s.reservas.length > 0 || s.servicios.length > 0) && (
        <TotalesEstimados
          estimado={s.estimado}
          institucional={s.estado === "BORRADOR" ? s.declaraUsoInstitucional : s.esExenta}
        />
      )}

      <DocumentosSolicitud solicitudId={s.id} />

      {s.actas && s.actas.length > 0 && (
        <section aria-labelledby="titulo-actas" className="flex flex-col gap-3">
          <h2 id="titulo-actas" className="text-2xl font-bold">
            Actas registradas
          </h2>
          <ul className="divide-y divide-gris-claro rounded-campo border border-gris-claro">
            {s.actas.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{a.consecutivo}</span>
                    <span className="rounded bg-gris-claro/50 px-2 py-0.5 text-xs font-semibold">
                      {a.tipo === "ENTREGA" ? "Entrega" : "Devolución"}
                    </span>
                  </div>
                  <span className="text-sm text-gris">
                    {fecha(a.registradaEn)} · {hora(a.registradaEn)}
                  </span>
                  {a.observaciones && (
                    <p className="text-sm text-gris-oscuro">{a.observaciones}</p>
                  )}
                </div>
                <BotonDescarga
                  descargar={() => descargarActaPdf(a.id)}
                  nombreArchivo={`Acta-${a.consecutivo}.pdf`}
                >
                  Descargar acta en PDF
                </BotonDescarga>
              </li>
            ))}
          </ul>
        </section>
      )}

      {s.cotizacion && <div className="flex flex-col items-start gap-3">
        <ResumenCotizacion cotizacion={s.cotizacion} esExenta={s.esExenta} />
        <BotonDescarga descargar={() => descargarCotizacionPdf(s.id)} nombreArchivo={`Cotizacion-${s.cotizacion.consecutivo}.pdf`}>
          Descargar cotización en PDF
        </BotonDescarga>
      </div>}

      {modo === "solicitante" && !s.esExenta && (s.estado === "COTIZADA" || s.estado === "PAGO_PENDIENTE") && (
        <PanelPago solicitudId={s.id} consecutivo={s.consecutivo} esExenta={s.esExenta} valorCotizado={s.cotizacion?.total ?? null} alCambiar={recargar} />
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
        {cancelaInstitucion ? (
          <p className="text-gris">
            Es una cancelación por causa institucional: se libera el horario y, si el solicitante ya pagó, se le
            reembolsa el 100 % del valor. Se le avisará con el motivo que escribas.
          </p>
        ) : (
          <p className="text-gris">
            Se libera el horario y se te reembolsa según la política de cancelación:
          </p>
        )}
        {accion === "cancelar" && <SimulacionCancelacion solicitudId={s.id} esExenta={s.esExenta} />}
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
