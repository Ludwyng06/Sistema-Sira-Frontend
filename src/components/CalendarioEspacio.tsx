"use client";

import { useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import esLocale from "@fullcalendar/core/locales/es";
import type { EventInput, EventMountArg } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import { Esqueleto, RegionCargando } from "@/components/Esqueleto";
import { EstadoError } from "@/components/EstadoError";
import {
  obtenerDisponibilidad,
  type EstadoFranja,
  type FranjaOcupada,
} from "@/lib/disponibilidad";
import { ErrorApi } from "@/lib/api";
import { fecha, hora } from "@/lib/formato";
import { aRelojBogota, deRelojBogota, partesBogota } from "@/lib/zona";
import type { HorarioEspacio } from "@/lib/horario";
import { useConsulta } from "@/lib/useConsulta";

const FullCalendar = dynamic(() => import("@fullcalendar/react"), {
  ssr: false,
  loading: () => <Esqueleto className="h-96 w-full" />,
});

const MAX_DIAS = 62;
const DIAS_LISTA = 14;

const CLASE: Record<EstadoFranja, string> = {
  RETENIDA: "estado-retenida",
  CONFIRMADA: "estado-confirmada",
  BLOQUEO: "estado-bloqueo",
};

/** Texto visible del estado: el estado nunca se comunica solo con color. */
function textoFranja(f: FranjaOcupada): string {
  return f.estado === "RETENIDA" ? "En trámite" : f.etiqueta;
}

export interface SeleccionCalendario {
  inicio: string;
  fin: string;
}

const suscribir = (aviso: () => void) => {
  const mq = window.matchMedia("(min-width: 768px)");
  mq.addEventListener("change", aviso);
  return () => mq.removeEventListener("change", aviso);
};

/**
 * Calendario de un espacio. En pantallas anchas usa FullCalendar (mes, semana, día);
 * en celular pasa a una lista por día. Con `onSeleccion` se pueden marcar franjas
 * (clic o arrastre). Las horas se muestran siempre en America/Bogota.
 */
export function CalendarioEspacio({
  espacioId,
  onSeleccion,
  seleccion,
  fechaInicial,
  restringirAHorario = false,
}: {
  espacioId: string;
  onSeleccion?: (s: SeleccionCalendario) => void;
  seleccion?: SeleccionCalendario | null;
  /** Centra la revisión en el horario solicitado, también para solicitudes pasadas. */
  fechaInicial?: string;
  /**
   * Solo para el flujo de solicitud: impide seleccionar fuera del horario del espacio o antes de
   * la anticipación mínima. Sin esto (bloqueos, ficha pública) el horario solo se muestra sombreado.
   * Es ayuda visual: el servidor valida de todos modos.
   */
  restringirAHorario?: boolean;
}) {
  const ancho = useSyncExternalStore(
    suscribir,
    () => window.matchMedia("(min-width: 768px)").matches,
    () => true,
  );

  return (
    <div className="flex flex-col gap-3">
      <LeyendaEstados />
      {ancho ? (
        <VistaCalendario espacioId={espacioId} onSeleccion={onSeleccion} seleccion={seleccion} fechaInicial={fechaInicial} restringirAHorario={restringirAHorario} />
      ) : (
        <ListaPorDia espacioId={espacioId} onSeleccion={onSeleccion} fechaInicial={fechaInicial} />
      )}
    </div>
  );
}

function LeyendaEstados() {
  const item = (clase: string, etiqueta: string) => (
    <li className="flex items-center gap-2">
      <span aria-hidden className={`inline-block h-4 w-8 rounded-campo ${clase}`} />
      {etiqueta}
    </li>
  );
  return (
    <ul aria-label="Significado de los colores" className="flex flex-wrap gap-x-5 gap-y-1 text-base">
      <li className="flex items-center gap-2">
        <span aria-hidden className="inline-block h-4 w-8 rounded-campo border border-gris-claro bg-fondo" />
        Libre
      </li>
      {item("estado-retenida", "En trámite")}
      {item("estado-confirmada", "Ocupado")}
      {item("estado-bloqueo", "Clase o mantenimiento")}
    </ul>
  );
}

function VistaCalendario({
  espacioId,
  onSeleccion,
  seleccion,
  fechaInicial,
  restringirAHorario,
}: {
  espacioId: string;
  onSeleccion?: (s: SeleccionCalendario) => void;
  seleccion?: SeleccionCalendario | null;
  fechaInicial?: string;
  restringirAHorario: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [clave, setClave] = useState(0);
  // Ausentes en la respuesta = sin restricción (comportamiento anterior).
  const [reglas, setReglas] = useState<{ horarios: HorarioEspacio[]; reservableDesde?: string }>({
    horarios: [],
  });
  const { horarios } = reglas;
  const hayHorario = horarios.length > 0;
  const minimos = hayHorario ? horarios.map((h) => h.abre).sort() : [];
  const maximos = hayHorario ? horarios.map((h) => h.cierra).sort() : [];
  const slotMin = minimos[0] ?? "06:00";
  const slotMax = maximos[maximos.length - 1] ?? "22:00";

  /**
   * Etiqueta de un día completo cerrado por horario de operación (solo en el flujo de solicitud).
   * La anticipación mínima NO deshabilita días: se avisa al agregar.
   */
  function motivoDia(dia: Date): string | null {
    if (!restringirAHorario || !hayHorario) return null;
    return horarios.some((h) => h.diaSemana === dia.getUTCDay()) ? null : "Cerrado";
  }

  const eventos: EventInput[] = [];
  if (seleccion) {
    eventos.push({
      id: "seleccion",
      title: "Tu selección",
      start: aRelojBogota(seleccion.inicio),
      end: aRelojBogota(seleccion.fin),
      classNames: ["estado-seleccion"],
    });
  }

  function alMontar(info: EventMountArg) {
    const inicio = info.event.start;
    info.el.setAttribute(
      "aria-label",
      `${info.event.title}, ${inicio ? `${fecha(deRelojBogota(inicio))} ${hora(deRelojBogota(inicio))}` : ""}`,
    );
    info.el.tabIndex = 0;
  }

  if (error) {
    return (
      <EstadoError
        mensaje={error}
        alReintentar={() => {
          setError(null);
          setClave((c) => c + 1);
        }}
      />
    );
  }

  return (
    <div className={`rounded-campo border border-gris-claro bg-fondo p-2 ${restringirAHorario ? "calendario-restringido" : ""}`}>
      <FullCalendar
        key={clave}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        locale={esLocale}
        timeZone="UTC"
        now={() => aRelojBogota(new Date())}
        initialView="timeGridWeek"
        initialDate={fechaInicial ? aRelojBogota(fechaInicial) : undefined}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        firstDay={1}
        allDaySlot={false}
        slotMinTime={`${slotMin}:00`}
        slotMaxTime={`${slotMax}:00`}
        businessHours={
          hayHorario
            ? horarios.map((h) => ({ daysOfWeek: [h.diaSemana], startTime: h.abre, endTime: h.cierra }))
            : false
        }
        dayCellClassNames={(arg) => (motivoDia(arg.date) ? ["dia-deshabilitado"] : [])}
        dayHeaderClassNames={(arg) => (arg.view.type !== "dayGridMonth" && motivoDia(arg.date) ? ["dia-deshabilitado"] : [])}
        dayHeaderContent={(arg) => {
          const motivo = arg.view.type === "dayGridMonth" ? null : motivoDia(arg.date);
          if (!motivo) return arg.text;
          const caja = document.createElement("span");
          caja.textContent = arg.text;
          const etiqueta = document.createElement("span");
          etiqueta.className = "dia-etiqueta";
          etiqueta.textContent = motivo;
          caja.append(etiqueta);
          return { domNodes: [caja] };
        }}
        dayCellContent={(arg) => {
          const motivo = motivoDia(arg.date);
          if (!motivo) return arg.dayNumberText;
          const caja = document.createElement("span");
          caja.textContent = arg.dayNumberText;
          const etiqueta = document.createElement("span");
          etiqueta.className = "dia-etiqueta";
          etiqueta.textContent = motivo;
          caja.append(etiqueta);
          return { domNodes: [caja] };
        }}
        height="auto"
        nowIndicator
        eventInteractive
        eventDidMount={alMontar}
        // Los botones ya tienen nombre accesible; el ícono es decorativo.
        viewDidMount={(info) =>
          info.el
            .closest(".fc")
            ?.querySelectorAll(".fc-icon")
            .forEach((icono) => icono.setAttribute("aria-hidden", "true"))
        }
        selectable={Boolean(onSeleccion)}
        selectMirror
        selectOverlap={false}
        selectConstraint={restringirAHorario && hayHorario ? "businessHours" : undefined}
        selectAllow={(span) => span.start.getTime() >= aRelojBogota(new Date()).getTime()}
        select={(info) =>
          onSeleccion?.({ inicio: deRelojBogota(info.start), fin: deRelojBogota(info.end) })
        }
        events={async (info, correcto, fallo) => {
          try {
            const desde = new Date(deRelojBogota(info.start));
            let hasta = new Date(deRelojBogota(info.end));
            const tope = new Date(desde.getTime() + MAX_DIAS * 86_400_000);
            if (hasta > tope) hasta = tope;
            const r = await obtenerDisponibilidad(espacioId, desde.toISOString(), hasta.toISOString());
            const nuevos = r.horarios ?? [];
            setReglas((previo) =>
              JSON.stringify(previo.horarios) === JSON.stringify(nuevos) &&
              previo.reservableDesde === r.reservableDesde
                ? previo
                : { horarios: nuevos, reservableDesde: r.reservableDesde },
            );
            correcto([
              ...(restringirAHorario ? [] : sombreados(info.start, info.end, nuevos)),
              ...r.franjas.map<EventInput>((f, i) => ({
                id: `franja-${i}`,
                title: textoFranja(f),
                start: aRelojBogota(f.inicio),
                end: aRelojBogota(f.fin),
                classNames: [CLASE[f.estado]],
              })),
              ...eventos,
            ]);
          } catch (e) {
            const mensaje =
              e instanceof ErrorApi ? e.message : "No pudimos cargar la disponibilidad.";
            setError(mensaje);
            fallo(new Error(mensaje));
          }
        }}
      />
    </div>
  );
}

/** Vista informativa (ficha pública, bloqueos): fondos con texto para horas y días cerrados. */
function sombreados(
  desde: Date,
  hasta: Date,
  horarios: HorarioEspacio[],
): EventInput[] {
  const fondos: EventInput[] = [];
  const dia = 86_400_000;
  const fondo = (id: string, start: string, end: string, title: string, clase: string): EventInput => ({
    id,
    start,
    end,
    title,
    display: "background",
    classNames: [clase],
  });
  if (horarios.length > 0) {
    for (let t = Date.UTC(desde.getUTCFullYear(), desde.getUTCMonth(), desde.getUTCDate()); t < hasta.getTime(); t += dia) {
      const d = new Date(t);
      const ymd = d.toISOString().slice(0, 10);
      const sig = new Date(t + dia).toISOString().slice(0, 10);
      const fila = horarios.find((h) => h.diaSemana === d.getUTCDay());
      if (!fila) {
        fondos.push(fondo(`cerrado-${ymd}`, `${ymd}T00:00:00`, `${sig}T00:00:00`, "Cerrado", "horario-cerrado"));
        continue;
      }
      if (fila.abre > "00:00") {
        fondos.push(fondo(`cerrado-a-${ymd}`, `${ymd}T00:00:00`, `${ymd}T${fila.abre}:00`, "Cerrado", "horario-cerrado"));
      }
      if (fila.cierra < "24:00") {
        fondos.push(fondo(`cerrado-c-${ymd}`, `${ymd}T${fila.cierra}:00`, `${sig}T00:00:00`, "Cerrado", "horario-cerrado"));
      }
    }
  }
  return fondos;
}

/** Vista para celular: lista de los próximos días con sus franjas ocupadas. */
function ListaPorDia({
  espacioId,
  fechaInicial,
}: {
  espacioId: string;
  onSeleccion?: (s: SeleccionCalendario) => void;
  fechaInicial?: string;
}) {
  const { resultado, recargar } = useConsulta(() => {
    const desde = fechaInicial ? new Date(fechaInicial) : new Date();
    const hasta = new Date(desde.getTime() + DIAS_LISTA * 86_400_000);
    return obtenerDisponibilidad(espacioId, desde.toISOString(), hasta.toISOString());
  }, [espacioId, fechaInicial ?? ""]);

  if (resultado.estado === "cargando") {
    return (
      <RegionCargando etiqueta="Cargando la disponibilidad">
        <Esqueleto className="h-40 w-full" />
      </RegionCargando>
    );
  }
  if (resultado.estado === "error") {
    return <EstadoError mensaje={resultado.mensaje} alReintentar={recargar} />;
  }

  const porDia = new Map<string, FranjaOcupada[]>();
  for (const f of resultado.datos.franjas) {
    const { dia } = partesBogota(f.inicio);
    porDia.set(dia, [...(porDia.get(dia) ?? []), f]);
  }
  if (porDia.size === 0) {
    return (
      <p className="rounded-campo border border-gris-claro bg-fondo-suave p-4">
        Sin ocupaciones en los {DIAS_LISTA} días consultados.
      </p>
    );
  }
  return (
    <ol className="flex flex-col gap-3">
      {[...porDia.entries()].map(([dia, franjas]) => (
        <li key={dia} className="rounded-campo border border-gris-claro p-3">
          <p className="font-bold">{fecha(`${dia}T12:00:00-05:00`)}</p>
          <ul className="mt-2 flex flex-col gap-2">
            {franjas.map((f, i) => (
              <li key={i} className={`rounded-campo px-3 py-2 ${CLASE[f.estado]}`}>
                <span className="font-medium">{textoFranja(f)}</span>
                {" · "}
                {hora(f.inicio)} a {hora(f.fin)}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
