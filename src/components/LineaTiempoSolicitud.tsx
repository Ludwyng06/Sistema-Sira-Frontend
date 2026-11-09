import { fecha, hora } from "@/lib/formato";
import type { SolicitudDetalle } from "@/lib/solicitudes";

const TIPO: Record<string, string> = { AVAL: "Aval del responsable", APROBACION: "Aprobación" };
const RESULTADO: Record<string, string> = {
  APROBADA: "aprobada",
  RECHAZADA: "rechazada",
  DEVUELTA: "devuelta para corregir",
  RECLASIFICADA: "reclasificada como uso particular",
};

interface Hito {
  clave: string;
  cuando: string;
  titulo: string;
  detalle?: string | null;
  /** Rótulo del detalle; por omisión "Motivo". */
  etiquetaDetalle?: string;
}

const ACTA: Record<string, string> = { ENTREGA: "Acta de entrega registrada", DEVOLUCION: "Acta de devolución registrada" };

/**
 * Línea de tiempo armada con las fechas y decisiones que publica la API.
 * La cotización no aparece porque la API todavía no publica cuándo se emitió.
 */
export function LineaTiempoSolicitud({ solicitud }: { solicitud: SolicitudDetalle }) {
  const cancelada = solicitud.estado === "CANCELADA" || solicitud.estado === "REEMBOLSADA";
  const hitos: Hito[] = [
    { clave: "creada", cuando: solicitud.creadoEn, titulo: "Borrador creado" },
    ...(solicitud.enviadaEn
      ? [{ clave: "enviada", cuando: solicitud.enviadaEn, titulo: "Solicitud enviada" }]
      : []),
    ...solicitud.decisiones.map((d, i) => ({
      clave: `decision-${i}`,
      cuando: d.decididaEn,
      titulo: `${TIPO[d.tipo] ?? d.tipo}: ${RESULTADO[d.resultado] ?? d.resultado}`,
      detalle: d.motivo,
    })),
    ...(solicitud.actas ?? []).map((a) => ({
      clave: `acta-${a.id}`,
      cuando: a.registradaEn,
      titulo: `${ACTA[a.tipo] ?? "Acta registrada"} (${a.consecutivo})`,
      detalle: a.observaciones,
      etiquetaDetalle: "Observaciones",
    })),
    // La cancelación y el reembolso se registran juntos; sin reembolso, la última actualización es la cancelación.
    ...(cancelada
      ? [
          {
            clave: "cancelada",
            cuando: solicitud.reembolso?.creadoEn ?? solicitud.actualizadoEn,
            titulo: solicitud.reembolso ? "Solicitud cancelada · reembolso registrado" : "Solicitud cancelada",
            detalle: solicitud.reembolso?.motivo,
            etiquetaDetalle: "Reembolso",
          },
        ]
      : []),
  ].sort((a, b) => new Date(a.cuando).getTime() - new Date(b.cuando).getTime());

  return (
    <ol className="flex flex-col border-l-2 border-gris-claro pl-5">
      {hitos.map((h) => (
        <li key={h.clave} className="relative pb-5 last:pb-0">
          <span
            aria-hidden
            className="absolute -left-[1.6rem] top-1.5 size-3 rounded-full border-2 border-azul bg-fondo"
          />
          <p className="font-medium">{h.titulo}</p>
          <p className="text-base text-gris">
            {fecha(h.cuando)} · {hora(h.cuando)}
          </p>
          {h.detalle && (
            <p className="mt-1 max-w-prose">
              {h.etiquetaDetalle ?? "Motivo"}: {h.detalle}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
