import type { components } from "./contrato";
import { fecha, hora } from "./formato";
import { partesBogota } from "./zona";

/** Franja de operación de un espacio: diaSemana 0 = domingo … 6 = sábado; horas "HH:mm" de Bogotá. */
export type HorarioEspacio = components["schemas"]["HorarioEspacioDto"];

const PLURALES = ["domingos", "lunes", "martes", "miércoles", "jueves", "viernes", "sábados"];
const NOMBRES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
/** Orden de presentación: lunes primero. */
const ORDEN = [1, 2, 3, 4, 5, 6, 0];

/** "14:30" -> "2:30 p. m." */
export function hora12(valor: string): string {
  const [h, m] = valor.split(":").map(Number) as [number, number];
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "a. m." : "p. m."}`;
}

/** Texto del horario agrupando días seguidos iguales: "Lunes a viernes 6:00 a. m. a 10:00 p. m. · Domingo cerrado". */
export function textoHorario(horarios: HorarioEspacio[]): string {
  if (horarios.length === 0) return "";
  const clave = (d: number) => {
    const h = horarios.find((x) => x.diaSemana === d);
    return h ? `${hora12(h.abre)} a ${hora12(h.cierra)}` : "cerrado";
  };
  const grupos: { dias: number[]; texto: string }[] = [];
  for (const d of ORDEN) {
    const texto = clave(d);
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.texto === texto) ultimo.dias.push(d);
    else grupos.push({ dias: [d], texto });
  }
  return grupos
    .map(({ dias, texto }) => {
      const primero = NOMBRES[dias[0] as number] as string;
      const ultimo = NOMBRES[dias[dias.length - 1] as number] as string;
      const nombre =
        dias.length === 1
          ? primero
          : dias.length === 2
            ? `${primero} y ${ultimo.toLowerCase()}`
            : `${primero} a ${ultimo.toLowerCase()}`;
      return `${nombre} ${texto}`;
    })
    .join(" · ");
}

/**
 * Aviso inmediato (solo ayuda visual; el servidor decide). Devuelve el motivo o null.
 * `inicio` y `fin` son instantes ISO UTC.
 */
export function motivoFueraDeReglas(
  inicio: string,
  fin: string,
  horarios: HorarioEspacio[],
  reservableDesde?: string,
): string | null {
  if (reservableDesde && new Date(inicio).getTime() < new Date(reservableDesde).getTime()) {
    return `Este espacio requiere más anticipación: se puede reservar desde el ${fecha(reservableDesde)} a las ${hora(reservableDesde)}.`;
  }
  if (horarios.length === 0) return null;
  const ini = partesBogota(inicio);
  const fn = partesBogota(fin);
  const dow = new Date(`${ini.dia}T12:00:00Z`).getUTCDay();
  const fila = horarios.find((h) => h.diaSemana === dow);
  if (!fila) return `El espacio está cerrado los ${PLURALES[dow]}. Elige otro día.`;
  // Una franja que termina justo a las 00:00 del día siguiente equivale a "24:00" del día de inicio.
  const sigueDia = new Date(new Date(`${ini.dia}T12:00:00Z`).getTime() + 86_400_000).toISOString().slice(0, 10);
  const finHora = fn.dia === ini.dia ? fn.hora : fn.dia === sigueDia && fn.hora === "00:00" ? "24:00" : null;
  if (ini.hora < fila.abre || finHora === null || finHora > fila.cierra) {
    return `Ese día el espacio opera de ${hora12(fila.abre)} a ${hora12(fila.cierra)}. Ajusta la hora.`;
  }
  return null;
}
