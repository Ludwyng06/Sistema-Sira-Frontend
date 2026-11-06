"use client";

import { useEffect, useRef, useState } from "react";
import { fecha } from "@/lib/formato";
import { partesBogota } from "@/lib/zona";

const DIAS_CORTOS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const aFecha = (ymd: string) => new Date(`${ymd}T12:00:00Z`);
const aYmd = (d: Date) => d.toISOString().slice(0, 10);
const sumarDias = (ymd: string, n: number) => aYmd(new Date(aFecha(ymd).getTime() + n * 86_400_000));
function sumarMeses(ymd: string, n: number): string {
  const d = aFecha(ymd);
  const total = d.getUTCFullYear() * 12 + d.getUTCMonth() + n;
  const anio = Math.floor(total / 12);
  const mes = total % 12;
  const ultimo = new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate();
  return aYmd(new Date(Date.UTC(anio, mes, Math.min(d.getUTCDate(), ultimo), 12)));
}

const formatoMes = new Intl.DateTimeFormat("es-CO", { timeZone: "UTC", month: "long", year: "numeric" });
const formatoDiaLargo = new Intl.DateTimeFormat("es-CO", {
  timeZone: "UTC",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/**
 * Selector de fecha propio (el nativo no puede deshabilitar días de la semana). Muestra dd/mm/aaaa,
 * abre un mini calendario y se maneja con teclado: flechas, Inicio/Fin, RePág/AvPág, Enter, Escape.
 * `motivoDeshabilitado` devuelve el motivo por el que un día no se puede escoger, o null si sí se puede.
 * Los días "Cerrado" llevan además el texto visible.
 */
export function SelectorFecha({
  id,
  etiqueta,
  value,
  onChange,
  motivoDeshabilitado,
}: {
  id: string;
  etiqueta: string;
  /** "aaaa-mm-dd" o "". */
  value: string;
  onChange: (valor: string) => void;
  motivoDeshabilitado: (ymd: string) => string | null;
}) {
  const [abierto, setAbierto] = useState(false);
  const [foco, setFoco] = useState(value || partesBogota(new Date()).dia);
  const raiz = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);

  // El mes que se ve es el del día con foco.
  const mes = foco.slice(0, 7);
  const primero = `${mes}-01`;
  const hueco = (aFecha(primero).getUTCDay() + 6) % 7; // lunes primero
  const diasMes = new Date(Date.UTC(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)), 0)).getUTCDate();
  const celdas: (string | null)[] = [
    ...Array<null>(hueco).fill(null),
    ...Array.from({ length: diasMes }, (_, i) => `${mes}-${String(i + 1).padStart(2, "0")}`),
  ];
  while (celdas.length % 7 !== 0) celdas.push(null);
  const semanas = Array.from({ length: celdas.length / 7 }, (_, i) => celdas.slice(i * 7, i * 7 + 7));

  // Al abrir o moverse con el teclado, el foco real sigue al día activo.
  useEffect(() => {
    if (abierto) raiz.current?.querySelector<HTMLElement>(`[data-ymd="${foco}"]`)?.focus();
  }, [abierto, foco]);

  // Clic fuera cierra el selector.
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("mousedown", fuera);
    return () => document.removeEventListener("mousedown", fuera);
  }, [abierto]);

  function abrir() {
    setFoco(value || partesBogota(new Date()).dia);
    setAbierto(true);
  }

  function cerrar() {
    setAbierto(false);
    boton.current?.focus();
  }

  function escoger(ymd: string) {
    if (motivoDeshabilitado(ymd)) return;
    onChange(ymd);
    cerrar();
  }

  function alTeclear(e: React.KeyboardEvent) {
    const mover: Record<string, string> = {
      ArrowLeft: sumarDias(foco, -1),
      ArrowRight: sumarDias(foco, 1),
      ArrowUp: sumarDias(foco, -7),
      ArrowDown: sumarDias(foco, 7),
      Home: sumarDias(foco, -((aFecha(foco).getUTCDay() + 6) % 7)),
      End: sumarDias(foco, 6 - ((aFecha(foco).getUTCDay() + 6) % 7)),
      PageUp: sumarMeses(foco, -1),
      PageDown: sumarMeses(foco, 1),
    };
    if (e.key === "Escape") {
      e.preventDefault();
      cerrar();
    } else if (mover[e.key]) {
      e.preventDefault();
      setFoco(mover[e.key] as string);
    }
  }

  return (
    <div ref={raiz} className="relative flex flex-col gap-1">
      <label htmlFor={id} className="font-bold text-tinta">
        {etiqueta}
      </label>
      <button
        ref={boton}
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={abierto}
        onClick={() => (abierto ? cerrar() : abrir())}
        className="min-h-12 w-full rounded-campo border border-gris/70 bg-fondo px-3.5 py-2.5 text-left text-base text-texto transition-colors hover:border-azul focus:border-azul"
      >
        {value ? fecha(`${value}T12:00:00-05:00`) : <span className="text-gris">dd/mm/aaaa · elegir fecha</span>}
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-label={`${etiqueta}: elegir fecha`}
          onKeyDown={alTeclear}
          className="absolute left-0 top-full z-30 mt-1 w-[19rem] max-w-[calc(100vw-2rem)] rounded-tarjeta border border-gris-claro bg-fondo p-3 shadow-elevada"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label="Mes anterior"
              onClick={() => setFoco(sumarMeses(foco, -1))}
              className="min-h-11 min-w-11 rounded-campo border border-gris-claro font-bold hover:bg-turquesa-suave"
            >
              <span aria-hidden>‹</span>
            </button>
            <p aria-live="polite" className="font-bold capitalize text-tinta">
              {formatoMes.format(aFecha(primero))}
            </p>
            <button
              type="button"
              aria-label="Mes siguiente"
              onClick={() => setFoco(sumarMeses(foco, 1))}
              className="min-h-11 min-w-11 rounded-campo border border-gris-claro font-bold hover:bg-turquesa-suave"
            >
              <span aria-hidden>›</span>
            </button>
          </div>
          <div role="grid" aria-label={formatoMes.format(aFecha(primero))} className="flex flex-col gap-1">
            <div role="row" className="grid grid-cols-7 text-center text-sm font-bold text-gris">
              {DIAS_CORTOS.map((d) => (
                <span key={d} role="columnheader">
                  {d}
                </span>
              ))}
            </div>
            {semanas.map((semana, i) => (
              <div key={i} role="row" className="grid grid-cols-7 gap-1">
                {semana.map((ymd, j) => {
                  if (!ymd) return <span key={j} role="gridcell" aria-hidden />;
                  const motivo = motivoDeshabilitado(ymd);
                  const activo = ymd === foco;
                  return (
                    <span key={ymd} role="gridcell" aria-selected={ymd === value}>
                      <button
                        type="button"
                        data-ymd={ymd}
                        tabIndex={activo ? 0 : -1}
                        aria-disabled={motivo ? true : undefined}
                        aria-label={`${formatoDiaLargo.format(aFecha(ymd))}${motivo ? `, ${motivo.toLowerCase()}` : ""}`}
                        onClick={() => escoger(ymd)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            escoger(ymd);
                          }
                        }}
                        className={
                          "flex min-h-11 w-full flex-col items-center justify-center rounded-campo text-base leading-tight " +
                          (motivo
                            ? "cursor-not-allowed bg-deshabilitado text-deshabilitado-texto"
                            : ymd === value
                              ? "bg-azul font-bold text-white"
                              : "hover:bg-turquesa-suave")
                        }
                      >
                        {Number(ymd.slice(8, 10))}
                        {motivo === "Cerrado" && <span className="text-[0.625rem] font-semibold">Cerrado</span>}
                      </button>
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
