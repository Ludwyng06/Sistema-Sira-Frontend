"use client";

import { EstadoError } from "@/components/EstadoError";

export default function ErrorPublico({ retry }: { error: Error; retry: () => void }) {
  return <EstadoError alReintentar={retry} />;
}
