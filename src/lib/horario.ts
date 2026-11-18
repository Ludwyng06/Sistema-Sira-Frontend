import type { components } from "./contrato";
import { fecha } from "./formato";
import { partesBogota } from "./zona";

/** Franja de operación de un espacio: diaSemana 0 = domingo … 6 = sábado; horas "HH:mm" de Bogotá. */
export type HorarioEspacio = components["schemas"]["HorarioEspacioDto"];

const PLURALES = ["domingos", "lunes", "martes", "miércoles", "jueves", "viernes", "sábados"];
const NOMBRES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
/** Orden de presentación: lunes primero. */
const ORDEN = [1, 2, 3, 4, 5, 6, 0];

/** Las abreviaturas "a. m."/"p. m." ya terminan en punto: evita el doble punto al cerrar la frase. */
const sinDoblePunto = (texto: string) => texto.replace(/\.\.(?=\s|$)/g, ".");

/** Horas "HH:mm" cada 15 minutos entre abre y cierra (ambas incluidas). "24:00" se expresa como 23:59. */
export function opcionesHora(abre: string, cierra: string): string[] {
  const aMin = (v: string) => Number(v.slice(0, 2)) * 60 + Number(v.slice(3, 5));
  const aTxt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  const fin = aMin(cierra);
  const horas: string[] = [];
  for (let m = aMin(abre); m <= Math.min(fin, 23 * 60 + 59); m += 15) horas.push(aTxt(m));
  if (fin >= 24 * 60) horas.push("23:59");
  else if (horas[horas.length - 1] !== cierra) horas.push(cierra);
  return horas;
}

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
/** "lunes 09/11/2026" (Bogotá). */
const formatoDiaSemana = new Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", weekday: "long" });
const diaConFecha = (iso: string) => `${formatoDiaSemana.format(new Date(iso))} ${fecha(iso)}`;

/**
 * Aviso de anticipación (se muestra al agregar, no antes). Null si la franja cumple.
 * `dias`/`enHabiles` vienen de las reglas del tipo de espacio; si faltan se omite esa parte.
 */
export function avisoAnticipacion(
  inicio: string,
  reservableDesde: string | undefined,
  dias?: number,
  enHabiles?: boolean,
): string | null {
  if (!reservableDesde || new Date(inicio).getTime() >= new Date(reservableDesde).getTime()) return null;
  const regla =
    dias !== undefined
      ? `este espacio se pide con al menos ${dias} ${enHabiles ? (dias === 1 ? "día hábil" : "días hábiles") : dias === 1 ? "día" : "días"} de anticipación`
      : "este espacio requiere más anticipación";
  return `No puedes continuar con esta reserva: ${regla}. Puedes reservar desde el ${diaConFecha(reservableDesde)}.`;
}

export function motivoFueraDeReglas(...args: Parameters<typeof calcularMotivo>): string | null {
  const m = calcularMotivo(...args);
  return m === null ? null : sinDoblePunto(m);
}

function calcularMotivo(
  inicio: string,
  fin: string,
  horarios: HorarioEspacio[],
): string | null {
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
