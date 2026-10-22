"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { CircleAlert, RotateCw } from "lucide-react";

/** Mensaje del usuario + botón para reintentar. Sin stack traces. */
export function EstadoError({
  mensaje = "Algo salió mal al cargar esta información. Intenta de nuevo.",
  alReintentar,
}: {
  mensaje?: string;
  alReintentar?: () => void;
}) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();

  function reintentar() {
    if (alReintentar) return alReintentar();
    iniciar(() => router.refresh());
  }

  return (
    <section
      role="alert"
      className="flex flex-col items-center gap-3 rounded-lg border border-gris-claro bg-fondo-suave px-6 py-12 text-center"
    >
      <CircleAlert aria-hidden className="size-10 text-azul-oscuro" />
      <h2 className="text-xl font-bold">No pudimos cargar la información</h2>
      <p className="max-w-prose text-gris">{mensaje}</p>
      <button
        type="button"
        onClick={reintentar}
        disabled={pendiente}
        className="inline-flex items-center gap-2 rounded-lg bg-azul px-5 py-2.5 font-bold text-white shadow-[0_2px_0_0_var(--color-azul-oscuro)] transition duration-200 hover:-translate-y-px hover:bg-azul-oscuro motion-reduce:transition-none motion-reduce:hover:translate-y-0 disabled:opacity-70"
      >
        <RotateCw aria-hidden className="size-4" />
        {pendiente ? "Reintentando…" : "Reintentar"}
      </button>
    </section>
  );
}
