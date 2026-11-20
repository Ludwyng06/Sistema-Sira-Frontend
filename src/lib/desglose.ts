import { pesos } from "./formato";
import type { ReservaItem } from "./solicitudes";

/** Unidad de cobro en singular y plural; la tarifa siempre se expresa por una unidad. */
const UNIDADES: Record<string, [string, string]> = {
  HORA: ["hora", "horas"],
  JORNADA_MANANA: ["jornada de la mañana", "jornadas de la mañana"],
  JORNADA_TARDE: ["jornada de la tarde", "jornadas de la tarde"],
  JORNADA_NOCHE: ["jornada de la noche", "jornadas de la noche"],
  DIA: ["día", "días"],
};

/** Aclara la tarifa y los recargos ya incluidos en el subtotal recibido del servidor. */
export function desgloseReserva(
  reserva: Pick<ReservaItem, "unidad" | "cantidad" | "valorUnitario" | "recargos">,
): string | null {
  if (reserva.cantidad <= 0) return null;

  const codigo = reserva.unidad;
  const nombres = codigo ? UNIDADES[codigo] : undefined;
  const singular = nombres?.[0] ?? codigo?.toLowerCase().replaceAll("_", " ") ?? "";
  const unidad = reserva.cantidad === 1 ? singular : nombres?.[1] ?? singular;
  const cantidad = `${reserva.cantidad}${unidad ? ` ${unidad}` : ""}`;
  const tarifa = `tarifa ${pesos(reserva.valorUnitario)}${singular ? ` por ${singular}` : ""}`;
  const recargo = reserva.recargos > 0 ? ` · incluye recargo ${pesos(reserva.recargos)}` : "";

  return `${cantidad} · ${tarifa}${recargo}`;
}
