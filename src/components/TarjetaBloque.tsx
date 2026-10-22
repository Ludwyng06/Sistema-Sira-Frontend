import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { BloqueResumen } from "@/lib/tipos";
import { BordeRasgado } from "./marca/BordeRasgado";
import { IlustracionBloque } from "./marca/IlustracionBloque";
import { SolRadial } from "./marca/SolRadial";
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
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gris-claro/60 bg-fondo shadow-tarjeta transition duration-300 hover:-translate-y-1 hover:shadow-elevada motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <div className="sobre-azul relative h-44 overflow-hidden bg-gradient-to-br from-turquesa via-azul to-azul-oscuro text-white">
        {bloque.foto ? (
          <Foto foto={bloque.foto} className="absolute inset-0 h-full w-full" />
        ) : (
          <>
            <SolRadial className="absolute -right-12 -top-14 size-52 opacity-20" />
            <IlustracionBloque codigo={bloque.codigo} className="absolute inset-0" />
          </>
        )}
        <span
          aria-hidden
          className="absolute left-4 top-1 select-none font-titulo text-8xl font-black leading-none text-white/30"
        >
          {bloque.codigo}
        </span>
        <BordeRasgado ocupa="abajo" tamano="fino" semilla={bloque.codigo.charCodeAt(0)} className="absolute inset-x-0 bottom-0 text-fondo" />
      </div>

      <div className="flex flex-1 flex-col gap-3 px-5 pb-5 pt-2">
        <h3 className="text-2xl font-extrabold text-tinta">Bloque {bloque.codigo}</h3>
        <p className="text-gris">
          {bloque.totalEspacios} {bloque.totalEspacios === 1 ? "espacio" : "espacios"} · hasta{" "}
          <strong className="font-bold text-texto">{bloque.capacidadMaxima} personas</strong>
        </p>
        {tipos.length > 0 && (
          <ul className="flex flex-wrap gap-2 text-sm">
            {tipos.map((t) => (
              <li key={t.tipo} className="rounded-full bg-turquesa-suave px-3 py-1 text-tinta">
                {t.total} {plural(t.nombre, t.total)}
              </li>
            ))}
          </ul>
        )}
        <Link
          href={href}
          className="mt-auto inline-flex w-fit items-center gap-2 pt-2 font-bold text-azul-oscuro after:absolute after:inset-0 after:content-['']"
        >
          Ver el bloque {bloque.codigo}
          <ArrowRight
            aria-hidden
            className="size-5 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none"
          />
        </Link>
      </div>
    </article>
  );
}
