"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore, type AnimationEvent } from "react";
import clsx from "clsx";
import { CircleAlert, CircleCheck, Info, TriangleAlert, X, type LucideIcon } from "lucide-react";
import { almacenAvisos, avisar, type Aviso, type TipoAviso } from "@/lib/avisos";

const ICONOS: Record<TipoAviso, LucideIcon> = {
  error: CircleAlert,
  exito: CircleCheck,
  info: Info,
  advertencia: TriangleAlert,
};

const ETIQUETAS: Record<TipoAviso, string> = {
  error: "Error",
  exito: "Listo",
  info: "Aviso",
  advertencia: "Atención",
};

/** El tipo se distingue por ícono, palabra y color: nunca solo por color. */
const ESTILOS: Record<TipoAviso, { franja: string; icono: string; barra: string }> = {
  error: { franja: "bg-error", icono: "bg-error-suave text-error", barra: "bg-error" },
  exito: { franja: "bg-verde", icono: "bg-exito-suave text-exito-texto", barra: "bg-verde" },
  info: { franja: "bg-turquesa", icono: "bg-turquesa-suave text-azul-oscuro", barra: "bg-turquesa" },
  advertencia: { franja: "bg-naranja", icono: "bg-aviso-suave text-aviso-texto", barra: "bg-naranja" },
};

const SIN_AVISOS: Aviso[] = [];

/**
 * Avisos flotantes: entran con una animación suave, se pueden cerrar, se detienen mientras el
 * cursor o el foco están encima y se van solos al terminar la barra de tiempo.
 */
export function Avisos() {
  const avisos = useSyncExternalStore(almacenAvisos.suscribir, almacenAvisos.instantanea, () => SIN_AVISOS);
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-3 top-3 z-[70] flex flex-col items-end gap-3 sm:inset-x-auto sm:right-5 sm:top-5 sm:w-[26rem]"
    >
      {avisos.map((a) => (
        <Tarjeta key={a.id} aviso={a} />
      ))}
    </div>
  );
}

const suscribirMovimiento = (aviso: () => void) => {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", aviso);
  return () => mq.removeEventListener("change", aviso);
};

function Tarjeta({ aviso }: { aviso: Aviso }) {
  const Icono = ICONOS[aviso.tipo];
  const estilo = ESTILOS[aviso.tipo];
  const sinMovimiento = useSyncExternalStore(
    suscribirMovimiento,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );

  // Con "reducir movimiento" no hay animaciones que avisen cuándo terminar: se usan temporizadores.
  useEffect(() => {
    if (!sinMovimiento) return;
    if (aviso.saliendo) {
      avisar.quitar(aviso.id);
      return;
    }
    const temporizador = setTimeout(() => avisar.cerrar(aviso.id), aviso.duracion);
    return () => clearTimeout(temporizador);
  }, [sinMovimiento, aviso.saliendo, aviso.id, aviso.duracion]);

  function alTerminarAnimacion(evento: AnimationEvent<HTMLElement>) {
    if (evento.target !== evento.currentTarget) return;
    if (evento.animationName === "aviso-sale") avisar.quitar(aviso.id);
  }

  return (
    <section
      role={aviso.tipo === "error" ? "alert" : "status"}
      aria-label={`${ETIQUETAS[aviso.tipo]}: ${aviso.titulo}`}
      onAnimationEnd={alTerminarAnimacion}
      className={clsx(
        "group pointer-events-auto relative w-full overflow-hidden rounded-tarjeta border border-gris-claro/50 bg-white text-texto shadow-elevada",
        aviso.saliendo ? "anim-aviso-sale" : "anim-aviso-entra",
      )}
    >
      <span aria-hidden className={clsx("absolute inset-y-0 left-0 w-1.5", estilo.franja)} />
      <div className="flex items-start gap-3 py-4 pl-5 pr-3">
        <span aria-hidden className={clsx("mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full", estilo.icono)}>
          <Icono className="size-5" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className="font-titulo text-base font-extrabold leading-snug text-tinta">{aviso.titulo}</p>
          {aviso.porQue && <p className="text-base leading-relaxed text-gris">{aviso.porQue}</p>}
          {aviso.queHacer && (
            <p className="rounded-campo bg-fondo-suave px-3 py-2 text-base leading-relaxed text-texto">
              <span className="font-bold text-azul-oscuro">Qué hacer: </span>
              {aviso.queHacer}
            </p>
          )}
          {aviso.accion && (
            <Link
              href={aviso.accion.href}
              onClick={() => avisar.cerrar(aviso.id)}
              className="mt-0.5 w-fit rounded-campo bg-azul px-3.5 py-1.5 text-base font-bold text-white transition-colors hover:bg-azul-oscuro"
            >
              {aviso.accion.texto}
            </Link>
          )}
          {aviso.soporte && (
            <p className="text-meta text-gris">
              Código de soporte: <span className="font-mono">{aviso.soporte.slice(0, 8)}</span>
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => avisar.cerrar(aviso.id)}
          aria-label={`Cerrar aviso: ${aviso.titulo}`}
          className="-mr-1 flex size-8 shrink-0 items-center justify-center rounded-full text-gris transition-colors hover:bg-fondo-suave hover:text-tinta"
        >
          <X aria-hidden className="size-5" />
        </button>
      </div>
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-gris-claro/25">
        <span
          onAnimationEnd={(e) => {
            e.stopPropagation();
            avisar.cerrar(aviso.id);
          }}
          style={{ animationDuration: `${aviso.duracion}ms` }}
          className={clsx(
            "anim-aviso-barra block h-full origin-left group-focus-within:[animation-play-state:paused] group-hover:[animation-play-state:paused]",
            estilo.barra,
          )}
        />
      </span>
    </section>
  );
}
