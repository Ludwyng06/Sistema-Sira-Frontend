import { fecha, pesos } from "@/lib/formato";
import type { CotizacionResumen } from "@/lib/solicitudes";

/** Desglose de la cotización. En exentas muestra "$0 · valor de referencia" y ninguna sección de pago. */
export function ResumenCotizacion({
  cotizacion,
  esExenta,
}: {
  cotizacion: CotizacionResumen;
  esExenta: boolean;
}) {
  return (
    <section aria-labelledby="titulo-cotizacion" className="flex flex-col gap-3">
      <h2 id="titulo-cotizacion" className="text-2xl font-bold">
        Cotización {cotizacion.consecutivo}
      </h2>
      <dl className="grid max-w-md grid-cols-[1fr_auto] gap-x-6 gap-y-1 rounded-campo border border-gris-claro p-4">
        <dt>Subtotal</dt>
        <dd className="text-right">{pesos(cotizacion.subtotal)}</dd>
        <dt>IVA</dt>
        <dd className="text-right">{pesos(cotizacion.iva)}</dd>
        {cotizacion.depositoGarantia > 0 && (
          <>
            <dt>Depósito de garantía</dt>
            <dd className="text-right">{pesos(cotizacion.depositoGarantia)}</dd>
          </>
        )}
        <dt className="border-t border-gris-claro pt-1 font-bold">Total</dt>
        <dd className="border-t border-gris-claro pt-1 text-right text-lg font-bold">
          {esExenta ? "$0" : pesos(cotizacion.total)}
        </dd>
      </dl>
      {esExenta ? (
        <p className="text-gris">
          Uso institucional sin costo · valor de referencia {pesos(cotizacion.valorReferencia)}.
        </p>
      ) : (
        <p className="text-gris">Válida hasta el {fecha(cotizacion.validaHasta)}.</p>
      )}
    </section>
  );
}
