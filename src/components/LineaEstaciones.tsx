import clsx from "clsx";
import { Check, X } from "lucide-react";
import type { EstadoSolicitud } from "@/lib/solicitudes";

export interface Estacion {
  clave: string;
  nombre: string;
}

const ESTACIONES_PAGO: Estacion[] = [
  { clave: "borrador", nombre: "Borrador" },
  { clave: "revision", nombre: "En revisión" },
  { clave: "cotizada", nombre: "Cotizada" },
  { clave: "pago", nombre: "Pago" },
  { clave: "confirmada", nombre: "Confirmada" },
];

/** En uso institucional no hay cotización ni pago. */
const ESTACIONES_EXENTA: Estacion[] = [
  { clave: "borrador", nombre: "Borrador" },
  { clave: "revision", nombre: "En revisión" },
  { clave: "confirmada", nombre: "Confirmada" },
];

const DETENIDAS: EstadoSolicitud[] = ["RECHAZADA", "VENCIDA", "CANCELADA"];

/** Estación en la que está la solicitud. Es solo presentación: el estado real lo manda la API. */
function posicion(estado: EstadoSolicitud, estaciones: Estacion[]): { actual: number; detenida: boolean } {
  const indice = (clave: string) => Math.max(0, estaciones.findIndex((e) => e.clave === clave));
  const detenida = DETENIDAS.includes(estado);
  switch (estado) {
    case "BORRADOR":
      return { actual: indice("borrador"), detenida };
    case "ENVIADA":
    case "EN_REVISION":
    case "RECHAZADA":
    case "CANCELADA":
      return { actual: indice("revision"), detenida };
    case "COTIZADA":
      return { actual: indice("cotizada"), detenida };
    case "PAGO_PENDIENTE":
    case "VENCIDA":
      return { actual: indice("pago"), detenida };
    default:
      return { actual: estaciones.length - 1, detenida };
  }
}

/**
 * La línea de metro: cada punto es una estación y la línea se llena hasta la actual. Es una
 * lista ordenada real ("Paso 2 de 5: En revisión"). `compacta` deja solo la línea y el nombre
 * de la estación actual (para las listas). Sirve para el asistente y para el seguimiento.
 */
export function LineaMetro({
  estaciones,
  actual,
  detenida = false,
  completa = false,
  compacta = false,
  className,
}: {
  estaciones: Estacion[];
  actual: number;
  detenida?: boolean;
  /** Todas las estaciones hechas (el flujo terminó bien). */
  completa?: boolean;
  compacta?: boolean;
  className?: string;
}) {
  const tramo = estaciones.length > 1 ? (actual / (estaciones.length - 1)) * 100 : 0;
  const final = completa;

  return (
    <div className={clsx("flex flex-col gap-2", className)}>
      <div className="relative">
        <div
          aria-hidden
          className={clsx("absolute inset-x-3 top-3 h-1 rounded-full bg-gris-claro/50", compacta && "top-2 h-0.5")}
        />
        <div
          aria-hidden
          className={clsx("absolute left-3 top-3 h-1 rounded-full", compacta && "top-2 h-0.5", detenida ? "bg-error" : "bg-azul")}
          style={{ width: `calc((100% - 1.5rem) * ${tramo / 100})` }}
        >
          <span className="linea-llena block size-full rounded-full bg-inherit" />
        </div>
        <ol className="relative flex justify-between">
          {estaciones.map((e, i) => {
            const hecha = i < actual || final;
            const aqui = i === actual;
            return (
              <li
                key={e.clave}
                aria-current={aqui ? "step" : undefined}
                className={clsx("flex flex-col items-center gap-1.5 text-center", !compacta && "w-20 sm:w-28")}
              >
                <span
                  aria-hidden
                  className={clsx(
                    "flex items-center justify-center rounded-full border-2 bg-fondo font-bold",
                    compacta ? "size-4" : "size-7",
                    hecha && "border-azul bg-azul text-white",
                    aqui && !hecha && !detenida && "border-azul text-azul-oscuro ring-4 ring-turquesa/30",
                    aqui && detenida && "border-error bg-error text-white",
                    !hecha && !aqui && "border-gris-claro text-gris",
                  )}
                >
                  {!compacta &&
                    (aqui && detenida ? (
                      <X className="size-4" />
                    ) : hecha ? (
                      <Check className="size-4" />
                    ) : (
                      <span className="text-meta">{i + 1}</span>
                    ))}
                </span>
                {!compacta && (
                  <span className={clsx("text-meta font-bold leading-tight", aqui ? "text-tinta" : "text-gris")}>
                    {e.nombre}
                    <span className="sr-only">
                      {" "}
                      (paso {i + 1} de {estaciones.length}
                      {aqui ? (detenida ? ", donde se detuvo" : ", paso actual") : hecha ? ", hecho" : ""})
                    </span>
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
      {compacta && (
        <p className="text-base text-gris">
          Paso {actual + 1} de {estaciones.length}:{" "}
          <strong className="font-bold text-texto">{estaciones[actual]?.nombre}</strong>
          {detenida && " (detenida)"}
        </p>
      )}
    </div>
  );
}

/** La línea de metro de una solicitud, según su estado. */
export function LineaEstaciones({
  estado,
  esExenta = false,
  compacta = false,
  className,
}: {
  estado: EstadoSolicitud;
  esExenta?: boolean;
  compacta?: boolean;
  className?: string;
}) {
  const estaciones = esExenta ? ESTACIONES_EXENTA : ESTACIONES_PAGO;
  const { actual, detenida } = posicion(estado, estaciones);
  return (
    <LineaMetro
      estaciones={estaciones}
      actual={actual}
      detenida={detenida}
      completa={!detenida && actual === estaciones.length - 1}
      compacta={compacta}
      className={className}
    />
  );
}
