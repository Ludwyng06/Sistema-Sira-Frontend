"use client";

import { Printer } from "lucide-react";
import { Boton } from "@/components/formularios";

/**
 * Abre el diálogo de impresión del navegador, donde también se puede elegir "Guardar como PDF".
 * El título de la pestaña se usa como nombre del archivo, así que se cambia mientras se imprime.
 */
export function BotonImprimir({ titulo, className }: { titulo: string; className?: string }) {
  function imprimir() {
    const anterior = document.title;
    document.title = titulo;
    window.addEventListener("afterprint", () => (document.title = anterior), { once: true });
    window.print();
  }
  return (
    <Boton variante="secundario" onClick={imprimir} className={`no-imprimir w-fit ${className ?? ""}`}>
      <Printer aria-hidden className="size-5" />
      Imprimir o guardar en PDF
    </Boton>
  );
}
