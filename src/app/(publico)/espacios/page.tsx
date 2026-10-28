import Link from "next/link";
import { Suspense } from "react";
import { EstadoError } from "@/components/EstadoError";
import { EstadoVacio } from "@/components/EstadoVacio";
import { TarjetaEspacio } from "@/components/TarjetaEspacio";
import { enteroPositivo, listarEspacios, resolver } from "@/lib/inventario";

export const metadata = { title: "Espacios" };

export default function Espacios(props: PageProps<"/espacios">) {
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-t1 font-black">Espacios</h1>
      <Link href="/sedes" className="font-bold text-azul underline">Explorar por sede y bloque</Link>
      <Suspense fallback={<p role="status">Cargando espacios…</p>}>
        <Contenido searchParams={props.searchParams} />
      </Suspense>
    </section>
  );
}

async function Contenido({ searchParams }: { searchParams: PageProps<"/espacios">["searchParams"] }) {
  const consulta = await searchParams;
  const sede = typeof consulta.sede === "string" ? consulta.sede : undefined;
  const pagina = enteroPositivo(consulta.pagina) ?? 1;
  const asistentes = enteroPositivo(consulta.asistentes);
  const resultado = await resolver(listarEspacios({ sede, pagina, asistentes, porPagina: 24 }));
  if (!resultado.ok) return <EstadoError mensaje={resultado.mensaje} />;
  if (!resultado.datos.total) return <EstadoVacio titulo="No hay espacios" mensaje="Prueba otra sede o cantidad de personas." />;
  const datos = resultado.datos;
  const enlace = (numero: number) => {
    const parametros = new URLSearchParams({ pagina: String(numero) });
    if (sede) parametros.set("sede", sede);
    if (asistentes) parametros.set("asistentes", String(asistentes));
    return `/espacios?${parametros}`;
  };
  return (
    <>
      <p className="text-gris">{datos.total} espacios</p>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {datos.datos.map((espacio) => (
          <li key={espacio.codigo} className="flex flex-col"><TarjetaEspacio espacio={espacio} /></li>
        ))}
      </ul>
      <nav aria-label="Paginación de espacios" className="flex gap-6">
        {pagina > 1 && <Link href={enlace(pagina - 1)} className="font-bold text-azul underline">Anterior</Link>}
        <span>Página {datos.pagina}</span>
        {datos.pagina * datos.porPagina < datos.total && (
          <Link href={enlace(pagina + 1)} className="font-bold text-azul underline">Siguiente</Link>
        )}
      </nav>
    </>
  );
}
