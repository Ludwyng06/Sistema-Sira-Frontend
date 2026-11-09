"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Tiempo mínimo de la ventana "Buscando…", para que no parpadee cuando la respuesta es inmediata. */
const MINIMO_MS = 1400;

/**
 * Filtrar y llegar a los resultados. `ir()` se llama al aplicar el filtro o cambiar de página: abre la
 * ventana "Buscando…" (`buscando`) y, cuando la consulta termina (`terminada` pasa a verdadero), la cierra,
 * desplaza la página hasta el ancla y le pasa el foco, para que también quien usa lector de pantalla llegue
 * a los resultados. Con "reducir movimiento" el salto es inmediato.
 */
export function useIrAResultados<T extends HTMLElement = HTMLElement>(terminada: boolean) {
  const destino = useRef<T>(null);
  const inicio = useRef<number | null>(null);
  const [pedido, setPedido] = useState(0);
  const [buscando, setBuscando] = useState(false);

  const ir = useCallback(() => {
    inicio.current = performance.now();
    setBuscando(true);
    setPedido((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!terminada || inicio.current === null) return;
    const espera = Math.max(0, MINIMO_MS - (performance.now() - inicio.current));
    const temporizador = window.setTimeout(() => {
      inicio.current = null;
      setBuscando(false);
      const elemento = destino.current;
      if (!elemento) return;
      const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      elemento.scrollIntoView({ behavior: reducir ? "auto" : "smooth", block: "start" });
      elemento.focus({ preventScroll: true });
    }, espera);
    return () => window.clearTimeout(temporizador);
  }, [terminada, pedido]);

  return { destino, ir, buscando };
}
