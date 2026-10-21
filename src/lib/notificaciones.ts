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
