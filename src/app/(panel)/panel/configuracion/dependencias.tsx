"use client";

import { useState, type FormEvent } from "react";
import { Boton, Campo, Alerta } from "@/components/formularios";
import { EstadoError } from "@/components/EstadoError";
import { Paginador } from "@/components/ListaSolicitudes";
import { actualizarDependencia, crearDependencia, listarDependenciasAdmin, type Dependencia } from "@/lib/administracion";
import { useConsulta } from "@/lib/useConsulta";
import { avisar } from "@/lib/avisos";

function FormularioDependencia({ dependencia, alGuardar, alCerrar }: { dependencia?: Dependencia; alGuardar: () => void; alCerrar?: () => void }) {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const datos = new FormData(formulario);
    const nombre = String(datos.get("nombreDependencia") ?? "").trim();
    const centroCosto = String(datos.get("centroCosto") ?? "").trim();
    setGuardando(true);
    setError(null);
    try {
      if (dependencia) await actualizarDependencia(dependencia.id, { nombre, centroCosto: centroCosto || null });
      else await crearDependencia({ codigo: String(datos.get("codigoDependencia") ?? "").trim().toUpperCase(), nombre, centroCosto: centroCosto || undefined });
      avisar.exito(dependencia ? "La dependencia quedó actualizada." : "La dependencia quedó creada.");
      if (!dependencia) formulario.reset();
      alGuardar();
      alCerrar?.();
    } catch (error) { setError(error instanceof Error ? error.message : "No pudimos guardar la dependencia."); }
    finally { setGuardando(false); }
  }
  return <form onSubmit={guardar} className="flex flex-col gap-3 rounded-campo border border-gris-claro p-4">
    <h3 className="text-xl font-bold">{dependencia ? `Editar ${dependencia.codigo}` : "Nueva dependencia"}</h3>
    {!dependencia && <Campo id="codigoDependencia" etiqueta="Código" required pattern="[A-Za-z0-9_-]+" />}
    <Campo id="nombreDependencia" etiqueta="Nombre" required maxLength={120} defaultValue={dependencia?.nombre} />
    <Campo id="centroCosto" etiqueta="Centro de costo (opcional)" maxLength={40} defaultValue={dependencia?.centroCosto ?? ""} />
    {error && <Alerta tipo="error">{error}</Alerta>}
    <div className="flex gap-3"><Boton type="submit" cargando={guardando}>Guardar dependencia</Boton>{alCerrar && <Boton variante="secundario" onClick={alCerrar}>Cancelar edición</Boton>}</div>
  </form>;
}

export function DependenciasSistema() {
  const [pagina, setPagina] = useState(1);
  const [editando, setEditando] = useState<Dependencia | null>(null);
  const { resultado, recargar } = useConsulta(() => listarDependenciasAdmin({ pagina, porPagina: 20 }), [pagina]);
  return <section className="flex flex-col gap-4" aria-label="Dependencias">
    <h2 className="text-2xl font-bold">Dependencias</h2>
    <FormularioDependencia dependencia={editando ?? undefined} key={editando?.id ?? "nueva"} alGuardar={recargar} alCerrar={editando ? () => setEditando(null) : undefined} />
    {resultado.estado === "cargando" && <p role="status">Cargando dependencias…</p>}
    {resultado.estado === "error" && <EstadoError mensaje={resultado.mensaje} alReintentar={recargar} />}
    {resultado.estado === "listo" && <>
      {resultado.datos.total === 0 && <p>No hay dependencias registradas.</p>}
      <ul className="flex flex-col gap-2">{resultado.datos.datos.map((dependencia) => <li key={dependencia.id} className="flex flex-wrap items-center justify-between gap-3 rounded-campo border border-gris-claro p-4">
        <span>{dependencia.codigo} · {dependencia.nombre}<span className="block text-gris">{dependencia.activa ? "Activa" : "Archivada"} · Centro de costo: {dependencia.centroCosto ?? "Sin asignar"}</span></span>
        <Boton variante="secundario" onClick={() => setEditando(dependencia)}>Editar dependencia {dependencia.codigo}</Boton>
      </li>)}</ul>
      <Paginador pagina={resultado.datos.pagina} total={resultado.datos.total} porPagina={resultado.datos.porPagina} alCambiar={setPagina} />
    </>}
  </section>;
}
