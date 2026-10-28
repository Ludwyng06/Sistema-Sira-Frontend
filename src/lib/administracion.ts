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

export const actualizarParametro = (clave: string, valor: unknown) =>
  api<Parametro>(`/parametros/${encodeURIComponent(clave)}`, {
    method: "PATCH",
    json: { valor },
  });

export const listarAuditoria = (filtros: {
  entidad?: string;
  accion?: string;
  desde?: string;
  hasta?: string;
  pagina?: number;
  porPagina?: number;
}) => api<PaginaAuditoria>("/auditoria", { query: filtros });
