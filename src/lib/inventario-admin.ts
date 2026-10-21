import { api } from "./api";
import type { components } from "./contrato";

type Esquemas = components["schemas"];

export type SedeAdmin = Esquemas["SedeAdminDto"];
export type BloqueAdmin = Esquemas["BloqueAdminDto"];
export type CrearEspacio = Esquemas["CrearEspacioDto"];
export type ActualizarEspacio = Esquemas["ActualizarEspacioDto"];
export type EspacioCreado = Esquemas["EspacioCreadoDto"];
export type EstadoEspacio = NonNullable<ActualizarEspacio["estado"]>;

export const ESTADOS_ESPACIO: Record<EstadoEspacio, string> = {
  DISPONIBLE: "Disponible",
  EN_MANTENIMIENTO: "En mantenimiento",
  FUERA_DE_SERVICIO: "Fuera de servicio",
};

export const listarSedesAdmin = () =>
  api<Esquemas["PaginaSedesDto"]>("/sedes/gestion", { query: { activo: true, porPagina: 100 } });

export const listarBloquesAdmin = (sedeId: string) =>
  api<Esquemas["PaginaBloquesDto"]>("/bloques", { query: { sedeId, activo: true, porPagina: 100 } });

export const crearEspacio = (datos: CrearEspacio) =>
  api<EspacioCreado>("/espacios", { method: "POST", json: datos });

export const actualizarEspacio = (codigo: string, datos: ActualizarEspacio) =>
  api<EspacioCreado>(`/espacios/${encodeURIComponent(codigo)}`, { method: "PATCH", json: datos });

export const archivarEspacio = (codigo: string) =>
  api<void>(`/espacios/${encodeURIComponent(codigo)}/archivar`, { method: "PATCH" });
