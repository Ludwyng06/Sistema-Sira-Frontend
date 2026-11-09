"use client";

import { createPortal } from "react-dom";

/**
 * Ventana pequeña de "Buscando…" mientras se aplica un filtro o una búsqueda: el logo de la U gira como
 * una moneda en 3D, con una órbita y un brillo debajo. No bloquea la página. Con "reducir movimiento"
 * se muestra quieta. Se monta en <body> para que ningún contenedor la recorte.
 */
export function VentanaBuscando({
  visible,
  titulo = "Buscando…",
  detalle = "Estamos trayendo los resultados.",
}: {
  visible: boolean;
  titulo?: string;
  detalle?: string;
}) {
  if (!visible || typeof document === "undefined") return null;
  return createPortal(
    <div className="buscando-fondo fixed inset-0 z-[90] flex items-center justify-center p-4" aria-hidden={false}>
      <div
        role="status"
        aria-live="polite"
        className="buscando-tarjeta flex w-full max-w-xs flex-col items-center gap-4 rounded-tarjeta bg-fondo px-6 py-7 text-center shadow-elevada ring-1 ring-gris-claro/50"
      >
        <div className="buscando-escena" aria-hidden>
          <div className="buscando-orbita">
            <span className="buscando-punto" />
          </div>
          <div className="buscando-moneda">
            {/* Canto de la moneda: capas apiladas en profundidad. */}
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <span key={i} className="buscando-canto" style={{ transform: `translateZ(${-i}px)` }} />
            ))}
            <span className="buscando-cara buscando-cara-frente">
              {/* eslint-disable-next-line @next/next/no-img-element -- logo local pequeño, sin optimizar */}
              <img src="/marca/logo-u-blanco.png" alt="" className="h-14 w-auto" />
            </span>
            <span className="buscando-cara buscando-cara-atras">
              {/* eslint-disable-next-line @next/next/no-img-element -- logo local pequeño, sin optimizar */}
              <img src="/marca/logo-u-blanco.png" alt="" className="h-14 w-auto" />
            </span>
          </div>
          <span className="buscando-sombra" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="font-titulo text-xl font-black text-tinta">{titulo}</p>
          <p className="text-base text-gris">{detalle}</p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
