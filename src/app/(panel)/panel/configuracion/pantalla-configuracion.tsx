"use client";

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
import { ErrorApi } from "@/lib/api";
import { fecha } from "@/lib/formato";
import { ETIQUETAS_ROL, type Rol } from "@/lib/tipos-auth";
import { useConsulta } from "@/lib/useConsulta";

const ROLES = Object.keys(ETIQUETAS_ROL) as Rol[];
const POR_PAGINA = 20;

export function PantallaConfiguracion() {
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editando, setEditando] = useState<UsuarioAdmin | null>(null);
  const [desactivando, setDesactivando] = useState<UsuarioAdmin | null>(null);
  const { resultado, recargar } = useConsulta(
    () => listarUsuarios({ busqueda: busqueda || undefined, pagina, porPagina: POR_PAGINA }),
    [busqueda, pagina],
  );

  function buscar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setBusqueda(String(new FormData(evento.currentTarget).get("busqueda") ?? "").trim());
    setPagina(1);
  }

  async function activar(u: UsuarioAdmin) {
    setError(null);
    try {
      await cambiarEstadoUsuario(u.id, true);
      setAviso(`La cuenta de ${u.correo} quedó activa.`);
      recargar();
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : "No pudimos activar la cuenta.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold sm:text-4xl">Configuración</h1>
        <p className="text-gris">Usuarios y roles del sistema.</p>
      </header>

      <form onSubmit={buscar} className="flex flex-wrap items-end gap-3">
        <Campo id="busqueda" etiqueta="Buscar por correo o nombre" defaultValue={busqueda} className="w-72" />
        <Boton type="submit">Buscar</Boton>
      </form>

      {aviso && <Alerta tipo="exito">{aviso}</Alerta>}
      {error && <Alerta tipo="error">{error}</Alerta>}

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
                <li key={u.id} className="flex flex-col gap-2 rounded-lg border border-gris-claro p-4 shadow-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-bold text-azul-oscuro">{u.correo}</p>
                    <p className="rounded border border-gris-claro px-2 text-sm">
                      {u.activo ? "Activa" : "Desactivada"}
                    </p>
                  </div>
                  <p className="text-sm text-gris">
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
              alCambiar={setPagina}
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
          setAviso(`La cuenta de ${desactivando.correo} quedó desactivada y sus sesiones se cerraron.`);
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
            setAviso(`Los roles de ${u.correo} se actualizaron.`);
            recargar();
          }}
        />
      )}
    </div>
  );
}

/** Reemplaza la lista completa de roles. APROBADOR exige dependencia. Se monta solo al editar. */
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
  const [seleccion, setSeleccion] = useState<Record<string, string>>(() =>
    Object.fromEntries(usuario.roles.map((r) => [r.rol, r.dependenciaId ?? ""])),
  );
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const el = dialogo.current;
    if (el && !el.open) el.showModal();
  }, []);

  const listaDependencias =
    dependencias.resultado.estado === "listo" ? dependencias.resultado.datos.datos : [];

  function alternar(rol: Rol, marcado: boolean) {
    setSeleccion((previa) => {
      const nueva = { ...previa };
      if (marcado) nueva[rol] = "";
      else delete nueva[rol];
      return nueva;
    });
  }

  async function guardar(evento: FormEvent) {
    evento.preventDefault();
    setGuardando(true);
    setError(null);
    const roles: RolAsignar[] = Object.entries(seleccion).map(([rol, dep]) => ({
      rol: rol as Rol,
      dependenciaId: dep || undefined,
    }));
    try {
      const actualizado = await reemplazarRoles(usuario.id, roles);
      alGuardar(actualizado);
      alCerrar();
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : "No pudimos guardar los roles.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <dialog
      ref={dialogo}
      onClose={alCerrar}
      aria-label={`Roles de ${usuario.correo}`}
      className="m-auto w-[min(92vw,32rem)] rounded-lg border border-gris-claro p-0 shadow-xl backdrop:bg-texto/50"
    >
      <form onSubmit={guardar} className="flex flex-col gap-4 p-6">
        <h2 className="text-xl font-bold">Roles de {usuario.correo}</h2>
        <fieldset className="flex flex-col gap-3">
          <legend className="sr-only">Roles</legend>
          {ROLES.map((rol) => {
            const marcado = rol in seleccion;
            return (
              <div key={rol} className="flex flex-col gap-1">
                <label className="flex items-center gap-2 font-medium">
                  <input
                    type="checkbox"
                    checked={marcado}
                    onChange={(e) => alternar(rol, e.target.checked)}
                    className="size-5"
                  />
                  {ETIQUETAS_ROL[rol]}
                </label>
                {marcado && (rol === "APROBADOR" || rol === "RESPONSABLE_ESPACIO") && (
                  <select
                    aria-label={`Dependencia del rol ${ETIQUETAS_ROL[rol]}`}
                    value={seleccion[rol] ?? ""}
                    onChange={(e) => setSeleccion((p) => ({ ...p, [rol]: e.target.value }))}
                    className="ml-7 rounded border border-gris bg-fondo px-3 py-2"
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
