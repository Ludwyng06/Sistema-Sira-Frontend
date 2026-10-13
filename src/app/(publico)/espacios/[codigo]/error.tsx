"use client";

import { EstadoError } from "@/components/EstadoError";

export default function ErrorEspacio({ retry }: { error: Error; retry: () => void }) {
  return (
    <EstadoError
      mensaje="No pudimos cargar la ficha de este espacio. Intenta de nuevo en unos instantes."
      alReintentar={retry}
    />
  );
}
