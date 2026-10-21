import { api } from "./api";
import type { components } from "./contrato";

type Esquemas = components["schemas"];

export type Acta = Esquemas["ActaDto"];
export type CrearActa = Esquemas["CrearActaDto"];
export type TipoActa = CrearActa["tipo"];
export type ItemChecklistEntrada = Esquemas["ItemChecklistEntradaDto"];
export type NovedadEntrada = Esquemas["NovedadEntradaDto"];
export type EstadoFisico = ItemChecklistEntrada["estadoFisico"];
export type Tratamiento = NovedadEntrada["tratamiento"];
export type ElementoAdmin = Esquemas["ElementoAdminDto"];
export type PaginaElementos = Esquemas["PaginaElementosDto"];

export const ESTADOS_FISICOS: Record<EstadoFisico, string> = {
  BUENO: "Bueno",
  REGULAR: "Regular",
  MALO: "Malo",
};

export const TRATAMIENTOS: Record<Tratamiento, string> = {
  DESCONTAR_DEPOSITO: "Descontar del depósito",
  COBRO_ADICIONAL: "Cobro adicional",
  SIN_COBRO: "Sin cobro",
};

export const crearActa = (datos: CrearActa) =>
  api<Acta>("/actas", { method: "POST", json: datos });

export const obtenerActa = (id: string) => api<Acta>(`/actas/${encodeURIComponent(id)}`);

export const descargarActaPdf = (id: string) =>
  api<Blob>(`/actas/${encodeURIComponent(id)}.pdf`, { blob: true });

/** Elementos en servicio de un espacio, para armar el checklist. */
export const listarElementosDeEspacio = (espacioId: string) =>
  api<PaginaElementos>("/elementos", {
    query: { espacioId, estado: "EN_SERVICIO", porPagina: 100 },
  });
