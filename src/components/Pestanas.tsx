"use client";

import clsx from "clsx";
import type { ReactNode } from "react";

/**
 * Pestañas accesibles (role="tablist") con flechas, Inicio y Fin, con el mismo aspecto que las de
 * Configuración. Solo se monta el panel activo.
 */
export function Pestanas({
  id,
  etiqueta,
  pestanas,
  activa,
  alCambiar,
  children,
}: {
  id: string;
  etiqueta: string;
  pestanas: string[];
  activa: number;
  alCambiar: (indice: number) => void;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div role="tablist" aria-label={etiqueta} className="flex flex-wrap gap-2">
        {pestanas.map((titulo, indice) => (
          <button
            key={titulo}
            id={`${id}-tab-${indice}`}
            type="button"
            role="tab"
            aria-selected={activa === indice}
            aria-controls={`${id}-panel-${indice}`}
            tabIndex={activa === indice ? 0 : -1}
            className={clsx(
              "min-h-11 rounded-campo border border-gris-claro px-4 font-bold",
              activa === indice ? "bg-azul text-white" : "text-azul-oscuro",
            )}
            onClick={() => alCambiar(indice)}
            onKeyDown={(evento) => {
              const total = pestanas.length;
              const siguiente =
                evento.key === "ArrowRight"
                  ? (indice + 1) % total
                  : evento.key === "ArrowLeft"
                    ? (indice + total - 1) % total
                    : evento.key === "Home"
                      ? 0
                      : evento.key === "End"
                        ? total - 1
                        : null;
              if (siguiente !== null) {
                evento.preventDefault();
                alCambiar(siguiente);
                document.getElementById(`${id}-tab-${siguiente}`)?.focus();
              }
            }}
          >
            {titulo}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`${id}-panel-${activa}`} aria-labelledby={`${id}-tab-${activa}`}>
        {children}
      </div>
    </div>
  );
}
