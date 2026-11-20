import { pesos } from "@/lib/formato";
import { desgloseReserva } from "@/lib/desglose";
import type { EstimadoSolicitud, ReservaItem, ServicioItem } from "@/lib/solicitudes";

/** Tarifa de la franja y recargos incluidos, debajo de su valor principal. */
export function DetalleFranja({ reserva }: { reserva: ReservaItem }) {
  const detalle = desgloseReserva(reserva);
  if (!detalle) return null;
  return (
    <span className="block text-base text-gris">
      {detalle}
    </span>
  );
}

/** "2 × Sonido profesional ($150.000 c/u)". */
export function DetalleServicio({ servicio }: { servicio: ServicioItem }) {
  return (
    <span className="block text-base text-gris">
      {servicio.cantidad} × {pesos(servicio.valorUnitario)} c/u
    </span>
  );
}

/**
 * Totales del estimado de la solicitud (`estimado` de GET /solicitudes/:id). Se muestra mientras no hay
 * cotización; el valor definitivo lo da la cotización. En uso institucional el total es solo el valor
 * comercial de referencia (RN-08): si se aprueba, se paga $0.
 */
export function TotalesEstimados({
  estimado,
  institucional,
}: {
  estimado: EstimadoSolicitud;
  institucional: boolean;
}) {
  return (
    <section aria-labelledby="titulo-totales-estimados" className="flex flex-col gap-2">
      <h3 id="titulo-totales-estimados" className="text-lg font-bold">
        {institucional ? "Valor de referencia" : "Total estimado"}
      </h3>
      <dl className="grid max-w-md grid-cols-[1fr_auto] gap-x-6 gap-y-1 rounded-campo border border-gris-claro p-4">
        <dt>Base (tiempo × tarifa y servicios)</dt>
        <dd className="text-right">{pesos(estimado.base)}</dd>
        <dt>Recargos (nocturno, dominical, festivo)</dt>
        <dd className="text-right">{pesos(estimado.recargos)}</dd>
        <dt>Subtotal</dt>
        <dd className="text-right">{pesos(estimado.subtotal)}</dd>
        <dt>IVA</dt>
        <dd className="text-right">{pesos(estimado.iva)}</dd>
        <dt className="border-t border-gris-claro pt-1 font-bold">
          {institucional ? "Valor comercial de referencia" : "Total estimado"}
        </dt>
        <dd className="border-t border-gris-claro pt-1 text-right text-lg font-bold">{pesos(estimado.total)}</dd>
        {estimado.deposito > 0 && (
          <>
            <dt className="text-gris">Depósito de garantía (va aparte del total)</dt>
            <dd className="text-right text-gris">{pesos(estimado.deposito)}</dd>
          </>
        )}
      </dl>
      {institucional && (
        <p className="max-w-prose text-base text-gris">
          Si se aprueba como uso institucional, el valor a pagar es <strong className="text-texto">$0</strong>. El
          total corresponde al valor comercial de referencia de lo que estás pidiendo.
        </p>
      )}
    </section>
  );
}
