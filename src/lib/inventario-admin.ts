import { api } from "./api";
import type { components } from "./contrato";

type Esquemas = components["schemas"];

export type SedeAdmin = Esquemas["SedeAdminDto"];
export type BloqueAdmin = Esquemas["BloqueAdminDto"];
export type EspacioAdmin = Esquemas["EspacioAdminDto"];
export type PaginaEspaciosAdmin = Esquemas["PaginaEspaciosAdminDto"];
export type CrearEspacio = Esquemas["CrearEspacioDto"];
export type ActualizarEspacio = Esquemas["ActualizarEspacioDto"];
export type EspacioCreado = Esquemas["EspacioCreadoDto"];
export type EstadoEspacio = NonNullable<ActualizarEspacio["estado"]>;
export type HorarioEspacio = Esquemas["HorarioDto"];
export type ElementoAdmin = Esquemas["ElementoAdminDto"];
export type CrearElemento = Esquemas["CrearElementoDto"];
export type ActualizarElemento = Esquemas["ActualizarElementoDto"];

export const reemplazarHorariosEspacio = (codigo: string, horarios: HorarioEspacio[]) =>
  api<HorarioEspacio[]>(`/espacios/${encodeURIComponent(codigo)}/horarios`, { method: "PUT", json: { horarios } });

export async function listarElementosAdmin(espacioId: string): Promise<ElementoAdmin[]> {
  const elementos: ElementoAdmin[] = [];
  let pagina = 1;
  while (true) {
    const respuesta = await api<Esquemas["PaginaElementosDto"]>("/elementos", { query: { espacioId, pagina, porPagina: 100 } });
    elementos.push(...respuesta.datos);
    if (respuesta.pagina * respuesta.porPagina >= respuesta.total || respuesta.datos.length === 0) break;
    pagina += 1;
  }
  return elementos;
}

export const crearElementoAdmin = (datos: CrearElemento) => api<ElementoAdmin>("/elementos", { method: "POST", json: datos });
export const actualizarElementoAdmin = (id: string, datos: ActualizarElemento) =>
  api<ElementoAdmin>(`/elementos/${encodeURIComponent(id)}`, { method: "PATCH", json: datos });

export const ESTADOS_ESPACIO: Record<EstadoEspacio, string> = {
  DISPONIBLE: "Disponible",
  EN_MANTENIMIENTO: "En mantenimiento",
  FUERA_DE_SERVICIO: "Fuera de servicio",
};

export const listarSedesAdmin = () =>
  api<Esquemas["PaginaSedesDto"]>("/sedes/gestion", { query: { activo: true, porPagina: 100 } });

export const listarBloquesAdmin = (sedeId: string) =>
  api<Esquemas["PaginaBloquesDto"]>("/bloques", { query: { sedeId, activo: true, porPagina: 100 } });

export const listarEspaciosAdmin = (filtros: {
  sede?: string;
  bloque?: string;
  sedeId?: string;
  bloqueId?: string;
  activo?: boolean;
  porPagina?: number;
  pagina?: number;
  estado?: EstadoEspacio;
} = {}) => api<PaginaEspaciosAdmin>("/espacios/gestion", { query: filtros });

export const obtenerEspacioAdmin = (codigo: string) =>
  api<EspacioAdmin>(`/espacios/gestion/${encodeURIComponent(codigo)}`);

export const crearEspacio = (datos: CrearEspacio) =>
  api<EspacioCreado>("/espacios", { method: "POST", json: datos });

export const actualizarEspacio = (codigo: string, datos: ActualizarEspacio) =>
  api<EspacioCreado>(`/espacios/${encodeURIComponent(codigo)}`, { method: "PATCH", json: datos });

export const archivarEspacio = (codigo: string) =>
  api<void>(`/espacios/${encodeURIComponent(codigo)}/archivar`, { method: "PATCH" });
