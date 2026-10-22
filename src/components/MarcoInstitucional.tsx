import type { ReactNode } from "react";
import clsx from "clsx";
import { EncabezadoInstitucional } from "./EncabezadoInstitucional";
import { PieInstitucional } from "./PieInstitucional";

/** Contenedor de ancho normal para el contenido de las páginas. */
export function Contenedor({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx("mx-auto w-full max-w-6xl px-4 sm:px-6", className)}>{children}</div>;
}

/**
 * Encabezado, contenido y pie. Con `completo` el contenido ocupa todo el ancho
 * (la portada); cada sección decide su propio contenedor.
 */
export function MarcoInstitucional({
  children,
  completo = false,
}: {
  children: ReactNode;
  completo?: boolean;
}) {
  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-fondo focus:px-4 focus:py-2 focus:font-medium focus:text-azul-oscuro"
      >
        Saltar al contenido
      </a>
      <EncabezadoInstitucional />
      <main id="contenido" className={clsx("flex-1", !completo && "mx-auto w-full max-w-6xl px-4 py-10 sm:px-6")}>
        {children}
      </main>
      <PieInstitucional />
    </>
  );
}
