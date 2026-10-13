import type { ReactNode } from "react";
import { EncabezadoInstitucional } from "./EncabezadoInstitucional";
import { PieInstitucional } from "./PieInstitucional";

export function MarcoInstitucional({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-fondo focus:px-4 focus:py-2 focus:font-medium focus:text-azul-oscuro"
      >
        Saltar al contenido
      </a>
      <EncabezadoInstitucional />
      <main
        id="contenido"
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6"
      >
        {children}
      </main>
      <PieInstitucional />
    </>
  );
}
