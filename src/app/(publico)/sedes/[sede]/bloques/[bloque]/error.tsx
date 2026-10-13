"use client";

import { EstadoError } from "@/components/EstadoError";

export default function ErrorBloque({ retry }: { error: Error; retry: () => void }) {
  return (
    <EstadoError
      mensaje="No pudimos cargar este bloque. Intenta de nuevo en unos instantes."
      alReintentar={retry}
    />
  );
}
