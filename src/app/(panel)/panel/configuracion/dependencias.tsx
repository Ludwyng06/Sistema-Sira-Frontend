"use client";

import { useState, type FormEvent } from "react";
import { Boton, Campo, Alerta, Selector } from "@/components/formularios";
import { DialogoConfirmacion } from "@/components/DialogoConfirmacion";
import { AnclaResultados } from "@/components/AnclaResultados";
import { EstadoError } from "@/components/EstadoError";
import { Paginador } from "@/components/ListaSolicitudes";
import { actualizarDependencia, archivarDependencia, crearDependencia, listarDependenciasAdmin, listarUsuarios, restaurarDependencia, type Dependencia, type UsuarioAdmin } from "@/lib/administracion";
import { useConsulta } from "@/lib/useConsulta";
import { useIrAResultados } from "@/lib/useIrAResultados";
import { avisar } from "@/lib/avisos";

type FiltroDependencias = "activas" | "archivadas" | "todas";

/** El jefe es quien aprueba las solicitudes institucionales de la dependencia (RN-07d). */
function FormularioDependencia({ dependencia, usuarios, alGuardar, alCerrar }: { dependencia?: Dependencia; usuarios: UsuarioAdmin[]; alGuardar: () => void; alCerrar?: () => void }) {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const datos = new FormData(formulario);
    const nombre = String(datos.get("nombreDependencia") ?? "").trim();
    const centroCosto = String(datos.get("centroCosto") ?? "").trim();
    const jefeId = String(datos.get("jefeId") ?? "");
    setGuardando(true);
    setError(null);
    try {
      if (dependencia) await actualizarDependencia(dependencia.id, { nombre, centroCosto: centroCosto || null, jefeId: jefeId || null });
      else await crearDependencia({ codigo: String(datos.get("codigoDependencia") ?? "").trim().toUpperCase(), nombre, centroCosto: centroCosto || undefined, jefeId: jefeId || undefined });
      avisar.exito(dependencia ? "La dependencia quedó actualizada." : "La dependencia quedó creada.");
      if (!dependencia) formulario.reset();
      alGuardar();
      alCerrar?.();
    } catch (error) { setError(error instanceof Error ? error.message : "No pudimos guardar la dependencia."); }
    finally { setGuardando(false); }
  }
  // El jefe actual puede no estar en la primera página de usuarios: se agrega a las opciones para no perderlo.
  const opciones = dependencia?.jefe && !usuarios.some((u) => u.id === dependencia.jefe?.id) ? [{ id: dependencia.jefe.id, correo: dependencia.jefe.correo, nombre: null }, ...usuarios] : usuarios;
  return <form onSubmit={guardar} className="flex flex-col gap-3 rounded-campo border border-gris-claro p-4">
    <h3 className="text-xl font-bold">{dependencia ? `Editar ${dependencia.codigo}` : "Nueva dependencia"}</h3>
    {!dependencia && <Campo id="codigoDependencia" etiqueta="Código" required pattern="[A-Za-z0-9_-]+" />}
    <Campo id="nombreDependencia" etiqueta="Nombre" required maxLength={120} defaultValue={dependencia?.nombre} />
    <Campo id="centroCosto" etiqueta="Centro de costo (opcional)" maxLength={40} defaultValue={dependencia?.centroCosto ?? ""} />
    <Selector id="jefeId" etiqueta="Jefe de la dependencia" defaultValue={dependencia?.jefe?.id ?? ""} ayuda="Aprueba las solicitudes de uso institucional de esta dependencia. Sin jefe, esas solicitudes no se pueden aprobar.">
      <option value="">Sin jefe asignado</option>
      {opciones.map((u) => <option key={u.id} value={u.id}>{u.nombre ? `${u.nombre} · ${u.correo}` : u.correo}</option>)}
    </Selector>
    {error && <Alerta tipo="error">{error}</Alerta>}
    <div className="flex gap-3"><Boton type="submit" cargando={guardando}>Guardar dependencia</Boton>{alCerrar && <Boton variante="secundario" onClick={alCerrar}>Cancelar edición</Boton>}</div>
  </form>;
}

export function DependenciasSistema() {
  const [pagina, setPagina] = useState(1);
  const [filtro, setFiltro] = useState<FiltroDependencias>("activas");
  const [editando, setEditando] = useState<Dependencia | null>(null);
  const [archivando, setArchivando] = useState<Dependencia | null>(null);
  const activa = filtro === "activas" ? true : filtro === "archivadas" ? false : undefined;
  const { resultado, recargar } = useConsulta(() => listarDependenciasAdmin({ activa, pagina, porPagina: 20 }), [pagina, filtro]);
  const { destino: anclaResultados, ir: irAResultados, buscando: buscandoResultados } = useIrAResultados(resultado.estado !== "cargando");
  const usuarios = useConsulta(() => listarUsuarios({ activo: true, porPagina: 100 }), []);
  const listaUsuarios = usuarios.resultado.estado === "listo" ? usuarios.resultado.datos.datos : [];

  async function restaurar(dependencia: Dependencia) {
    try { await restaurarDependencia(dependencia.id); avisar.exito(`${dependencia.codigo} quedó restaurada.`); recargar(); }
    catch (error) { avisar.error(error, "No pudimos restaurar la dependencia."); }
  }

  return <section className="flex flex-col gap-4" aria-label="Dependencias">
    <h2 className="text-2xl font-bold">Dependencias</h2>
    <FormularioDependencia dependencia={editando ?? undefined} usuarios={listaUsuarios} key={`${editando?.id ?? "nueva"}-${listaUsuarios.length}`} alGuardar={recargar} alCerrar={editando ? () => setEditando(null) : undefined} />
    <Selector id="filtroDependencias" etiqueta="Mostrar" value={filtro} onChange={(evento) => { setFiltro(evento.target.value as FiltroDependencias); setPagina(1); irAResultados(); }} className="max-w-xs">
      <option value="activas">Activas</option><option value="archivadas">Archivadas</option><option value="todas">Todas</option>
    </Selector>
    <AnclaResultados ref={anclaResultados} buscando={buscandoResultados} etiqueta="Dependencias encontradas" />
    {resultado.estado === "cargando" && <p role="status">Cargando dependencias…</p>}
    {resultado.estado === "error" && <EstadoError mensaje={resultado.mensaje} alReintentar={recargar} />}
    {resultado.estado === "listo" && <>
      {resultado.datos.total === 0 && <p>No hay dependencias con ese filtro.</p>}
      <ul className="flex flex-col gap-2">{resultado.datos.datos.map((dependencia) => <li key={dependencia.id} className="flex flex-wrap items-center justify-between gap-3 rounded-campo border border-gris-claro p-4">
        <span>{dependencia.codigo} · {dependencia.nombre}<span className="block text-gris">{dependencia.activa ? "Activa" : "Archivada"} · Centro de costo: {dependencia.centroCosto ?? "Sin asignar"} · Jefe: {dependencia.jefe?.correo ?? "Sin asignar"}</span></span>
        <span className="flex flex-wrap gap-2">
          {dependencia.activa && <Boton variante="secundario" onClick={() => setEditando(dependencia)}>Editar dependencia {dependencia.codigo}</Boton>}
          {dependencia.activa
            ? <Boton variante="secundario" onClick={() => setArchivando(dependencia)}>Archivar {dependencia.codigo}</Boton>
            : <Boton variante="secundario" onClick={() => restaurar(dependencia)}>Restaurar {dependencia.codigo}</Boton>}
        </span>
      </li>)}</ul>
      <Paginador pagina={resultado.datos.pagina} total={resultado.datos.total} porPagina={resultado.datos.porPagina} alCambiar={(p) => { irAResultados(); setPagina(p); }} />
    </>}
    <DialogoConfirmacion abierto={archivando !== null} titulo={`¿Archivar ${archivando?.codigo ?? "la dependencia"}?`} textoConfirmar="Archivar" variante="peligro"
      alConfirmar={async () => { if (!archivando) return; await archivarDependencia(archivando.id); avisar.exito(`${archivando.codigo} quedó archivada.`); if (editando?.id === archivando.id) setEditando(null); recargar(); }}
      alCerrar={() => setArchivando(null)}>
      <p className="text-gris">No se podrá elegir en solicitudes ni en roles nuevos. Nada se borra: la puedes restaurar después.</p>
    </DialogoConfirmacion>
  </section>;
}
