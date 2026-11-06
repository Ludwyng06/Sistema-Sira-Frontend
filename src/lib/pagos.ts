import { api } from "./api";
import type { components } from "./contrato";

type Esquemas = components["schemas"];

export type OrdenPago = Esquemas["OrdenPagoDto"];
export type OrdenPagoResumen = Esquemas["OrdenPagoResumenDto"];
export type PaginaOrdenes = Esquemas["PaginaOrdenesDto"];
export type EstadoOrden = OrdenPago["estado"];
export type Verificacion = Esquemas["VerificacionDto"];

export const ETIQUETAS_ORDEN: Record<EstadoOrden, string> = {
  PENDIENTE: "Pendiente de pago",
  EN_VERIFICACION: "Por verificar",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
  VENCIDA: "Vencida",
  ANULADA: "Anulada",
};

export const listarOrdenes = (filtros: {
  estado?: EstadoOrden;
  pagina?: number;
  porPagina?: number;
}) => api<PaginaOrdenes>("/pagos/ordenes", { query: filtros });

export const crearOrden = (solicitudId: string) =>
  api<OrdenPago>("/pagos/ordenes", { method: "POST", json: { solicitudId } });

export function subirSoporte(ordenId: string, archivo: File) {
  const formulario = new FormData();
  formulario.set("archivo", archivo);
  return api<OrdenPago>(`/pagos/ordenes/${encodeURIComponent(ordenId)}/soporte`, {
    method: "POST",
    formData: formulario,
  });
}

export const descargarSoporte = (ordenId: string) =>
  api<Blob>(`/pagos/ordenes/${encodeURIComponent(ordenId)}/soporte`, { blob: true });

export const verificarPago = (
  ordenId: string,
  resultado: "APROBADA" | "RECHAZADA",
  observacion?: string,
) =>
  api<Verificacion>(`/pagos/ordenes/${encodeURIComponent(ordenId)}/verificacion`, {
    method: "POST",
    json: { resultado, observacion },
  });

export type EstadoReembolso = "SOLICITADO" | "APROBADO" | "RECHAZADO" | "APLICADO";

export interface ReembolsoResumen {
  id: string;
  ordenPagoId: string;
  referenciaOrden: string;
  solicitudId: string;
  consecutivoSolicitud: string | null;
  valor: number;
  motivo: string;
  estado: EstadoReembolso;
  tieneSoporte: boolean;
  creadoEn: string;
  resueltoEn: string | null;
}

export interface PaginaReembolsos {
  datos: ReembolsoResumen[];
  total: number;
  pagina: number;
  porPagina: number;
}

export const ETIQUETAS_REEMBOLSO: Record<EstadoReembolso, string> = {
  SOLICITADO: "Por reembolsar",
  APROBADO: "Aprobado",
  APLICADO: "Reembolsado",
  RECHAZADO: "Rechazado",
};

export const listarReembolsos = (filtros: {
  estado?: EstadoReembolso;
  pagina?: number;
  porPagina?: number;
}) => api<PaginaReembolsos>("/pagos/reembolsos", { query: filtros });

export function resolverReembolso(
  reembolsoId: string,
  resultado: "APLICADO" | "RECHAZADO",
  opciones: { observacion?: string; archivo?: File } = {},
) {
  const formulario = new FormData();
  formulario.set("resultado", resultado);
  if (opciones.observacion) formulario.set("observacion", opciones.observacion);
  if (opciones.archivo) formulario.set("archivo", opciones.archivo);
  return api<{ id: string; estadoReembolso: EstadoReembolso; estadoSolicitud: string }>(
    `/pagos/reembolsos/${encodeURIComponent(reembolsoId)}/resolucion`,
    { method: "POST", formData: formulario },
  );
}

export const descargarSoporteReembolso = (reembolsoId: string) =>
  api<Blob>(`/pagos/reembolsos/${encodeURIComponent(reembolsoId)}/soporte`, { blob: true });
