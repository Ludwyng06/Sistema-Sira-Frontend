import { api } from "./api";
import type { components } from "./contrato";

export type Servicio = components["schemas"]["ServicioDto"];
export type CategoriaServicio = Servicio["categoria"];
export type UnidadCobro = Servicio["unidadCobro"];

export const CATEGORIAS: Record<CategoriaServicio, string> = {
  CULTURAL: "Cultural",
  COMUNICACIONES: "Comunicaciones",
  ALIMENTACION: "Alimentación",
  TECNICO: "Técnico",
  LOGISTICA: "Logística",
};

export const UNIDADES_COBRO: Record<UnidadCobro, string> = {
  EVENTO: "por evento",
  HORA: "por hora",
  PERSONA: "por persona",
  UNIDAD: "por unidad",
};

export const listarServicios = (tipoEspacioId?: string) =>
  api<Servicio[]>("/servicios", { query: { tipoEspacioId } });
