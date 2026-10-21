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
