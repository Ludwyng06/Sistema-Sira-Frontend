"use client";

import { useState } from "react";
import clsx from "clsx";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { Esqueleto, RegionCargando } from "@/components/Esqueleto";
import { EstadoError } from "@/components/EstadoError";
import { useSesion } from "@/components/SesionProvider";
import { listarBloquesAdmin, listarSedesAdmin } from "@/lib/inventario-admin";
import { listarEspacios } from "@/lib/inventario";
import { useConsulta } from "@/lib/useConsulta";
import { FormularioEspacio } from "./formulario-espacio";

export type Seleccion =
  | { tipo: "espacio"; codigo: string; sede: string; bloque: string }
  | { tipo: "nuevo"; sede: string; bloque: string }
  | null;

/** Árbol sede → bloque → espacio a la izquierda y formulario a la derecha. */
export function PantallaInventario() {
  const { tieneRol } = useSesion();
  const puedeEditar = tieneRol("ADMINISTRADOR");
  const [seleccion, setSeleccion] = useState<Seleccion>(null);
  const [version, setVersion] = useState(0);
  const sedes = useConsulta(() => listarSedesAdmin(), []);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-4xl font-black sm:text-5xl">Inventario</h1>
        <p className="text-gris">
          Sedes, bloques y espacios.{" "}
          {!puedeEditar && "Tu rol solo permite consultar."}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(16rem,22rem)_1fr]">
        <nav aria-label="Árbol del inventario" className="flex flex-col gap-2">
          {sedes.resultado.estado === "cargando" && (
            <RegionCargando etiqueta="Cargando sedes">
              <Esqueleto className="h-24 w-full" />
            </RegionCargando>
          )}
          {sedes.resultado.estado === "error" && (
            <EstadoError mensaje={sedes.resultado.mensaje} alReintentar={sedes.recargar} />
          )}
          {sedes.resultado.estado === "listo" && (
            <ul className="flex flex-col gap-2">
              {sedes.resultado.datos.datos.map((s) => (
                <NodoSede
                  key={s.id}
                  sede={s}
                  seleccion={seleccion}
                  version={version}
                  puedeEditar={puedeEditar}
                  alElegir={setSeleccion}
                />
              ))}
            </ul>
          )}
        </nav>

        <section aria-live="polite" className="min-w-0">
          {seleccion ? (
            <FormularioEspacio
              key={seleccion.tipo === "espacio" ? seleccion.codigo : `nuevo-${seleccion.bloque}`}
              seleccion={seleccion}
              puedeEditar={puedeEditar}
              alCambiar={() => setVersion((v) => v + 1)}
              alCerrar={() => setSeleccion(null)}
            />
          ) : (
            <p className="rounded-campo border border-dashed border-gris-claro bg-fondo-suave p-8 text-center text-gris">
              Elige un espacio del árbol para ver o editar sus datos.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function NodoSede({
  sede,
  seleccion,
  version,
  puedeEditar,
  alElegir,
}: {
  sede: { id: string; codigo: string; nombre: string };
  seleccion: Seleccion;
  version: number;
  puedeEditar: boolean;
  alElegir: (s: Seleccion) => void;
}) {
  const [abierta, setAbierta] = useState(true);
  const bloques = useConsulta(() => listarBloquesAdmin(sede.id), [sede.id]);
  const Icono = abierta ? ChevronDown : ChevronRight;
  return (
    <li className="rounded-campo border border-gris-claro">
      <button
        type="button"
        aria-expanded={abierta}
        onClick={() => setAbierta(!abierta)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left font-bold text-azul-oscuro"
      >
        <Icono aria-hidden className="size-4" />
        Sede {sede.nombre}
      </button>
      {abierta && (
        <div className="border-t border-gris-claro px-2 py-2">
          {bloques.resultado.estado === "cargando" && <Esqueleto className="h-10 w-full" />}
          {bloques.resultado.estado === "error" && (
            <p className="px-2 text-base text-gris">{bloques.resultado.mensaje}</p>
          )}
          {bloques.resultado.estado === "listo" && (
            <ul className="flex flex-col gap-1">
              {bloques.resultado.datos.datos.map((b) => (
                <NodoBloque
                  key={b.id}
                  sedeCodigo={sede.codigo}
                  bloque={b}
                  seleccion={seleccion}
                  version={version}
                  puedeEditar={puedeEditar}
                  alElegir={alElegir}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}

function NodoBloque({
  sedeCodigo,
  bloque,
  seleccion,
  version,
  puedeEditar,
  alElegir,
}: {
  sedeCodigo: string;
  bloque: { id: string; codigo: string; nombre: string };
  seleccion: Seleccion;
  version: number;
  puedeEditar: boolean;
  alElegir: (s: Seleccion) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const espacios = useConsulta(
    () => (abierto ? listarEspacios({ sede: sedeCodigo, bloque: bloque.codigo, porPagina: 100 }) : Promise.resolve(null)),
    [abierto, sedeCodigo, bloque.codigo, version],
  );
  const Icono = abierto ? ChevronDown : ChevronRight;

  return (
    <li>
      <button
        type="button"
        aria-expanded={abierto}
        onClick={() => setAbierto(!abierto)}
        className="flex w-full items-center gap-2 rounded-campo px-2 py-1.5 text-left font-medium hover:bg-fondo-suave"
      >
        <Icono aria-hidden className="size-4" />
        {bloque.nombre}
      </button>
      {abierto && (
        <ul className="ml-4 flex flex-col gap-1 border-l border-gris-claro pl-2">
          {espacios.resultado.estado === "cargando" && <Esqueleto className="h-8 w-full" />}
          {espacios.resultado.estado === "error" && (
            <li className="text-base text-gris">{espacios.resultado.mensaje}</li>
          )}
          {espacios.resultado.estado === "listo" &&
            espacios.resultado.datos?.datos.map((e) => {
              const activo = seleccion?.tipo === "espacio" && seleccion.codigo === e.codigo;
              return (
                <li key={e.codigo}>
                  <button
                    type="button"
                    aria-current={activo ? "true" : undefined}
                    onClick={() =>
                      alElegir({ tipo: "espacio", codigo: e.codigo, sede: sedeCodigo, bloque: bloque.codigo })
                    }
                    className={clsx(
                      "w-full rounded-campo px-2 py-1.5 text-left",
                      activo ? "bg-azul text-white" : "hover:bg-fondo-suave",
                    )}
                  >
                    {e.codigo} · {e.nombre}
                  </button>
                </li>
              );
            })}
          {puedeEditar && (
            <li>
              <button
                type="button"
                onClick={() => alElegir({ tipo: "nuevo", sede: sedeCodigo, bloque: bloque.codigo })}
                className="flex items-center gap-1 rounded-campo px-2 py-1.5 text-azul-oscuro underline underline-offset-4"
              >
                <Plus aria-hidden className="size-4" />
                Nuevo espacio
              </button>
            </li>
          )}
        </ul>
      )}
    </li>
  );
}
