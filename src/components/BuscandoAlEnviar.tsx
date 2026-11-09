"use client";

import { useEffect, useRef, useState } from "react";
import { VentanaBuscando } from "./VentanaBuscando";

/**
 * Para los formularios GET de las páginas públicas (se envían recargando la página): al enviar el
 * formulario que lo contiene, muestra la ventana de "Buscando…" hasta que llega la página de resultados.
 */
export function BuscandoAlEnviar({ detalle }: { detalle?: string }) {
  const marca = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const formulario = marca.current?.closest("form");
    if (!formulario) return;
    const alEnviar = () => setVisible(true);
    // Si se vuelve con "atrás", el navegador puede restaurar la página con la ventana abierta.
    const alMostrar = (evento: PageTransitionEvent) => {
      if (evento.persisted) setVisible(false);
    };
    formulario.addEventListener("submit", alEnviar);
    window.addEventListener("pageshow", alMostrar);
    return () => {
      formulario.removeEventListener("submit", alEnviar);
      window.removeEventListener("pageshow", alMostrar);
    };
  }, []);

  return (
    <>
      <span ref={marca} hidden />
      <VentanaBuscando visible={visible} detalle={detalle} />
    </>
  );
}
