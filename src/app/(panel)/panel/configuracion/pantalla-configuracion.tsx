"use client";

import { AnclaResultados } from "@/components/AnclaResultados";
import { useIrAResultados } from "@/lib/useIrAResultados";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { DialogoConfirmacion } from "@/components/DialogoConfirmacion";
import { Esqueleto, RegionCargando } from "@/components/Esqueleto";
import { EstadoError } from "@/components/EstadoError";
import { EstadoVacio } from "@/components/EstadoVacio";
import { Paginador } from "@/components/ListaSolicitudes";
import { Alerta, Boton, Campo } from "@/components/formularios";
import {
  cambiarEstadoUsuario,
  listarDependencias,
  listarUsuarios,
  reemplazarRoles,
  type RolAsignar,
  type UsuarioAdmin,
} from "@/lib/administracion";
import { fecha } from "@/lib/formato";
import { ETIQUETAS_ROL, type Rol } from "@/lib/tipos-auth";
import { useConsulta } from "@/lib/useConsulta";
import { avisar } from "@/lib/avisos";
import { ParametrosSistema } from "./parametros";
import { DependenciasSistema } from "./dependencias";

const ROLES = Object.keys(ETIQUETAS_ROL) as Rol[];
const POR_PAGINA = 20;

export function PantallaConfiguracion() {
  const [pestana, setPestana] = useState(0);
  const pestanas = ["Usuarios y roles", "Parámetros del sistema", "Dependencias"];
  return <div className="flex flex-col gap-6">
    <h1 className="text-t1 font-black">Configuración</h1>
    <div role="tablist" aria-label="Secciones de configuración" className="flex flex-wrap gap-2">
      {pestanas.map((titulo, indice) => <button key={titulo} id={`configuracion-tab-${indice}`} type="button" role="tab"
        aria-selected={pestana === indice} aria-controls={`configuracion-panel-${indice}`} tabIndex={pestana === indice ? 0 : -1}
        className={`min-h-11 rounded-campo border border-gris-claro px-4 font-bold ${pestana === indice ? "bg-azul text-white" : "text-azul-oscuro"}`}
        onClick={() => setPestana(indice)} onKeyDown={(evento) => {
          const siguiente = evento.key === "ArrowRight" ? (indice + 1) % pestanas.length : evento.key === "ArrowLeft" ? (indice + pestanas.length - 1) % pestanas.length : evento.key === "Home" ? 0 : evento.key === "End" ? pestanas.length - 1 : null;
          if (siguiente !== null) { evento.preventDefault(); setPestana(siguiente); document.getElementById(`configuracion-tab-${siguiente}`)?.focus(); }
        }}>{titulo}</button>)}
    </div>
    <div role="tabpanel" id={`configuracion-panel-${pestana}`} aria-labelledby={`configuracion-tab-${pestana}`}>
      {pestana === 0 ? <UsuariosRoles /> : pestana === 1 ? <ParametrosSistema /> : <DependenciasSistema />}
    </div>
  </div>;
}

function UsuariosRoles() {
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [editando, setEditando] = useState<UsuarioAdmin | null>(null);
  const [desactivando, setDesactivando] = useState<UsuarioAdmin | null>(null);
  const { resultado, recargar } = useConsulta(
    () => listarUsuarios({ busqueda: busqueda || undefined, pagina, porPagina: POR_PAGINA }),
    [busqueda, pagina],
  );
  const { destino: anclaResultados, ir: irAResultados, buscando: buscandoResultados } = useIrAResultados(resultado.estado !== "cargando");

  function buscar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setBusqueda(String(new FormData(evento.currentTarget).get("busqueda") ?? "").trim());
    setPagina(1);
    irAResultados();
  }

  async function activar(u: UsuarioAdmin) {
    setError(null);
    try {
      await cambiarEstadoUsuario(u.id, true);
      avisar.exito(`La cuenta de ${u.correo} quedó activa.`);
      recargar();
    } catch (e) {
      avisar.error(e, "No pudimos activar la cuenta.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold">Usuarios y roles</h2>
        <p className="text-gris">Usuarios y roles del sistema.</p>
      </header>

      <form onSubmit={buscar} className="flex flex-wrap items-end gap-3">
        <Campo id="busqueda" etiqueta="Buscar por correo o nombre" defaultValue={busqueda} className="w-72" />
        <Boton type="submit">Buscar</Boton>
      </form>
      {error && <Alerta tipo="error">{error}</Alerta>}

      <AnclaResultados ref={anclaResultados} buscando={buscandoResultados} etiqueta="Resultados de usuarios" />
      {resultado.estado === "cargando" && (
        <RegionCargando etiqueta="Cargando usuarios">
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <Esqueleto key={i} className="h-16 w-full" />
            ))}
          </div>
        </RegionCargando>
      )}
      {resultado.estado === "error" && (
        <EstadoError mensaje={resultado.mensaje} alReintentar={recargar} />
      )}
      {resultado.estado === "listo" &&
        (resultado.datos.total === 0 ? (
          <EstadoVacio titulo="No encontramos usuarios" mensaje="Prueba con otro correo o nombre." />
        ) : (
          <>
            <ul className="flex flex-col gap-3">
              {resultado.datos.datos.map((u) => (
                <li key={u.id} className="flex flex-col gap-2 rounded-campo border border-gris-claro p-4 shadow-tarjeta">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-bold text-azul-oscuro">{u.correo}</p>
                    <p className="rounded-campo border border-gris-claro px-2 text-base">
                      {u.activo ? "Activa" : "Desactivada"}
                    </p>
                  </div>
                  <p className="text-base text-gris">
                    {u.nombre ?? "Sin perfil"} · {u.roles.length === 0 ? "Sin roles" : u.roles.map((r) => ETIQUETAS_ROL[r.rol]).join(", ")}
                    {u.ultimoIngresoEn && <> · último ingreso {fecha(u.ultimoIngresoEn)}</>}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Boton variante="secundario" onClick={() => setEditando(u)}>
                      Cambiar roles
                    </Boton>
                    {u.activo ? (
                      <Boton variante="secundario" onClick={() => setDesactivando(u)}>
                        Desactivar cuenta
                      </Boton>
                    ) : (
                      <Boton variante="secundario" onClick={() => activar(u)}>
                        Activar cuenta
                      </Boton>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <Paginador
              pagina={resultado.datos.pagina}
              total={resultado.datos.total}
              porPagina={resultado.datos.porPagina}
              alCambiar={(p) => {
                irAResultados();
                setPagina(p);
              }}
            />
          </>
        ))}

      <DialogoConfirmacion
        abierto={desactivando !== null}
        titulo="¿Desactivar esta cuenta?"
        textoConfirmar="Desactivar cuenta"
        variante="peligro"
        alConfirmar={async () => {
          if (!desactivando) return;
          await cambiarEstadoUsuario(desactivando.id, false);
          avisar.exito(`La cuenta de ${desactivando.correo} quedó desactivada y sus sesiones se cerraron.`);
          recargar();
        }}
        alCerrar={() => setDesactivando(null)}
      >
        <p className="text-gris">
          {desactivando?.correo} no podrá ingresar y se cierran sus sesiones abiertas. Sus datos se conservan.
        </p>
      </DialogoConfirmacion>

      {editando && (
        <EditorRoles
          key={editando.id}
          usuario={editando}
          alCerrar={() => setEditando(null)}
          alGuardar={(u) => {
            avisar.exito(`Los roles de ${u.correo} se actualizaron.`);
            recargar();
          }}
        />
      )}
    </div>
  );
}

/** Roles que se asignan por dependencia: una persona puede tenerlos en varias dependencias. */
const ROLES_CON_DEPENDENCIA: Rol[] = ["APROBADOR", "RESPONSABLE_ESPACIO"];

interface Asignacion {
  /** Clave local para React; no viaja a la API. */
  clave: number;
  rol: Rol;
  dependenciaId: string;
}

/**
 * Reemplaza la lista completa de roles. APROBADOR exige dependencia; APROBADOR y RESPONSABLE_ESPACIO pueden
 * repetirse con dependencias distintas (el backend rechaza la misma pareja dos veces). Se monta solo al editar.
 */
function EditorRoles({
  usuario,
  alCerrar,
  alGuardar,
}: {
  usuario: UsuarioAdmin;
  alCerrar: () => void;
  alGuardar: (u: UsuarioAdmin) => void;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const dependencias = useConsulta(() => listarDependencias(), []);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>(() =>
    usuario.roles.map((r, i) => ({ clave: i, rol: r.rol as Rol, dependenciaId: r.dependenciaId ?? "" })),
  );
  const [siguienteClave, setSiguienteClave] = useState(usuario.roles.length);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const el = dialogo.current;
    if (el && !el.open) el.showModal();
  }, []);

  const listaDependencias =
    dependencias.resultado.estado === "listo" ? dependencias.resultado.datos.datos : [];

  function agregar(rol: Rol) {
    setAsignaciones((previas) => [...previas, { clave: siguienteClave, rol, dependenciaId: "" }]);
    setSiguienteClave((c) => c + 1);
  }

  function alternar(rol: Rol, marcado: boolean) {
    if (marcado) agregar(rol);
    else setAsignaciones((previas) => previas.filter((a) => a.rol !== rol));
  }

  const cambiarDependencia = (clave: number, dependenciaId: string) =>
    setAsignaciones((previas) => previas.map((a) => (a.clave === clave ? { ...a, dependenciaId } : a)));
  const quitar = (clave: number) => setAsignaciones((previas) => previas.filter((a) => a.clave !== clave));

  async function guardar(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    const vistas = new Set<string>();
    for (const a of asignaciones) {
      const pareja = `${a.rol}:${a.dependenciaId}`;
      if (vistas.has(pareja)) {
        setError(`${ETIQUETAS_ROL[a.rol]} está repetido con la misma dependencia. Quita una de las filas.`);
        return;
      }
      vistas.add(pareja);
    }
    setGuardando(true);
    const roles: RolAsignar[] = asignaciones.map((a) => ({
      rol: a.rol,
      dependenciaId: a.dependenciaId || undefined,
    }));
    try {
      const actualizado = await reemplazarRoles(usuario.id, roles);
      alGuardar(actualizado);
      alCerrar();
    } catch (e) {
      avisar.error(e, "No pudimos guardar los roles.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <dialog
      ref={dialogo}
      onClose={alCerrar}
      aria-label={`Roles de ${usuario.correo}`}
      className="m-auto w-[min(92vw,32rem)] rounded-campo border border-gris-claro p-0 shadow-elevada backdrop:bg-texto/50"
    >
      <form onSubmit={guardar} className="flex flex-col gap-4 p-6">
        <h2 className="text-xl font-bold">Roles de {usuario.correo}</h2>
        <fieldset className="flex flex-col gap-3">
          <legend className="sr-only">Roles</legend>
          {ROLES.map((rol) => {
            const filas = asignaciones.filter((a) => a.rol === rol);
            const marcado = filas.length > 0;
            const conDependencia = ROLES_CON_DEPENDENCIA.includes(rol);
            return (
              <div key={rol} className="flex flex-col gap-2">
                <label className="flex items-center gap-2 font-medium">
                  <input
                    type="checkbox"
                    checked={marcado}
                    onChange={(e) => alternar(rol, e.target.checked)}
                    className="size-6"
                  />
                  {ETIQUETAS_ROL[rol]}
                </label>
                {marcado && conDependencia && (
                  <div className="ml-7 flex flex-col gap-2">
                    {filas.map((fila, i) => (
                      <div key={fila.clave} className="flex flex-wrap items-center gap-2">
                        <select
                          aria-label={`Dependencia ${i + 1} del rol ${ETIQUETAS_ROL[rol]}`}
                          value={fila.dependenciaId}
                          onChange={(e) => cambiarDependencia(fila.clave, e.target.value)}
                          className="min-w-0 flex-1 rounded-campo border border-gris/70 bg-fondo px-3.5 py-2.5 transition-colors hover:border-azul focus:border-azul"
                          required={rol === "APROBADOR"}
                        >
                          <option value="">
                            {rol === "APROBADOR" ? "Elige la dependencia" : "Sin dependencia"}
                          </option>
                          {listaDependencias.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.nombre}
                            </option>
                          ))}
                        </select>
                        {filas.length > 1 && (
                          <Boton variante="secundario" className="min-h-11 px-3 py-1" onClick={() => quitar(fila.clave)}>
                            Quitar
                          </Boton>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => agregar(rol)}
                      className="min-h-11 w-fit font-bold text-azul-oscuro underline underline-offset-4"
                    >
                      Agregar otra dependencia
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </fieldset>
        {error && <Alerta tipo="error">{error}</Alerta>}
        <div className="flex flex-wrap justify-end gap-3">
          <Boton variante="secundario" onClick={() => dialogo.current?.close()} disabled={guardando}>
            Volver
          </Boton>
          <Boton type="submit" cargando={guardando}>
            Guardar roles
          </Boton>
        </div>
      </form>
    </dialog>
  );
}
