import Link from "next/link";
import { SearchX } from "lucide-react";

export function EstadoVacio({
  titulo,
  mensaje,
  accion,
}: {
  titulo: string;
  mensaje: string;
  accion?: { href: string; texto: string };
}) {
  return (
    <section className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-gris-claro bg-fondo-suave px-6 py-12 text-center">
      <SearchX aria-hidden className="size-10 text-gris" />
      <h2 className="text-xl font-bold">{titulo}</h2>
      <p className="max-w-prose text-gris">{mensaje}</p>
      {accion && (
        <Link
          href={accion.href}
          className="rounded bg-azul px-4 py-2 font-medium text-white hover:bg-azul-oscuro"
        >
          {accion.texto}
        </Link>
      )}
    </section>
  );
}
