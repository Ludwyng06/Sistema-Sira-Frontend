"use client";

import { EstadoError } from "@/components/EstadoError";

export default function ErrorRetornoPago({ retry }: { error: Error; retry: () => void }) {
  return <EstadoError mensaje="No pudimos abrir el estado del pago. Intenta de nuevo." alReintentar={retry} />;
}
