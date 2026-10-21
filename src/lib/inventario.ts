import { notFound } from "next/navigation";
import { api, ErrorApi } from "./api";
import type {
  BloqueResumen,
  DetalleBloque,
  FichaEspacio,
  Pagina,
  SedeResumen,
  TarjetaEspacio,
  TipoEspacio,
} from "./tipos";

/** Sede que muestra la página de inicio de la Fase 0. */
export const SEDE_PRINCIPAL = "MOC";

export const listarSedes = () => api<SedeResumen[]>("/sedes");

export const listarBloques = (sede: string) =>
  api<BloqueResumen[]>(`/sedes/${encodeURIComponent(sede)}/bloques`);

export const obtenerBloque = (sede: string, bloque: string, asistentes?: number) =>
  api<DetalleBloque>(
    `/sedes/${encodeURIComponent(sede)}/bloques/${encodeURIComponent(bloque)}`,
    { query: { asistentes } },
  );

export const listarEspacios = (filtros: {
  sede?: string;
  bloque?: string;
  tipo?: string;
  asistentes?: number;
  pagina?: number;
  porPagina?: number;
}) => api<Pagina<TarjetaEspacio>>("/espacios", { query: filtros });

export const obtenerEspacio = (codigo: string, asistentes?: number) =>
  api<FichaEspacio>(`/espacios/${encodeURIComponent(codigo)}`, { query: { asistentes } });

export const listarTiposEspacio = () => api<TipoEspacio[]>("/tipos-espacio");

export type Resultado<T> =
  | { ok: true; datos: T }
  | { ok: false; mensaje: string };

/**
 * Resuelve una consulta para una página: 404 de la API -> not-found de Next;
 * otro error de la API (o API caída) -> mensaje para mostrar en EstadoError.
 */
export async function resolver<T>(consulta: Promise<T>): Promise<Resultado<T>> {
  try {
    return { ok: true, datos: await consulta };
  } catch (error) {
    if (error instanceof ErrorApi) {
      if (error.status === 404) notFound();
      return { ok: false, mensaje: error.message };
    }
    throw error;
  }
}

/** Lee un número entero positivo de un parámetro de query; si no, undefined. */
export function enteroPositivo(valor: string | string[] | undefined): number | undefined {
  const texto = Array.isArray(valor) ? valor[0] : valor;
  if (!texto) return undefined;
  const n = Number.parseInt(texto, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}
