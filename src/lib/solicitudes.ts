import { api } from "./api";
import type { components } from "./contrato";

type Esquemas = components["schemas"];

export type Solicitud = Esquemas["SolicitudDto"];
export type SolicitudDetalle = Esquemas["SolicitudDetalleDto"];
export type PaginaSolicitudes = Esquemas["PaginaSolicitudesDto"];
export type EstadoSolicitud = Solicitud["estado"];
export type DecidirSolicitud = Esquemas["DecidirSolicitudDto"];
export type DecisionRegistrada = Esquemas["DecisionRegistradaDto"];
export type Cancelacion = Esquemas["CancelacionDto"];
export type ReservaItem = Esquemas["ReservaItemDto"];
export type ServicioItem = Esquemas["ServicioItemDto"];
export type DecisionHistorial = Esquemas["DecisionHistorialDto"];
export type CotizacionResumen = Esquemas["CotizacionResumenDto"];

/** Texto para el usuario y próxima acción de cada estado. */
export const ESTADOS: Record<EstadoSolicitud, { etiqueta: string; proxima: string }> = {
  BORRADOR: { etiqueta: "Borrador", proxima: "Termina y envía tu solicitud." },
  ENVIADA: { etiqueta: "Enviada", proxima: "Esperando revisión." },
  EN_REVISION: { etiqueta: "En revisión", proxima: "Esperando aprobación." },
  COTIZADA: { etiqueta: "Cotizada", proxima: "Revisa la cotización y realiza el pago." },
  PAGO_PENDIENTE: { etiqueta: "Pago por verificar", proxima: "Tesorería verifica tu pago." },
  CONFIRMADA: { etiqueta: "Confirmada", proxima: "Tu espacio está reservado." },
  EN_USO: { etiqueta: "En uso", proxima: "El evento está en curso." },
  FINALIZADA: { etiqueta: "Finalizada", proxima: "Pendiente de cierre." },
  CERRADA: { etiqueta: "Cerrada", proxima: "No hay nada más por hacer." },
  RECHAZADA: { etiqueta: "Rechazada", proxima: "Revisa el motivo del rechazo." },
  VENCIDA: { etiqueta: "Vencida", proxima: "Venció el plazo; puedes crear una nueva." },
  CANCELADA: { etiqueta: "Cancelada", proxima: "La solicitud fue cancelada." },
  REEMBOLSADA: { etiqueta: "Reembolsada", proxima: "Se hizo el reembolso." },
};

export const listarSolicitudes = (filtros: {
  ambito?: "PROPIAS" | "BANDEJA";
  estado?: EstadoSolicitud;
  pagina?: number;
  porPagina?: number;
}) => api<PaginaSolicitudes>("/solicitudes", { query: filtros });

export const obtenerSolicitud = (id: string) =>
  api<SolicitudDetalle>(`/solicitudes/${encodeURIComponent(id)}`);

export const decidirSolicitud = (id: string, datos: DecidirSolicitud) =>
  api<DecisionRegistrada>(`/solicitudes/${encodeURIComponent(id)}/decisiones`, {
    method: "POST",
    json: datos,
  });

export const cancelarSolicitud = (id: string, motivo: string) =>
  api<Cancelacion>(`/solicitudes/${encodeURIComponent(id)}/cancelar`, {
    method: "POST",
    json: { motivo },
  });
