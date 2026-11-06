import Link from "next/link";
import { Suspense } from "react";
import { EstadoError } from "@/components/EstadoError";
import { EstadoVacio } from "@/components/EstadoVacio";
import { listarSedes, listarBloques, resolver } from "@/lib/inventario";
import { FilaBloque } from "@/components/FilaBloque";
import { PlanoCampus } from "@/components/marca/PlanoCampus";

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
        <section key={sede.codigo} className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <h2 className="text-t2 font-bold">Sede {sede.nombre}</h2>
              <p className="text-gris">{sede.municipio}{sede.direccion ? ` · ${sede.direccion}` : ""}</p>
            </div>
            <Link className="font-bold text-azul underline" href={`/espacios?sede=${encodeURIComponent(sede.codigo)}`}>
              Ver los {sede.totalEspacios} espacios
            </Link>
          </div>
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
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-start">
      <div className="sobre-azul rounded-panel bg-gradient-to-br from-azul to-azul-oscuro p-6 text-white">
        <PlanoCampus sede={sede} bloques={resultado.datos} />
      </div>
      <ul className="border-t border-gris-claro/60">
        {resultado.datos.map((bloque) => (
          <li key={bloque.codigo}><FilaBloque sede={sede} bloque={bloque} /></li>
        ))}
      </ul>
    </div>
  );
}
