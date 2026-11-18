"use client";

import type { Ref } from "react";
import { VentanaBuscando } from "./VentanaBuscando";

/**
 * Punto de llegada de `useIrAResultados`. El ancla es invisible y va con posición absoluta, así que no
 * ocupa espacio ni suma separación en el contenedor; el lector de pantalla anuncia la etiqueta al recibir
 * el foco. Mientras `buscando` es verdadero muestra la ventana "Buscando…".
 */
export function AnclaResultados({
  ref,
  etiqueta = "Resultados",
  buscando = false,
}: {
  ref: Ref<HTMLSpanElement>;
  etiqueta?: string;
  buscando?: boolean;
}) {
  return (
    <>
      <span ref={ref} tabIndex={-1} className="sr-only scroll-mt-28">
        {etiqueta}
      </span>
      <VentanaBuscando visible={buscando} />
    </>
  );
}
