/** Tipos de identidad (/auth), tomados de Swagger: ver contrato.d.ts. */
import type { components } from "./contrato";

type Esquemas = components["schemas"];

export type Registro = Esquemas["RegistroDto"];
export type RegistroRespuesta = Esquemas["RegistroRespuestaDto"];
export type VerificarCorreo = Esquemas["VerificarCorreoDto"];
export type Ingresar = Esquemas["IngresarDto"];
export type Sesion = Esquemas["SesionDto"];
export type UsuarioSesion = Esquemas["UsuarioSesionDto"];
export type RolAsignado = Esquemas["RolAsignadoDto"];
export type Rol = RolAsignado["rol"];
export type TipoSolicitante = Registro["tipo"];
export type TipoDocumento = Registro["tipoDocumento"];
export type Mensaje = Esquemas["MensajeDto"];

/**
 * Versión de la política de datos que se acepta al registrarse. Debe coincidir con el parámetro
 * `version_politica_datos` del backend (la API rechaza el registro con POLITICA_DESACTUALIZADA).
 * Ese parámetro no se publica sin sesión: se configura aquí con NEXT_PUBLIC_VERSION_POLITICA.
 */
export const VERSION_POLITICA = process.env.NEXT_PUBLIC_VERSION_POLITICA ?? "2026-10";

export const ETIQUETAS_ROL: Record<Rol, string> = {
  SOLICITANTE: "Solicitante",
  RESPONSABLE_ESPACIO: "Responsable de espacio",
  APROBADOR: "Aprobador",
  TESORERIA: "Tesorería",
  ADMINISTRADOR: "Administrador",
  AUDITOR: "Auditor",
};
