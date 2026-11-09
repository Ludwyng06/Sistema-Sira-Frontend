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
export type CrearSede = Esquemas["CrearSedeDto"];
export type ActualizarSede = Esquemas["ActualizarSedeDto"];
export type CrearBloque = Esquemas["CrearBloqueDto"];
export type ActualizarBloque = Esquemas["ActualizarBloqueDto"];
export type TipoEspacioAdmin = Esquemas["TipoEspacioAdminDto"];
export type CrearTipoEspacio = Esquemas["CrearTipoEspacioDto"];
export type ActualizarTipoEspacio = Esquemas["ActualizarTipoEspacioDto"];
export type FotoEspacio = Esquemas["FotoDto"];

/** Filtro de archivo: `true` solo activos, `false` solo archivados, sin valor todos. */
type FiltroActivo = boolean | undefined;

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

export const listarSedesAdmin = (activo: FiltroActivo = true) =>
  api<Esquemas["PaginaSedesDto"]>("/sedes/gestion", { query: { activo, porPagina: 100 } });

export const listarBloquesAdmin = (sedeId: string, activo: FiltroActivo = true) =>
  api<Esquemas["PaginaBloquesDto"]>("/bloques", { query: { sedeId, activo, porPagina: 100 } });

export const crearSede = (datos: CrearSede) => api<SedeAdmin>("/sedes", { method: "POST", json: datos });
export const actualizarSede = (id: string, datos: ActualizarSede) =>
  api<SedeAdmin>(`/sedes/${encodeURIComponent(id)}`, { method: "PATCH", json: datos });
export const archivarSede = (id: string) =>
  api<SedeAdmin>(`/sedes/${encodeURIComponent(id)}/archivar`, { method: "PATCH" });
export const restaurarSede = (id: string) =>
  api<SedeAdmin>(`/sedes/${encodeURIComponent(id)}/restaurar`, { method: "PATCH" });

export const crearBloque = (datos: CrearBloque) => api<BloqueAdmin>("/bloques", { method: "POST", json: datos });
export const actualizarBloque = (id: string, datos: ActualizarBloque) =>
  api<BloqueAdmin>(`/bloques/${encodeURIComponent(id)}`, { method: "PATCH", json: datos });
export const archivarBloque = (id: string) =>
  api<BloqueAdmin>(`/bloques/${encodeURIComponent(id)}/archivar`, { method: "PATCH" });
export const restaurarBloque = (id: string) =>
  api<BloqueAdmin>(`/bloques/${encodeURIComponent(id)}/restaurar`, { method: "PATCH" });

export const listarTiposEspacioAdmin = (activo: FiltroActivo = undefined) =>
  api<Esquemas["PaginaTiposEspacioDto"]>("/tipos-espacio/gestion", { query: { activo, porPagina: 100 } });
export const crearTipoEspacio = (datos: CrearTipoEspacio) =>
  api<TipoEspacioAdmin>("/tipos-espacio", { method: "POST", json: datos });
export const actualizarTipoEspacio = (id: string, datos: ActualizarTipoEspacio) =>
  api<TipoEspacioAdmin>(`/tipos-espacio/${encodeURIComponent(id)}`, { method: "PATCH", json: datos });
export const archivarTipoEspacio = (id: string) =>
  api<TipoEspacioAdmin>(`/tipos-espacio/${encodeURIComponent(id)}/archivar`, { method: "PATCH" });
export const restaurarTipoEspacio = (id: string) =>
  api<TipoEspacioAdmin>(`/tipos-espacio/${encodeURIComponent(id)}/restaurar`, { method: "PATCH" });

/** Sube una foto del espacio (JPG o PNG de hasta 10 MB) con su texto alternativo obligatorio. */
export function subirFotoEspacio(
  espacioId: string,
  datos: { archivo: File; textoAlternativo: string; esPortada: boolean; orden?: number },
) {
  const formulario = new FormData();
  formulario.set("archivo", datos.archivo);
  formulario.set("textoAlternativo", datos.textoAlternativo);
  formulario.set("esPortada", String(datos.esPortada));
  if (datos.orden !== undefined) formulario.set("orden", String(datos.orden));
  return api<FotoEspacio>(`/espacios/${encodeURIComponent(espacioId)}/fotos`, { method: "POST", formData: formulario });
}

export const eliminarFotoEspacio = (espacioId: string, fotoId: string) =>
  api<void>(`/espacios/${encodeURIComponent(espacioId)}/fotos/${encodeURIComponent(fotoId)}`, { method: "DELETE" });

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

export const restaurarEspacio = (codigo: string) =>
  api<void>(`/espacios/${encodeURIComponent(codigo)}/restaurar`, { method: "PATCH" });
