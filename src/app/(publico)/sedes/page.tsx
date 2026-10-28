import Link from "next/link";
import { Suspense } from "react";
import { EstadoError } from "@/components/EstadoError";
import { EstadoVacio } from "@/components/EstadoVacio";
import { listarSedes, listarBloques, resolver } from "@/lib/inventario";
import { FilaBloque } from "@/components/FilaBloque";

export const metadata = { title: "Sedes" };

export default function Sedes() {
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-t1 font-black">Sedes</h1>
      <Suspense fallback={<p role="status">Cargando sedes…</p>}>
        <Contenido />
      </Suspense>
    </section>
  );
}

async function Contenido() {
  const resultado = await resolver(listarSedes());
  if (!resultado.ok) return <EstadoError mensaje={resultado.mensaje} />;
  if (!resultado.datos.length) return <EstadoVacio titulo="Aún no hay sedes" mensaje="Las sedes registradas aparecerán aquí." />;
  return (
    <div className="flex flex-col gap-8">
      {resultado.datos.map((sede) => (
        <section key={sede.codigo} className="flex flex-col gap-3">
          <h2 className="text-t2 font-bold">{sede.nombre}</h2>
          <p className="text-gris">{sede.municipio}{sede.direccion ? ` · ${sede.direccion}` : ""}</p>
          <Link className="font-bold text-azul underline" href={`/espacios?sede=${encodeURIComponent(sede.codigo)}`}>
            Ver los {sede.totalEspacios} espacios
          </Link>
          <Bloques sede={sede.codigo} />
        </section>
      ))}
    </div>
  );
}

async function Bloques({ sede }: { sede: string }) {
  const resultado = await resolver(listarBloques(sede));
  if (!resultado.ok) return <EstadoError mensaje={resultado.mensaje} />;
  return (
    <ul>
      {resultado.datos.map((bloque) => (
        <li key={bloque.codigo}><FilaBloque sede={sede} bloque={bloque} /></li>
      ))}
    </ul>
  );
}
