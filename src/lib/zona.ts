/**
 * Bogotá es UTC-5 todo el año (sin horario de verano). FullCalendar no maneja zonas con nombre
 * sin un plugin extra, así que se trabaja en "UTC corrido": el reloj de Bogotá escrito como UTC.
 */
const DESPLAZAMIENTO_MS = 5 * 60 * 60 * 1000;

/** Instante real (ISO UTC) -> reloj de Bogotá escrito como UTC. */
export const aRelojBogota = (iso: string | Date): Date =>
  new Date(new Date(iso).getTime() - DESPLAZAMIENTO_MS);

/** Reloj de Bogotá escrito como UTC -> instante real (ISO UTC). */
export const deRelojBogota = (reloj: Date): string =>
  new Date(reloj.getTime() + DESPLAZAMIENTO_MS).toISOString();

/** "2026-11-10" + "08:00" (hora de Bogotá) -> ISO UTC. */
export const aInstanteUtc = (dia: string, horaLocal: string): string =>
  new Date(`${dia}T${horaLocal}:00.000-05:00`).toISOString();

/** ISO UTC -> { dia: "2026-11-10", hora: "08:00" } en Bogotá. */
export function partesBogota(iso: string | Date): { dia: string; hora: string } {
  const t = aRelojBogota(iso).toISOString();
  return { dia: t.slice(0, 10), hora: t.slice(11, 16) };
}
