import { listarEspacios, obtenerEspacio } from "./inventario";

/**
 * Identificadores públicos del inventario, independientes de los horarios y de la
 * disponibilidad. Se recorren todas las páginas para resolver también los espacios
 * que no aparecen en la primera página del catálogo.
 */
const VIGENCIA_MS = 10 * 60 * 1000;
let cache: { mapa: Map<string, string>; hasta: number } | null = null;
let pendiente: Promise<Map<string, string>> | null = null;

async function cargarMapa(): Promise<Map<string, string>> {
  const resultado = new Map<string, string>();
  let pagina = 1;
  while (true) {
    const respuesta = await listarEspacios({ pagina, porPagina: 100 });
    for (const espacio of respuesta.datos) resultado.set(espacio.codigo, espacio.id);
    if (respuesta.pagina * respuesta.porPagina >= respuesta.total || respuesta.datos.length === 0) break;
    pagina += 1;
  }
  return resultado;
}

async function mapa(): Promise<Map<string, string>> {
  if (!cache || cache.hasta < Date.now()) {
    pendiente ??= cargarMapa().finally(() => {
      pendiente = null;
    });
    cache = { mapa: await pendiente, hasta: Date.now() + VIGENCIA_MS };
  }
  return cache.mapa;
}

export async function resolverEspacioId(codigo: string): Promise<string | null> {
  return (await obtenerEspacio(codigo)).id;
}

/** Para mostrar el código de un espacio a partir del id que traen las reservas. */
export async function resolverCodigoPorId(espacioId: string): Promise<string | null> {
  for (const [codigo, id] of await mapa()) if (id === espacioId) return codigo;
  return null;
}
