import { api } from "./api";
import type { components } from "./contrato";

type Esquemas = components["schemas"];

export type CrearBloqueo = Esquemas["CrearBloqueoDto"];
export type BloqueoCreado = Esquemas["BloqueoCreadoDto"];
export type BloqueoAnulado = Esquemas["BloqueoAnuladoDto"];
export type ReporteImportacion = Esquemas["ReporteImportacionDto"];
export type BloqueoResumen = Esquemas["BloqueoResumenDto"];

/** Bloqueos no anulados de un espacio; con `desde`, solo los que aún tienen franjas desde ese instante. */
export const listarBloqueos = (filtros: { espacioId?: string; desde?: string; hasta?: string }) =>
  api<BloqueoResumen[]>("/bloqueos", { query: filtros });

export function importarHorarioCsv(archivo: File) {
  const formulario = new FormData();
  formulario.set("archivo", archivo);
  return api<ReporteImportacion>("/bloqueos/importar-horario", { method: "POST", formData: formulario });
}
export type MotivoBloqueo = Exclude<CrearBloqueo["motivo"], "RESERVA">;

export const MOTIVOS_BLOQUEO: Record<MotivoBloqueo, string> = {
  CLASE: "Clase",
  MANTENIMIENTO: "Mantenimiento",
  FESTIVO: "Festivo",
  EVENTO_INSTITUCIONAL: "Evento institucional",
  BLOQUEO_MANUAL: "Bloqueo manual",
};

export const crearBloqueo = (datos: CrearBloqueo) =>
  api<BloqueoCreado>("/bloqueos", { method: "POST", json: datos });

export const anularBloqueo = (id: string, motivo: string) =>
  api<BloqueoAnulado>(`/bloqueos/${encodeURIComponent(id)}/anular`, {
    method: "PATCH",
    json: { motivo },
  });
