import { api } from "./api";
import type { components } from "./contrato";

export type Tablero = components["schemas"]["TableroDto"];

export const obtenerTablero = (desde?: string, hasta?: string) =>
  api<Tablero>("/reportes/tablero", { query: { desde, hasta } });

export const exportarReporte = (
  tipo: "solicitudes" | "recaudo" | "ocupacion" | "inventario",
  formato: "xlsx" | "csv" | "pdf",
  rango?: { desde?: string; hasta?: string },
) => api<Blob>(`/reportes/${tipo}.${formato}`, { query: rango, blob: true });
