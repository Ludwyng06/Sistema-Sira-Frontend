import clsx from "clsx";
import { Ban, CircleCheck, Clock, FilePen, Hourglass, type LucideIcon } from "lucide-react";
import { ESTADOS, type EstadoSolicitud } from "@/lib/solicitudes";

const ICONOS: Record<EstadoSolicitud, LucideIcon> = {
  BORRADOR: FilePen,
  ENVIADA: Clock,
  EN_REVISION: Hourglass,
  COTIZADA: Hourglass,
  PAGO_PENDIENTE: Hourglass,
  CONFIRMADA: CircleCheck,
  EN_USO: CircleCheck,
  FINALIZADA: CircleCheck,
  CERRADA: CircleCheck,
  RECHAZADA: Ban,
  VENCIDA: Ban,
  CANCELADA: Ban,
  REEMBOLSADA: CircleCheck,
};

const ESTILO: Record<EstadoSolicitud, string> = {
  BORRADOR: "border-dashed border-gris text-gris",
  ENVIADA: "border-l-4 border-naranja bg-fondo-suave",
  EN_REVISION: "border-l-4 border-naranja bg-fondo-suave",
  COTIZADA: "border-l-4 border-naranja bg-fondo-suave",
  PAGO_PENDIENTE: "border-l-4 border-naranja bg-fondo-suave",
  CONFIRMADA: "border-l-4 border-verde bg-fondo-suave",
  EN_USO: "border-l-4 border-verde bg-fondo-suave",
  FINALIZADA: "border-l-4 border-verde bg-fondo-suave",
  CERRADA: "border border-gris-claro bg-fondo-suave",
  RECHAZADA: "border-2 border-azul-oscuro bg-fondo",
  VENCIDA: "border-2 border-gris bg-fondo",
  CANCELADA: "border-2 border-gris bg-fondo",
  REEMBOLSADA: "border-l-4 border-verde bg-fondo-suave",
};

/** Estado de la solicitud con color, ícono y texto: nunca solo color. */
export function InsigniaEstado({ estado }: { estado: EstadoSolicitud }) {
  const Icono = ICONOS[estado];
  return (
    <span
      className={clsx(
        "inline-flex w-fit items-center gap-1.5 rounded px-2 py-0.5 text-sm font-medium",
        ESTILO[estado],
      )}
    >
      <Icono aria-hidden className="size-4" />
      {ESTADOS[estado].etiqueta}
    </span>
  );
}
