import { api } from "./api";

export interface TotalConciliacion { cantidad: number; valor: number }
export interface InformeConciliacion {
  fecha: string;
  generadoEn: string;
  totales: Record<"aprobadas" | "rechazadas" | "pendientes" | "anuladas", TotalConciliacion>;
  porProveedor: ({ proveedor: string } & Record<"aprobadas" | "rechazadas" | "pendientes", TotalConciliacion>)[];
  filas: {
    ordenId: string; referencia: string; proveedor: string | null;
    medio: "PASARELA" | "CONSIGNACION" | "ORDEN_SERVICIO"; estado: string; valor: number;
    transaccionExternaId: string | null; pagadoEn: string | null;
  }[];
  diferencias: {
    referencia: string | null; tipo: "VALOR" | "SIN_ORDEN" | "SIN_EXTRACTO" | "ESTADO";
    valorSistema: number | null; valorExtracto: number | null; detalle: string;
  }[];
}

export const consultarConciliacion = (fecha: string) =>
  api<InformeConciliacion>("/pagos/conciliacion", { query: { fecha } });

export function compararExtracto(fecha: string, archivo: File) {
  const formData = new FormData();
  formData.append("archivo", archivo);
  return api<InformeConciliacion>("/pagos/conciliacion/extracto", { method: "POST", query: { fecha }, formData });
}

export const descargarConciliacionPdf = (fecha: string) =>
  api<Blob>("/pagos/conciliacion/pdf", { query: { fecha }, blob: true });

/** Ayer calendario en Bogotá, incluso si el navegador está en otra zona horaria. */
export function ayerBogota(ahora = new Date()): string {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(ahora);
  const parte = (tipo: string) => Number(partes.find((p) => p.type === tipo)!.value);
  return new Date(Date.UTC(parte("year"), parte("month") - 1, parte("day") - 1)).toISOString().slice(0, 10);
}

export function fechaConsulta(texto: string): string | null {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto);
  if (!partes) return null;
  const [, dia, mes, anio] = partes;
  const iso = `${anio}-${mes}-${dia}`;
  const fecha = new Date(`${iso}T12:00:00-05:00`);
  return Number(anio) >= 1900 && Number.isFinite(fecha.getTime()) && fecha.toISOString().slice(0, 10) === iso ? iso : null;
}

export function errorExtracto(archivo: File): string | null {
  if (!/\.csv$/i.test(archivo.name) || !["", "text/csv", "application/csv", "application/vnd.ms-excel", "text/plain"].includes(archivo.type.toLowerCase())) {
    return "Selecciona un archivo CSV con las columnas referencia,valor,fecha.";
  }
  if (archivo.size === 0) return "El archivo CSV está vacío.";
  if (archivo.size > 2 * 1024 * 1024) return "El archivo CSV debe pesar como máximo 2 MB.";
  return null;
}
