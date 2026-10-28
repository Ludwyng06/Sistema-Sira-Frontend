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

export type CrearSolicitud = Esquemas["CrearSolicitudDto"];
export type ActualizarSolicitud = Esquemas["ActualizarSolicitudDto"];
export type SolicitudEnviada = Esquemas["SolicitudEnviadaDto"];
export type Documento = Esquemas["DocumentoDto"];
export type TipoDocumento = Documento["tipo"];

export const TIPOS_DOCUMENTO: Record<TipoDocumento, string> = {
  CARTA_SOLICITUD: "Carta de solicitud",
  RUT: "RUT",
  CAMARA_COMERCIO: "Cámara de comercio",
  CEDULA_REPRESENTANTE: "Cédula del representante",
  POLIZA: "Póliza",
  ORDEN_SERVICIO: "Orden de servicio",
  OTRO: "Otro documento",
};

const ruta = (id: string) => `/solicitudes/${encodeURIComponent(id)}`;

export const crearSolicitud = (datos: CrearSolicitud) =>
  api<Solicitud>("/solicitudes", { method: "POST", json: datos });

export const actualizarSolicitud = (id: string, datos: ActualizarSolicitud) =>
  api<Solicitud>(ruta(id), { method: "PATCH", json: datos });

export const agregarReserva = (id: string, espacioId: string, inicio: string, fin: string) =>
  api<ReservaItem>(`${ruta(id)}/reservas`, { method: "POST", json: { espacioId, inicio, fin } });

export const quitarReserva = (id: string, itemId: string) =>
  api<void>(`${ruta(id)}/reservas/${encodeURIComponent(itemId)}`, { method: "DELETE" });

export const agregarServicio = (id: string, servicioId: string, cantidad: number) =>
  api<ServicioItem>(`${ruta(id)}/servicios`, { method: "POST", json: { servicioId, cantidad } });

export const quitarServicio = (id: string, itemId: string) =>
  api<void>(`${ruta(id)}/servicios/${encodeURIComponent(itemId)}`, { method: "DELETE" });

export const enviarSolicitud = (id: string) =>
  api<SolicitudEnviada>(`${ruta(id)}/enviar`, { method: "POST" });

export const listarDocumentos = (id: string) => api<Documento[]>(`${ruta(id)}/documentos`);

export function subirDocumento(id: string, tipo: TipoDocumento, archivo: File) {
  const formulario = new FormData();
  formulario.set("tipo", tipo);
  formulario.set("archivo", archivo);
  return api<Documento>(`${ruta(id)}/documentos`, { method: "POST", formData: formulario });
}

export const quitarDocumento = (id: string, documentoId: string) =>
  api<void>(`${ruta(id)}/documentos/${encodeURIComponent(documentoId)}`, { method: "DELETE" });

export const descargarCotizacionPdf = (id: string) =>
  api<Blob>(`${ruta(id)}/cotizacion.pdf`, { blob: true });
