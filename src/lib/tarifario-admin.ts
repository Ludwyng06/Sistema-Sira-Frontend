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

export type TipoRecargo = Recargo["tipo"];

export const TIPOS_RECARGO: Record<TipoRecargo, string> = {
  NOCTURNO: "Nocturno",
  DOMINICAL_DIURNO: "Dominical diurno",
  DOMINICAL_NOCTURNO: "Dominical nocturno",
  FESTIVO_DIURNO: "Festivo diurno",
  FESTIVO_NOCTURNO: "Festivo nocturno",
};

/** Orden en que se muestran los recargos en el panel. */
export const ORDEN_RECARGOS: TipoRecargo[] = [
  "NOCTURNO",
  "DOMINICAL_DIURNO",
  "DOMINICAL_NOCTURNO",
  "FESTIVO_DIURNO",
  "FESTIVO_NOCTURNO",
];

/** Explicación corta de cuándo aplica cada recargo. */
export const DESCRIPCIONES_RECARGO: Record<TipoRecargo, string> = {
  NOCTURNO: "De lunes a sábado que no sean festivos, desde la hora que indiques y antes de las 6:00 a. m.",
  DOMINICAL_DIURNO: "Domingos que no son festivos, desde las 6:00 a. m. hasta la hora del recargo nocturno.",
  DOMINICAL_NOCTURNO: "Domingos que no son festivos. Usa la misma hora de inicio del recargo nocturno.",
  FESTIVO_DIURNO: "Días festivos (también si caen en domingo), desde las 6:00 a. m. hasta la hora del recargo nocturno.",
  FESTIVO_NOCTURNO: "Días festivos (también si caen en domingo). Usa la misma hora de inicio del recargo nocturno.",
};

export const PORCENTAJE_RECARGO_MAXIMO = 300;

/** Valida el porcentaje de un recargo: de 0 a 300 con hasta 2 decimales. Devuelve el error o null. */
export function validarPorcentajeRecargo(valor: string): string | null {
  const limpio = valor.trim().replace(",", ".");
  if (limpio === "") return "Indica el porcentaje.";
  if (!/^\d+(\.\d{1,2})?$/.test(limpio)) {
    return "Escribe un número de 0 a 300 con máximo 2 decimales (por ejemplo, 125,5).";
  }
  if (Number(limpio) > PORCENTAJE_RECARGO_MAXIMO) return "El porcentaje no puede superar 300.";
  return null;
}

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
