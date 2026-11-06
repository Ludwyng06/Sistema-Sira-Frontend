import clsx from "clsx";
import {
  Ban,
  CircleCheck,
  Coins,
  FilePen,
  Hourglass,
  type LucideIcon,
} from "lucide-react";
import { ESTADOS, type EstadoSolicitud } from "@/lib/solicitudes";

type Familia = "borrador" | "tramite" | "cobro" | "listo" | "cerrado" | "detenido";

const FAMILIA: Record<EstadoSolicitud, Familia> = {
  BORRADOR: "borrador",
  ENVIADA: "tramite",
  EN_REVISION: "tramite",
  COTIZADA: "cobro",
  PAGO_PENDIENTE: "cobro",
  CONFIRMADA: "listo",
  EN_USO: "listo",
  FINALIZADA: "listo",
  REEMBOLSADA: "listo",
  CERRADA: "cerrado",
  RECHAZADA: "detenido",
  VENCIDA: "detenido",
  CANCELADA: "detenido",
};

const ICONO: Record<Familia, LucideIcon> = {
  borrador: FilePen,
  tramite: Hourglass,
  cobro: Coins,
  listo: CircleCheck,
  cerrado: CircleCheck,
  detenido: Ban,
};

/** Forma de sello + ícono + texto: el estado nunca depende solo del color. */
const ESTILO: Record<Familia, string> = {
  borrador: "border-dashed border-gris bg-fondo text-gris",
  tramite: "border-naranja bg-aviso-suave text-aviso-texto",
  cobro: "border-azul bg-turquesa-suave text-azul-oscuro",
  listo: "border-verde bg-exito-suave text-exito-texto",
  cerrado: "border-gris-claro bg-fondo-suave text-texto",
  detenido: "border-error bg-error-suave text-error",
};

/**
 * Sello de estado de una solicitud: doble borde como un sello de pasaporte, con un giro
 * mínimo. Se estampa una vez al aparecer (con "reducir movimiento" queda quieto).
 */
export function InsigniaEstado({
  estado,
  className,
}: {
  estado: EstadoSolicitud;
  className?: string;
}) {
  const familia = FAMILIA[estado];
  const Icono = ICONO[familia];
  return (
    <span
      className={clsx(
        "anim-sello inline-flex w-fit items-center gap-2 rounded-full border-2 px-3.5 py-1 text-base font-extrabold leading-tight",
        "shadow-[0_0_0_3px_var(--color-fondo),0_0_0_4.5px_currentColor]",
        ESTILO[familia],
        className,
      )}
    >
      <Icono aria-hidden className="size-4 shrink-0" />
      {ESTADOS[estado].etiqueta}
    </span>
  );
}

export { InsigniaEstado as Sello };
