import { api } from "./api";
import type { components } from "./contrato";

type Esquemas = components["schemas"];

export type CrearBloqueo = Esquemas["CrearBloqueoDto"];
export type BloqueoCreado = Esquemas["BloqueoCreadoDto"];
export type BloqueoAnulado = Esquemas["BloqueoAnuladoDto"];
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
