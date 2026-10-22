"use client";

import { Contenedor } from "@/components/MarcoInstitucional";
import { EstadoError } from "@/components/EstadoError";

export default function ErrorPortada({ retry }: { error: Error; retry: () => void }) {
  return (
    <Contenedor className="py-14">
      <EstadoError alReintentar={retry} />
    </Contenedor>
  );
}
