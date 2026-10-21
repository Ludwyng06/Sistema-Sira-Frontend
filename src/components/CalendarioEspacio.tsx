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
}: {
  espacioId: string;
  onSeleccion?: (s: SeleccionCalendario) => void;
  seleccion?: SeleccionCalendario | null;
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
        <VistaCalendario espacioId={espacioId} onSeleccion={onSeleccion} seleccion={seleccion} />
      ) : (
        <ListaPorDia espacioId={espacioId} onSeleccion={onSeleccion} />
      )}
    </div>
  );
}

function LeyendaEstados() {
  const item = (clase: string, etiqueta: string) => (
    <li className="flex items-center gap-2">
      <span aria-hidden className={`inline-block h-4 w-8 rounded ${clase}`} />
      {etiqueta}
    </li>
  );
  return (
    <ul aria-label="Significado de los colores" className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
      <li className="flex items-center gap-2">
        <span aria-hidden className="inline-block h-4 w-8 rounded border border-gris-claro bg-fondo" />
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
}: {
  espacioId: string;
  onSeleccion?: (s: SeleccionCalendario) => void;
  seleccion?: SeleccionCalendario | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [clave, setClave] = useState(0);

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
    <div className="rounded-lg border border-gris-claro bg-fondo p-2">
      <FullCalendar
        key={clave}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        locale={esLocale}
        timeZone="UTC"
        now={() => aRelojBogota(new Date())}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        firstDay={1}
        allDaySlot={false}
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        height="auto"
        nowIndicator
        eventInteractive
        eventDidMount={alMontar}
        selectable={Boolean(onSeleccion)}
        selectMirror
        selectOverlap={false}
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
            correcto([
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

/** Vista para celular: lista de los próximos días con sus franjas ocupadas. */
function ListaPorDia({
  espacioId,
}: {
  espacioId: string;
  onSeleccion?: (s: SeleccionCalendario) => void;
}) {
  const { resultado, recargar } = useConsulta(() => {
    const desde = new Date();
    const hasta = new Date(desde.getTime() + DIAS_LISTA * 86_400_000);
    return obtenerDisponibilidad(espacioId, desde.toISOString(), hasta.toISOString());
  }, [espacioId]);

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
      <p className="rounded-lg border border-gris-claro bg-fondo-suave p-4">
        Sin ocupaciones en los próximos {DIAS_LISTA} días: el espacio está libre.
      </p>
    );
  }
  return (
    <ol className="flex flex-col gap-3">
      {[...porDia.entries()].map(([dia, franjas]) => (
        <li key={dia} className="rounded-lg border border-gris-claro p-3">
          <h3 className="font-bold">{fecha(`${dia}T12:00:00-05:00`)}</h3>
          <ul className="mt-2 flex flex-col gap-2">
            {franjas.map((f, i) => (
              <li key={i} className={`rounded px-3 py-2 ${CLASE[f.estado]}`}>
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
