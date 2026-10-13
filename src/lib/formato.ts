const ZONA = "America/Bogota";

const formatoPesos = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

const formatoFecha = new Intl.DateTimeFormat("es-CO", {
  timeZone: ZONA,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const formatoHora = new Intl.DateTimeFormat("es-CO", {
  timeZone: ZONA,
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

/** pesos(1250000) -> "$1.250.000" */
export function pesos(valor: number): string {
  return formatoPesos.format(valor).replace(/\s/g, "");
}

/** fecha("2026-11-02T15:00:00Z") -> "02/11/2026" */
export function fecha(iso: string | Date): string {
  return formatoFecha.format(new Date(iso));
}

/** hora("2026-11-02T19:00:00Z") -> "2:00 p. m." */
export function hora(iso: string | Date): string {
  return formatoHora
    .format(new Date(iso))
    .replace(/\s/g, " ")
    .replace(/\s?([ap])\.?\s?m\.?/i, (_, m: string) => ` ${m.toLowerCase()}. m.`);
}
