"use client";

import { useState, type FormEvent } from "react";
import { Alerta, Boton, Campo, CampoHora, Selector } from "@/components/formularios";
import { EstadoError } from "@/components/EstadoError";
import { actualizarElementoAdmin, crearElementoAdmin, listarElementosAdmin, reemplazarHorariosEspacio, type ActualizarElemento, type ElementoAdmin, type HorarioEspacio } from "@/lib/inventario-admin";
import { useConsulta } from "@/lib/useConsulta";
import { avisar } from "@/lib/avisos";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export function HorariosOperacion({ codigo, horarios, puedeEditar, alGuardar }: { codigo: string; horarios: HorarioEspacio[]; puedeEditar: boolean; alGuardar: () => void }) {
  const [filas, setFilas] = useState(horarios);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  function cambiar(indice: number, cambio: Partial<HorarioEspacio>) { setFilas((anteriores) => anteriores.map((fila, posicion) => posicion === indice ? { ...fila, ...cambio } : fila)); }
  async function guardar(evento: FormEvent) {
    evento.preventDefault();
    setGuardando(true); setError(null);
    try { await reemplazarHorariosEspacio(codigo, filas); avisar.exito("Los horarios de operación quedaron guardados."); alGuardar(); }
    catch (error) { setError(error instanceof Error ? error.message : "No pudimos guardar los horarios."); }
    finally { setGuardando(false); }
  }
  return <section className="flex flex-col gap-3 rounded-campo border border-gris-claro p-6" aria-labelledby="titulo-horarios-operacion">
    <h3 id="titulo-horarios-operacion" className="text-2xl font-bold">Horarios de operación</h3>
    <p className="text-gris">Se reemplaza el horario completo. Un día omitido queda cerrado; sin filas se quita la restricción de horario. Las horas corresponden a Bogotá.</p>
    <form onSubmit={guardar} className="flex flex-col gap-3">
      <fieldset disabled={!puedeEditar || guardando} className="flex flex-col gap-3">
        <legend className="sr-only">Franjas de operación</legend>
        {filas.length === 0 && <p>No hay restricciones de horario registradas.</p>}
        {filas.map((fila, indice) => <div key={indice} className="flex flex-wrap items-end gap-3">
          <Selector id={`horario-dia-${indice}`} etiqueta="Día" value={fila.diaSemana} onChange={(evento) => cambiar(indice, { diaSemana: Number(evento.target.value) })}>{DIAS.map((dia, numero) => <option key={dia} value={numero}>{dia}</option>)}</Selector>
          <CampoHora id={`horario-abre-${indice}`} etiqueta="Abre" value={fila.abre} onChange={(evento) => cambiar(indice, { abre: evento.target.value })} required />
          <CampoHora id={`horario-cierra-${indice}`} etiqueta="Cierra" value={fila.cierra} onChange={(evento) => cambiar(indice, { cierra: evento.target.value })} required />
          {puedeEditar && <Boton variante="secundario" onClick={() => setFilas((anteriores) => anteriores.filter((_, posicion) => posicion !== indice))}>Quitar horario {indice + 1}</Boton>}
        </div>)}
        {puedeEditar && <Boton variante="secundario" className="w-fit" onClick={() => setFilas((anteriores) => [...anteriores, { diaSemana: 1, abre: "08:00", cierra: "17:00" }])}>Agregar horario</Boton>}
      </fieldset>
      {error && <Alerta tipo="error">{error}</Alerta>}
      {puedeEditar && <Boton type="submit" cargando={guardando} className="w-fit">Guardar horarios de operación</Boton>}
    </form>
  </section>;
}

function EditorElemento({ espacioId, elemento, alGuardar, alCerrar }: { espacioId: string; elemento?: ElementoAdmin; alGuardar: () => void; alCerrar?: () => void }) {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prefijo = elemento?.id ?? "nuevo-elemento";
  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const datos = new FormData(formulario);
    const nombre = String(datos.get("nombreElemento") ?? "").trim();
    const cantidad = Number(datos.get("cantidadElemento"));
    const unidad = String(datos.get("unidadElemento") ?? "").trim();
    const estadoFisico = String(datos.get("estadoFisico")) as NonNullable<ActualizarElemento["estadoFisico"]>;
    setGuardando(true); setError(null);
    try {
      if (elemento) await actualizarElementoAdmin(elemento.id, { nombre, cantidad, unidad, estadoFisico, estado: String(datos.get("estadoElemento")) as NonNullable<ActualizarElemento["estado"]>, esPrestable: datos.get("esPrestable") === "on" });
      else await crearElementoAdmin({ espacioId, nombre, cantidad, unidad, estadoFisico, placaInventario: String(datos.get("placaElemento") ?? "").trim() || undefined, esPrestable: datos.get("esPrestable") === "on" });
      avisar.exito(elemento ? "El elemento quedó actualizado." : "El elemento quedó agregado.");
      if (!elemento) formulario.reset();
      alGuardar(); alCerrar?.();
    } catch (error) { setError(error instanceof Error ? error.message : "No pudimos guardar el elemento."); }
    finally { setGuardando(false); }
  }
  return <form onSubmit={guardar} className="flex flex-col gap-3 rounded-campo border border-gris-claro p-4">
    <h4 className="text-xl font-bold">{elemento ? `Editar ${elemento.nombre}` : "Agregar elemento"}</h4>
    <Campo id={`${prefijo}-nombre`} name="nombreElemento" etiqueta="Nombre del elemento" defaultValue={elemento?.nombre} required maxLength={120} />
    <div className="grid gap-3 sm:grid-cols-2">
      <Campo id={`${prefijo}-cantidad`} name="cantidadElemento" etiqueta="Cantidad" type="number" min={1} step={1} required defaultValue={elemento?.cantidad ?? 1} />
      <Campo id={`${prefijo}-unidad`} name="unidadElemento" etiqueta="Unidad" required maxLength={30} defaultValue={elemento?.unidad ?? "unidad"} />
      {!elemento && <Campo id={`${prefijo}-placa`} name="placaElemento" etiqueta="Placa de inventario (opcional)" />}
      <Selector id={`${prefijo}-fisico`} name="estadoFisico" etiqueta="Estado físico" defaultValue={elemento?.estadoFisico ?? "BUENO"}>
        <option value="BUENO">Bueno</option><option value="REGULAR">Regular</option><option value="MALO">Malo</option>
      </Selector>
      {elemento && <Selector id={`${prefijo}-estado`} name="estadoElemento" etiqueta="Estado del elemento" defaultValue={elemento.estado}>
        <option value="EN_SERVICIO">En servicio</option><option value="EN_REPARACION">En reparación</option><option value="DADO_DE_BAJA">Dado de baja</option>
      </Selector>}
      <label className="flex min-h-11 items-center gap-2">
        <input name="esPrestable" type="checkbox" defaultChecked={elemento ? elemento.esPrestable : false} className="size-5" />
        Elemento prestable
      </label>
    </div>
    {error && <Alerta tipo="error">{error}</Alerta>}
    <div className="flex flex-wrap gap-3"><Boton type="submit" cargando={guardando}>Guardar elemento</Boton>{alCerrar && <Boton variante="secundario" onClick={alCerrar}>Cancelar edición de elemento</Boton>}</div>
  </form>;
}

export function ElementosDotacion({ espacioId, puedeEditar }: { espacioId: string; puedeEditar: boolean }) {
  const { resultado, recargar } = useConsulta(() => listarElementosAdmin(espacioId), [espacioId]);
  const [editando, setEditando] = useState<ElementoAdmin | null>(null);
  return <section className="flex flex-col gap-3 rounded-campo border border-gris-claro p-6" aria-labelledby="titulo-elementos-dotacion">
    <h3 id="titulo-elementos-dotacion" className="text-2xl font-bold">Elementos de dotación</h3>
    {puedeEditar && <EditorElemento espacioId={espacioId} elemento={editando ?? undefined} key={editando?.id ?? "nuevo"} alGuardar={recargar} alCerrar={editando ? () => setEditando(null) : undefined} />}
    {resultado.estado === "cargando" && <p role="status">Cargando elementos…</p>}
    {resultado.estado === "error" && <EstadoError mensaje={resultado.mensaje} alReintentar={recargar} />}
    {resultado.estado === "listo" && (resultado.datos.length === 0 ? <p>No hay elementos registrados en este espacio.</p> : <ul className="flex flex-col gap-2">{resultado.datos.map((elemento) => <li key={elemento.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-gris-claro py-3">
      <span>{elemento.nombre} · {elemento.cantidad} {elemento.unidad}<span className="block text-gris">{elemento.estado === "EN_SERVICIO" ? "En servicio" : elemento.estado === "EN_REPARACION" ? "En reparación" : "Dado de baja"} · {elemento.estadoFisico === "BUENO" ? "Bueno" : elemento.estadoFisico === "REGULAR" ? "Regular" : "Malo"}</span></span>
      {puedeEditar && <Boton variante="secundario" onClick={() => setEditando(elemento)}>Editar elemento {elemento.nombre}</Boton>}
    </li>)}</ul>)}
  </section>;
}
