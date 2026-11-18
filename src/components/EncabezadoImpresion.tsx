import { Marca } from "@/components/marca/Logo";

/** Solo se ve al imprimir: la marca y qué documento es, para que la hoja se entienda sola. */
export function EncabezadoImpresion({ documento }: { documento: string }) {
  return (
    <div className="solo-imprimir items-center justify-between gap-4 border-b-2 border-azul pb-3">
      <Marca detalle="SIRA · Reserva de espacios" />
      <div className="text-right">
        <p className="font-titulo text-xl font-extrabold text-tinta">{documento}</p>
        <p className="text-meta text-gris">
          Generado el <time suppressHydrationWarning>{new Date().toLocaleString("es-CO", { dateStyle: "long", timeStyle: "short", timeZone: "America/Bogota" })}</time>
        </p>
      </div>
    </div>
  );
}
