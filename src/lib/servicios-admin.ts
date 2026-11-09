import { api } from "./api";
import type { components } from "./contrato";

type Esquemas = components["schemas"];

export type ServicioAdmin = Esquemas["ServicioAdminDto"];
export type CrearServicio = Esquemas["CrearServicioDto"];
export type ActualizarServicio = Esquemas["ActualizarServicioDto"];
export type ProveedorAdmin = Esquemas["ProveedorAdminDto"];
export type CrearProveedor = Esquemas["CrearProveedorDto"];
export type ActualizarProveedor = Esquemas["ActualizarProveedorDto"];
export type CategoriaServicio = ServicioAdmin["categoria"];

export const CATEGORIAS_SERVICIO: Record<CategoriaServicio, string> = {
  CULTURAL: "Cultural",
  COMUNICACIONES: "Comunicaciones",
  ALIMENTACION: "Alimentación",
  TECNICO: "Técnico",
  LOGISTICA: "Logística",
};

export const TIPOS_PROVEEDOR: Record<ProveedorAdmin["tipo"], string> = {
  INTERNO: "Interno (de la institución)",
  EXTERNO: "Externo",
};

/** Servicios activos e inactivos (GET /servicios/gestion). */
export const listarServiciosAdmin = (filtros: {
  activo?: boolean;
  categoria?: CategoriaServicio;
  proveedorId?: string;
  pagina?: number;
  porPagina?: number;
} = {}) => api<Esquemas["PaginaServiciosAdminDto"]>("/servicios/gestion", { query: filtros });

export const crearServicio = (datos: CrearServicio) =>
  api<ServicioAdmin>("/servicios", { method: "POST", json: datos });

export const actualizarServicio = (id: string, datos: ActualizarServicio) =>
  api<ServicioAdmin>(`/servicios/${encodeURIComponent(id)}`, { method: "PATCH", json: datos });

export const desactivarServicio = (id: string) =>
  api<void>(`/servicios/${encodeURIComponent(id)}`, { method: "DELETE" });

export const listarProveedores = (filtros: {
  activo?: boolean;
  tipo?: ProveedorAdmin["tipo"];
  buscar?: string;
  pagina?: number;
  porPagina?: number;
} = {}) => api<Esquemas["PaginaProveedoresDto"]>("/proveedores", { query: filtros });

export const crearProveedor = (datos: CrearProveedor) =>
  api<ProveedorAdmin>("/proveedores", { method: "POST", json: datos });

export const actualizarProveedor = (id: string, datos: ActualizarProveedor) =>
  api<ProveedorAdmin>(`/proveedores/${encodeURIComponent(id)}`, { method: "PATCH", json: datos });

/** Desactiva al proveedor y a todos sus servicios. */
export const desactivarProveedor = (id: string) =>
  api<void>(`/proveedores/${encodeURIComponent(id)}`, { method: "DELETE" });
