import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { BloqueResumen } from "@/lib/tipos";

/** "Aula" -> "aulas", "Sala de juntas" -> "salas de juntas" (solo la primera palabra). */
function plural(nombre: string, total: number): string {
  const texto = nombre.toLowerCase();
  if (total === 1) return texto;
  const [primera, ...resto] = texto.split(" ");
  return [`${primera}s`, ...resto].join(" ");
}

/** Un bloque como fila de lista: la letra, cuántos espacios hay y qué tipos. Toda la fila es el enlace. */
export function FilaBloque({
  bloque,
  sede,
  asistentes,
}: {
  bloque: BloqueResumen;
  sede: string;
  asistentes?: number;
}) {
  const href = `/sedes/${sede}/bloques/${bloque.codigo}${asistentes ? `?asistentes=${asistentes}` : ""}`;
  const tipos = bloque.conteoPorTipo.map((t) => `${t.total} ${plural(t.nombre, t.total)}`).join(", ");

  return (
    <Link
      href={href}
      className="group grid min-h-20 grid-cols-[3.5rem_1fr_auto] items-center gap-4 border-b border-gris-claro/60 py-5 transition-colors duration-200 hover:bg-turquesa-suave/60 motion-reduce:transition-none sm:grid-cols-[5rem_1fr_auto] sm:gap-6"
    >
      <span aria-hidden className="font-titulo text-5xl font-black leading-none text-azul sm:text-6xl">
        {bloque.codigo}
      </span>
      <span className="flex min-w-0 flex-col gap-1">
        <span className="font-titulo text-2xl font-extrabold text-tinta">Bloque {bloque.codigo}</span>
        <span className="text-gris">
          {bloque.totalEspacios} {bloque.totalEspacios === 1 ? "espacio" : "espacios"} · hasta{" "}
          <strong className="font-bold text-texto">{bloque.capacidadMaxima} personas</strong>
        </span>
        {tipos && <span className="text-gris">{tipos}</span>}
      </span>
      <ArrowRight
        aria-hidden
        className="size-6 text-azul-oscuro transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none"
      />
    </Link>
  );
}
