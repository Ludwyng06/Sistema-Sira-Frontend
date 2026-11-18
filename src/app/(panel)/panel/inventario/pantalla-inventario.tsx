"use client";

import { useState } from "react";
import clsx from "clsx";
import { ChevronDown, ChevronRight, Pencil, Plus } from "lucide-react";
import { Esqueleto, RegionCargando } from "@/components/Esqueleto";
import { EstadoError } from "@/components/EstadoError";
import { Boton } from "@/components/formularios";
import { useSesion } from "@/components/SesionProvider";
import {
  archivarBloque,
  archivarSede,
  listarBloquesAdmin,
  listarEspaciosAdmin,
  listarSedesAdmin,
  restaurarBloque,
  restaurarSede,
  type BloqueAdmin,
  type SedeAdmin,
} from "@/lib/inventario-admin";
import { useConsulta } from "@/lib/useConsulta";
import { FormularioEspacio } from "./formulario-espacio";
import { BotonArchivo, FormularioBloque, FormularioSede, GestionTiposEspacio } from "./gestiones-catalogo";

export type Seleccion =
  | { tipo: "espacio"; codigo: string; sede: string; bloque: string }
  | { tipo: "nuevo"; sede: string; bloque: string }
  | null;

/** Lo que muestra el panel derecho cuando no es un espacio: catálogo de sedes, bloques y tipos. */
type Catalogo =
  | { tipo: "sede"; sede?: SedeAdmin }
  | { tipo: "bloque"; sede: SedeAdmin; bloque?: BloqueAdmin }
  | { tipo: "tipos" }
  | null;

const insignia = (activo: boolean) =>
  clsx("rounded px-1.5 py-0.5 text-xs font-semibold", activo ? "bg-white/20 text-white" : "bg-gris-claro text-gris-oscuro");

/** Árbol sede → bloque → espacio a la izquierda y formulario a la derecha. */
export function PantallaInventario() {
  const { tieneRol } = useSesion();
  const puedeEditar = tieneRol("ADMINISTRADOR");
  const [seleccion, setSeleccionEspacio] = useState<Seleccion>(null);
  const [catalogo, setCatalogoActual] = useState<Catalogo>(null);
  const [version, setVersion] = useState(0);
  const [verArchivados, setVerArchivados] = useState(false);
  // Con "Ver archivados" se listan activos y archivados juntos (sin filtro); si no, solo activos.
  const filtroActivo = verArchivados ? undefined : true;
  const sedes = useConsulta(() => listarSedesAdmin(filtroActivo), [filtroActivo ?? "todos", version]);
  const cambiar = () => setVersion((v) => v + 1);
  const setSeleccion = (s: Seleccion) => {
    setCatalogoActual(null);
    setSeleccionEspacio(s);
  };
  // Cerrar el panel del catálogo (null) también refresca el árbol: así se ve lo que se archivó o restauró.
  const setCatalogo = (c: Catalogo) => {
    setSeleccionEspacio(null);
    setCatalogoActual(c);
    if (c === null) cambiar();
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-t1 font-black">Inventario</h1>
          <p className="text-gris">
            Sedes, bloques y espacios.{" "}
            {!puedeEditar && "Tu rol solo permite consultar."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex min-h-11 items-center gap-2">
            <input
              type="checkbox"
              checked={verArchivados}
              onChange={(e) => setVerArchivados(e.target.checked)}
              className="size-5"
            />
            Ver archivados
          </label>
          {puedeEditar && (
            <>
              <Boton variante="secundario" onClick={() => setCatalogo({ tipo: "sede" })}>
                <Plus aria-hidden className="size-4" />
                Nueva sede
              </Boton>
              <Boton variante="secundario" onClick={() => setCatalogo({ tipo: "tipos" })}>
                Tipos de espacio
              </Boton>
            </>
          )}
        </div>
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
                  verArchivados={verArchivados}
                  puedeEditar={puedeEditar}
                  alElegir={setSeleccion}
                  alCatalogo={setCatalogo}
                />
              ))}
            </ul>
          )}
        </nav>

        <section aria-live="polite" className="min-w-0">
          {catalogo?.tipo === "sede" ? (
            <FormularioSede
              key={catalogo.sede?.id ?? "nueva"}
              sede={catalogo.sede}
              alGuardar={cambiar}
              alCerrar={() => setCatalogo(null)}
            />
          ) : catalogo?.tipo === "bloque" ? (
            <FormularioBloque
              key={catalogo.bloque?.id ?? `nuevo-${catalogo.sede.id}`}
              sede={catalogo.sede}
              bloque={catalogo.bloque}
              alGuardar={cambiar}
              alCerrar={() => setCatalogo(null)}
            />
          ) : catalogo?.tipo === "tipos" ? (
            <GestionTiposEspacio alCambiar={cambiar} alCerrar={() => setCatalogo(null)} />
          ) : seleccion ? (
            <FormularioEspacio
              key={seleccion.tipo === "espacio" ? seleccion.codigo : `nuevo-${seleccion.bloque}`}
              seleccion={seleccion}
              puedeEditar={puedeEditar}
              alCambiar={cambiar}
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
  verArchivados,
  puedeEditar,
  alElegir,
  alCatalogo,
}: {
  sede: SedeAdmin;
  seleccion: Seleccion;
  version: number;
  verArchivados: boolean;
  puedeEditar: boolean;
  alElegir: (s: Seleccion) => void;
  alCatalogo: (c: Catalogo) => void;
}) {
  const [abierta, setAbierta] = useState(true);
  const filtroActivo = verArchivados ? undefined : true;
  const bloques = useConsulta(
    () => listarBloquesAdmin(sede.id, filtroActivo),
    [sede.id, filtroActivo ?? "todos", version],
  );
  const Icono = abierta ? ChevronDown : ChevronRight;
  const cambiar = () => alCatalogo(null);
  return (
    <li className="rounded-campo border border-gris-claro">
      <button
        type="button"
        aria-expanded={abierta}
        onClick={() => setAbierta(!abierta)}
        className="flex w-full flex-wrap items-center gap-2 min-h-11 px-3 py-2 text-left font-bold text-azul-oscuro"
      >
        <Icono aria-hidden className="size-4" />
        Sede {sede.nombre}
        {!sede.activa && <span className={insignia(false)}>Archivada</span>}
      </button>
      {puedeEditar && (
        <div className="flex flex-wrap gap-2 px-3 pb-2">
          {sede.activa && (
            <Boton variante="secundario" className="min-h-11 px-3 py-1" onClick={() => alCatalogo({ tipo: "sede", sede })}>
              <Pencil aria-hidden className="size-4" />
              Editar sede
            </Boton>
          )}
          <BotonArchivo
            activo={sede.activa}
            nombre={`la sede ${sede.nombre}`}
            consecuencia="Sus bloques y espacios dejarán de mostrarse en el portal."
            archivar={() => archivarSede(sede.id)}
            restaurar={() => restaurarSede(sede.id)}
            alCambiar={cambiar}
          />
        </div>
      )}
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
                  sede={sede}
                  bloque={b}
                  seleccion={seleccion}
                  version={version}
                  verArchivados={verArchivados}
                  puedeEditar={puedeEditar}
                  alElegir={alElegir}
                  alCatalogo={alCatalogo}
                />
              ))}
              {puedeEditar && sede.activa && (
                <li>
                  <button
                    type="button"
                    onClick={() => alCatalogo({ tipo: "bloque", sede })}
                    className="flex items-center gap-1 rounded-campo min-h-11 px-2 py-1.5 text-azul-oscuro underline underline-offset-4"
                  >
                    <Plus aria-hidden className="size-4" />
                    Nuevo bloque
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}

function NodoBloque({
  sede,
  bloque,
  seleccion,
  version,
  verArchivados,
  puedeEditar,
  alElegir,
  alCatalogo,
}: {
  sede: SedeAdmin;
  bloque: BloqueAdmin;
  seleccion: Seleccion;
  version: number;
  verArchivados: boolean;
  puedeEditar: boolean;
  alElegir: (s: Seleccion) => void;
  alCatalogo: (c: Catalogo) => void;
}) {
  const sedeCodigo = sede.codigo;
  const [abierto, setAbierto] = useState(false);
  const espacios = useConsulta(
    () =>
      abierto
        ? listarEspaciosAdmin({
            sede: sedeCodigo,
            bloque: bloque.codigo,
            activo: verArchivados ? undefined : true,
            porPagina: 100,
          })
        : Promise.resolve(null),
    [abierto, sedeCodigo, bloque.codigo, version, verArchivados],
  );
  const Icono = abierto ? ChevronDown : ChevronRight;

  return (
    <li>
      <button
        type="button"
        aria-expanded={abierto}
        onClick={() => setAbierto(!abierto)}
        className="flex w-full flex-wrap items-center gap-2 rounded-campo min-h-11 px-2 py-1.5 text-left font-medium hover:bg-fondo-suave"
      >
        <Icono aria-hidden className="size-4" />
        {bloque.nombre}
        {!bloque.activo && <span className={insignia(false)}>Archivado</span>}
      </button>
      {puedeEditar && abierto && (
        <div className="ml-6 flex flex-wrap gap-2 py-1">
          {bloque.activo && (
            <Boton
              variante="secundario"
              className="min-h-11 px-3 py-1"
              onClick={() => alCatalogo({ tipo: "bloque", sede, bloque })}
            >
              <Pencil aria-hidden className="size-4" />
              Editar bloque
            </Boton>
          )}
          <BotonArchivo
            activo={bloque.activo}
            nombre={bloque.nombre}
            consecuencia="Sus espacios dejarán de mostrarse en el portal."
            archivar={() => archivarBloque(bloque.id)}
            restaurar={() => restaurarBloque(bloque.id)}
            alCambiar={() => alCatalogo(null)}
          />
        </div>
      )}
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
                      "flex w-full flex-wrap items-center justify-between gap-1 rounded-campo px-2 py-1.5 text-left",
                      activo ? "bg-azul text-white" : "hover:bg-fondo-suave",
                    )}
                  >
                    <span>
                      {e.codigo} · {e.nombre}
                    </span>
                    <span className="flex flex-wrap items-center gap-1 text-xs">
                      {e.estado === "EN_MANTENIMIENTO" && (
                        <span
                          className={clsx(
                            "rounded px-1.5 py-0.5 font-semibold",
                            activo ? "bg-white/20 text-white" : "bg-amarillo-alerta/20 text-amarillo-texto",
                          )}
                        >
                          Mantenimiento
                        </span>
                      )}
                      {e.estado === "FUERA_DE_SERVICIO" && (
                        <span
                          className={clsx(
                            "rounded px-1.5 py-0.5 font-semibold",
                            activo ? "bg-white/20 text-white" : "bg-error-suave text-error",
                          )}
                        >
                          Fuera de servicio
                        </span>
                      )}
                      {!e.activo && <span className={insignia(activo)}>Archivado</span>}
                      {!e.esReservable && (
                        <span
                          className={clsx(
                            "rounded px-1.5 py-0.5 font-semibold",
                            activo ? "bg-white/20 text-white" : "bg-gris-claro text-gris-oscuro",
                          )}
                        >
                          No reservable
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          {puedeEditar && bloque.activo && (
            <li>
              <button
                type="button"
                onClick={() => alElegir({ tipo: "nuevo", sede: sedeCodigo, bloque: bloque.codigo })}
                className="flex items-center gap-1 rounded-campo min-h-11 px-2 py-1.5 text-azul-oscuro underline underline-offset-4"
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
