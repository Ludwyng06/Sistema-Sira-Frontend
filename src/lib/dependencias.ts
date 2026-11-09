import { api } from "./api";
import type { components } from "./contrato";

export type DependenciaPublica = components["schemas"]["DependenciaPublicaDto"];

/** Dependencias activas, sin sesión: para el registro de cuentas institucionales (RN-07). */
export const listarDependenciasPublicas = () => api<DependenciaPublica[]>("/dependencias/publicas");

/** Dominios de correo de la institución: con ellos el backend registra la cuenta como INTERNO. */
export const DOMINIOS_INSTITUCIONALES = ["itp.edu.co", "uniputumayo.edu.co"];

export function esCorreoInstitucional(correo: string): boolean {
  const dominio = correo.slice(correo.lastIndexOf("@") + 1).trim().toLowerCase();
  return dominio.length > 0 && DOMINIOS_INSTITUCIONALES.some((d) => dominio === d || dominio.endsWith(`.${d}`));
}
