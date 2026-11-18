import { api } from "./api";
import type { components } from "./contrato";

type Esquemas = components["schemas"];

export type Tarifa = Esquemas["TarifaDto"];
export type PaginaTarifas = Esquemas["PaginaTarifasDto"];
export type CrearTarifa = Esquemas["CrearTarifaDto"];
export type ActualizarTarifa = Esquemas["ActualizarTarifaDto"];
export type Recargo = Esquemas["RecargoDto"];
export type ActualizarRecargo = Esquemas["ActualizarRecargoDto"];
export type Festivo = Esquemas["FestivoDto"];
export type TipoSolicitante = Tarifa["tipoSolicitante"];
export type UnidadTarifa = NonNullable<Tarifa["unidad"]>;

export const TIPOS_SOLICITANTE: Record<TipoSolicitante, string> = {
  PERSONA_NATURAL: "Persona natural",
  EMPRESA: "Empresa",
  ENTIDAD: "Entidad",
  INTERNO: "Interno (uso particular)",
};

export const UNIDADES_TARIFA: Record<UnidadTarifa, string> = {
  HORA: "Por hora",
  JORNADA_MANANA: "Jornada de la mañana",
  JORNADA_TARDE: "Jornada de la tarde",
  JORNADA_NOCHE: "Jornada de la noche",
  DIA: "Por día",
};

export const TIPOS_RECARGO: Record<Recargo["tipo"], string> = {
  NOCTURNO: "Nocturno",
  DOMINICAL: "Dominical",
  FESTIVO: "Festivo",
};

export const listarTarifas = (filtros: {
  espacioId?: string;
  servicioId?: string;
  tipoSolicitante?: TipoSolicitante;
  /** Solo las vigentes hoy. */
  vigentes?: boolean;
  pagina?: number;
  porPagina?: number;
}) => api<PaginaTarifas>("/tarifas", { query: filtros });

export const crearTarifa = (datos: CrearTarifa) => api<Tarifa>("/tarifas", { method: "POST", json: datos });

/** RN-05: el valor de una tarifa no se edita; solo se cierra su vigencia o se cambia el acuerdo de soporte. */
export const actualizarTarifa = (id: string, datos: ActualizarTarifa) =>
  api<Tarifa>(`/tarifas/${encodeURIComponent(id)}`, { method: "PATCH", json: datos });

export const listarRecargos = () => api<Recargo[]>("/recargos");

export const actualizarRecargo = (tipo: Recargo["tipo"], datos: ActualizarRecargo) =>
  api<Recargo>(`/recargos/${encodeURIComponent(tipo)}`, { method: "PATCH", json: datos });

export const listarFestivos = (anio?: number) => api<Festivo[]>("/festivos", { query: { anio } });

export const crearFestivo = (fecha: string, nombre: string) =>
  api<Festivo>("/festivos", { method: "POST", json: { fecha, nombre } });

/** El id de un festivo es su fecha (AAAA-MM-DD). */
export const eliminarFestivo = (id: string) => api<void>(`/festivos/${encodeURIComponent(id)}`, { method: "DELETE" });
