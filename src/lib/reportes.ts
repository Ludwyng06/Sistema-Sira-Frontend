import { api } from "./api";
import type { components } from "./contrato";

export type Tablero = components["schemas"]["TableroDto"];

export const obtenerTablero = (desde?: string, hasta?: string) =>
  api<Tablero>("/reportes/tablero", { query: { desde, hasta } });
