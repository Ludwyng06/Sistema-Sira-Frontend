import { api } from "./api";
import type { components } from "./contrato";

export type Notificacion = components["schemas"]["NotificacionDto"];
export type PaginaNotificaciones = components["schemas"]["PaginaNotificacionesDto"];

export const listarNotificaciones = (filtros: {
  soloNoLeidas?: boolean;
  pagina?: number;
  porPagina?: number;
}) => api<PaginaNotificaciones>("/notificaciones", { query: filtros });

export const marcarLeida = (id: string) =>
  api<void>(`/notificaciones/${encodeURIComponent(id)}/leida`, { method: "PATCH" });

/**
 * El backend manda enlaces como "/solicitudes/:id", que no es una pantalla del sitio. Aquí se
 * traducen: el solicitante la ve en "Mis solicitudes" y el personal en "Aprobaciones".
 */
export function rutaDeEnlace(enlace: string, esSolicitante: boolean): string {
  const m = enlace.match(/^\/solicitudes\/([^/?#]+)/);
  if (!m) return enlace;
  return esSolicitante ? `/mis-solicitudes/${m[1]}` : `/panel/aprobaciones/${m[1]}`;
}
