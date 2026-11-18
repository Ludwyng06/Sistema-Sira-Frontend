"use client";

import { pesos } from "@/lib/formato";
import { simularCancelacion } from "@/lib/solicitudes";
import { useConsulta } from "@/lib/useConsulta";

/**
 * Lo que se reembolsaría al cancelar ahora, calculado por el backend con la política RN-14: días de
 * antelación, porcentaje y valor en pesos. Se monta solo cuando el diálogo de cancelar está abierto.
 */
export function SimulacionCancelacion({ solicitudId, esExenta }: { solicitudId: string; esExenta: boolean }) {
  const { resultado, recargar } = useConsulta(() => simularCancelacion(solicitudId), [solicitudId]);

  if (resultado.estado === "cargando") {
    return (
      <p role="status" className="text-gris">
        Calculando cuánto se reembolsa…
      </p>
    );
  }
  if (resultado.estado === "error") {
    return (
      <p className="text-gris">
        No pudimos calcular el reembolso ({resultado.mensaje}).{" "}
        <button type="button" onClick={recargar} className="font-bold text-azul-oscuro underline underline-offset-4">
          Intentar de nuevo
        </button>
      </p>
    );
  }
  const s = resultado.datos;
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-campo border border-gris-claro bg-fondo-suave p-3">
      <dt className="font-medium">Faltan</dt>
      <dd>
        {s.diasDeAntelacion} día{s.diasDeAntelacion === 1 ? "" : "s"} para el evento
      </dd>
      <dt className="font-medium">Se reembolsa</dt>
      <dd>
        {s.porcentajeReembolso} %{s.canceladaPorInstitucion && " (cancelación por causa institucional)"}
      </dd>
      <dt className="font-bold">Valor a reembolsar</dt>
      <dd className="text-lg font-bold">{esExenta ? "No aplica: es de uso institucional sin costo" : pesos(s.valorReembolso)}</dd>
    </dl>
  );
}
