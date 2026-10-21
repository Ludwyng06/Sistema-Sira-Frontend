import { api } from "./api";
import type { components } from "./contrato";

type Busqueda = components["schemas"]["ResultadoBusquedaDto"];

/**
 * SOLUCIÓN TEMPORAL. La API pública de espacios no devuelve el `id` (UUID) que piden
 * disponibilidad, tarifas y solicitudes (ver ISSUE-CONTRATO-espacio-id.md). La búsqueda
 * de disponibilidad sí lo devuelve, así que se consulta un horario lejano en el futuro,
 * cuando todos los espacios están libres, y se arma el mapa código -> id.
 * Se elimina cuando el contrato incluya `id` en la ficha del espacio.
 */
const VIGENCIA_MS = 10 * 60 * 1000;
let cache: { mapa: Map<string, string>; hasta: number } | null = null;
let pendiente: Promise<Map<string, string>> | null = null;

function diaLejano(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 400);
  // Siempre un día hábil (lunes a viernes).
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

async function cargarMapa(): Promise<Map<string, string>> {
  const r = await api<Busqueda>("/disponibilidad/buscar", {
    query: { fecha: diaLejano(), horaInicio: "10:00", horaFin: "10:30", asistentes: 1 },
  });
  return new Map(r.espacios.map((e) => [e.codigo, e.espacioId]));
}

export async function resolverEspacioId(codigo: string): Promise<string | null> {
  const codigoNormal = codigo.toUpperCase();
  if (!cache || cache.hasta < Date.now()) {
    pendiente ??= cargarMapa().finally(() => {
      pendiente = null;
    });
    cache = { mapa: await pendiente, hasta: Date.now() + VIGENCIA_MS };
  }
  return cache.mapa.get(codigoNormal) ?? null;
}
