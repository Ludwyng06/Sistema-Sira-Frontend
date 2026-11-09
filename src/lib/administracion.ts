import { api } from "./api";
import type { components } from "./contrato";

type Esquemas = components["schemas"];

export type UsuarioAdmin = Esquemas["UsuarioAdminDto"];
export type PaginaUsuarios = Esquemas["PaginaUsuariosDto"];
export type RolAsignar = Esquemas["RolAsignarDto"];
export type Parametro = Esquemas["ParametroDto"];
export type RegistroAuditoria = Esquemas["RegistroAuditoriaDto"];
export type PaginaAuditoria = Esquemas["PaginaAuditoriaDto"];
export type PaginaDependencias = Esquemas["PaginaDependenciasDto"];
export type Dependencia = Esquemas["DependenciaAdminDto"];
export type CrearDependencia = Esquemas["CrearDependenciaDto"];
export type ActualizarDependencia = Esquemas["ActualizarDependenciaDto"];

export const listarUsuarios = (filtros: {
  rol?: RolAsignar["rol"];
  activo?: boolean;
  busqueda?: string;
  pagina?: number;
  porPagina?: number;
}) => api<PaginaUsuarios>("/usuarios", { query: filtros });

export const cambiarEstadoUsuario = (id: string, activo: boolean) =>
  api<UsuarioAdmin>(`/usuarios/${encodeURIComponent(id)}/estado`, {
    method: "PATCH",
    json: { activo },
  });

export const reemplazarRoles = (id: string, roles: RolAsignar[]) =>
  api<UsuarioAdmin>(`/usuarios/${encodeURIComponent(id)}/roles`, {
    method: "PUT",
    json: { roles },
  });

export const listarDependencias = () =>
  api<PaginaDependencias>("/dependencias", { query: { activa: true, porPagina: 100 } });

export const listarParametros = () => api<Parametro[]>("/parametros");

export const listarDependenciasAdmin = (filtros: { activa?: boolean; pagina?: number; porPagina?: number } = {}) =>
  api<PaginaDependencias>("/dependencias", { query: filtros });

export const crearDependencia = (datos: CrearDependencia) =>
  api<Dependencia>("/dependencias", { method: "POST", json: datos });

export const actualizarDependencia = (id: string, datos: ActualizarDependencia) =>
  api<Dependencia>(`/dependencias/${encodeURIComponent(id)}`, { method: "PATCH", json: datos });

export const archivarDependencia = (id: string) =>
  api<Dependencia>(`/dependencias/${encodeURIComponent(id)}/archivar`, { method: "PATCH" });

export const restaurarDependencia = (id: string) =>
  api<Dependencia>(`/dependencias/${encodeURIComponent(id)}/restaurar`, { method: "PATCH" });

export const actualizarParametro = (clave: string, valor: unknown) =>
  api<Parametro>(`/parametros/${encodeURIComponent(clave)}`, {
    method: "PATCH",
    json: { valor },
  });

export const listarAuditoria = (filtros: {
  entidad?: string;
  entidadId?: string;
  accion?: string;
  usuarioId?: string;
  desde?: string;
  hasta?: string;
  pagina?: number;
  porPagina?: number;
}) => api<PaginaAuditoria>("/auditoria", { query: filtros });

export interface SmmlvVigencia {
  anio: number;
  valor: number;
}

export const listarSmmlv = () => api<SmmlvVigencia[]>("/smmlv");

export const guardarSmmlv = (anio: number, valor: number) =>
  api<SmmlvVigencia>(`/smmlv/${encodeURIComponent(String(anio))}`, {
    method: "PUT",
    json: { valor },
  });
