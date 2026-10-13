import Link from "next/link";
import { Building2 } from "lucide-react";
import type { BloqueResumen } from "@/lib/tipos";
import { Foto } from "./Foto";

/** "Aula" -> "aulas", "Sala de juntas" -> "salas de juntas" (solo la primera palabra). */
function plural(nombre: string, total: number): string {
  const texto = nombre.toLowerCase();
  if (total === 1) return texto;
  const [primera, ...resto] = texto.split(" ");
  return [`${primera}s`, ...resto].join(" ");
}

export function TarjetaBloque({
  bloque,
  sede,
  asistentes,
}: {
  bloque: BloqueResumen;
  sede: string;
  asistentes?: number;
}) {
  const href = `/sedes/${sede}/bloques/${bloque.codigo}${
    asistentes ? `?asistentes=${asistentes}` : ""
  }`;
  const tipos = bloque.conteoPorTipo;

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-gris-claro bg-fondo shadow-sm">
      <Foto
        foto={bloque.foto}
        className="h-40 w-full"
        marcador="Foto del bloque pendiente"
      />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="flex items-center gap-2 text-2xl font-extrabold">
          <Building2 aria-hidden className="size-6" />
          Bloque {bloque.codigo}
        </h3>
        <p className="text-gris">
          {bloque.totalEspacios}{" "}
          {bloque.totalEspacios === 1 ? "espacio" : "espacios"} · hasta{" "}
          {bloque.capacidadMaxima} personas
        </p>
        {tipos.length > 0 && (
          <ul className="flex flex-wrap gap-2 text-sm">
            {tipos.map((t) => (
              <li
                key={t.tipo}
                className="rounded-full border border-gris-claro bg-fondo-suave px-2 py-0.5"
              >
                {t.total} {plural(t.nombre, t.total)}
              </li>
            ))}
          </ul>
        )}
        <Link
          href={href}
          className="mt-auto inline-block w-fit rounded bg-azul px-4 py-2 font-medium text-white hover:bg-azul-oscuro"
        >
          Ver el bloque {bloque.codigo}
        </Link>
      </div>
    </article>
  );
}
