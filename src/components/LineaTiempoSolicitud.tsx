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
}

/** Línea de tiempo armada con las fechas y decisiones que publica la API. */
export function LineaTiempoSolicitud({ solicitud }: { solicitud: SolicitudDetalle }) {
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
          {h.detalle && <p className="mt-1 max-w-prose">Motivo: {h.detalle}</p>}
        </li>
      ))}
    </ol>
  );
}
