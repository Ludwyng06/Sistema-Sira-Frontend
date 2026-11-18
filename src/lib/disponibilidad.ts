import { api } from "./api";
import type { components } from "./contrato";

type Esquemas = components["schemas"];

export type Disponibilidad = Esquemas["DisponibilidadDto"];
export type FranjaOcupada = Esquemas["FranjaDisponibilidadDto"];
export type EstadoFranja = FranjaOcupada["estado"];
export type ResultadoBusqueda = Esquemas["ResultadoBusquedaDto"];
export type CalcularTarifa = Esquemas["CalcularTarifaDto"];
export type TarifaCalculada = Esquemas["TarifaCalculadaDto"];

export const obtenerDisponibilidad = (espacioId: string, desde: string, hasta: string) =>
  api<Disponibilidad>("/disponibilidad", { query: { espacioId, desde, hasta } });

export const calcularTarifa = (datos: CalcularTarifa) =>
  api<TarifaCalculada>("/tarifas/calcular", { method: "POST", json: datos });
