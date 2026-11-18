"use client";

import { useState, type FormEvent } from "react";
import { CargadorArchivos } from "@/components/CargadorArchivos";
import { DialogoConfirmacion } from "@/components/DialogoConfirmacion";
import { Alerta, Boton, Campo, CampoHora, Selector } from "@/components/formularios";
import { EstadoError } from "@/components/EstadoError";
import { actualizarElementoAdmin, crearElementoAdmin, eliminarFotoEspacio, listarElementosAdmin, reemplazarHorariosEspacio, subirFotoEspacio, type ActualizarElemento, type ElementoAdmin, type FotoEspacio, type HorarioEspacio } from "@/lib/inventario-admin";
import { obtenerEspacio } from "@/lib/inventario";
import { pesos } from "@/lib/formato";
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
    // Campos opcionales de la hoja de vida del elemento: vacío = sin dato (null al editar, omitido al crear).
    const opcionalTexto = (clave: string) => String(datos.get(clave) ?? "").trim() || null;
    const opcionalEntero = (clave: string) => { const valor = String(datos.get(clave) ?? "").trim(); return valor === "" ? null : Number(valor); };
    const ficha = {
      placaInventario: opcionalTexto("placaElemento"),
      marca: opcionalTexto("marcaElemento"),
      modelo: opcionalTexto("modeloElemento"),
      serie: opcionalTexto("serieElemento"),
      valorUnitario: opcionalEntero("valorElemento"),
      fechaAdquisicion: opcionalTexto("fechaElemento"),
      vidaUtilMeses: opcionalEntero("vidaUtilElemento"),
    };
    const sinNulos = Object.fromEntries(Object.entries(ficha).filter(([, valor]) => valor !== null)) as { [K in keyof typeof ficha]?: NonNullable<(typeof ficha)[K]> };
    setGuardando(true); setError(null);
    try {
      if (elemento) await actualizarElementoAdmin(elemento.id, { nombre, cantidad, unidad, estadoFisico, ...ficha, estado: String(datos.get("estadoElemento")) as NonNullable<ActualizarElemento["estado"]>, esPrestable: datos.get("esPrestable") === "on" });
      else await crearElementoAdmin({ espacioId, nombre, cantidad, unidad, estadoFisico, ...sinNulos, esPrestable: datos.get("esPrestable") === "on" });
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
      <Campo id={`${prefijo}-placa`} name="placaElemento" etiqueta="Placa de inventario (opcional)" maxLength={40} defaultValue={elemento?.placaInventario ?? ""} ayuda="Única en toda la institución." />
      <Campo id={`${prefijo}-marca`} name="marcaElemento" etiqueta="Marca (opcional)" maxLength={80} defaultValue={elemento?.marca ?? ""} />
      <Campo id={`${prefijo}-modelo`} name="modeloElemento" etiqueta="Modelo (opcional)" maxLength={80} defaultValue={elemento?.modelo ?? ""} />
      <Campo id={`${prefijo}-serie`} name="serieElemento" etiqueta="Serie (opcional)" maxLength={80} defaultValue={elemento?.serie ?? ""} />
      <Campo id={`${prefijo}-valor`} name="valorElemento" etiqueta="Valor unitario en pesos (opcional)" type="number" min={0} step={1} defaultValue={elemento?.valorUnitario ?? ""} />
      <Campo id={`${prefijo}-fecha`} name="fechaElemento" etiqueta="Fecha de adquisición (opcional)" type="date" defaultValue={elemento?.fechaAdquisicion?.slice(0, 10) ?? ""} />
      <Campo id={`${prefijo}-vida`} name="vidaUtilElemento" etiqueta="Vida útil en meses (opcional)" type="number" min={1} step={1} defaultValue={elemento?.vidaUtilMeses ?? ""} />
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
      <span>{elemento.nombre} · {elemento.cantidad} {elemento.unidad}{elemento.placaInventario && <span className="text-gris"> · placa {elemento.placaInventario}</span>}<span className="block text-gris">{[elemento.marca, elemento.modelo].filter(Boolean).join(" ")}{(elemento.marca || elemento.modelo) && " · "}{elemento.valorUnitario !== null && `${pesos(elemento.valorUnitario)} c/u · `}{elemento.estado === "EN_SERVICIO" ? "En servicio" : elemento.estado === "EN_REPARACION" ? "En reparación" : "Dado de baja"} · {elemento.estadoFisico === "BUENO" ? "Bueno" : elemento.estadoFisico === "REGULAR" ? "Regular" : "Malo"}</span></span>
      {puedeEditar && <Boton variante="secundario" onClick={() => setEditando(elemento)}>Editar elemento {elemento.nombre}</Boton>}
    </li>)}</ul>)}
  </section>;
}

/**
 * Fotos del espacio. Las actuales se leen de la ficha pública; subir y quitar usa los endpoints de gestión.
 * Solo se pueden quitar las fotos subidas en esta sesión: la API aún no publica el id de las fotos existentes.
 */
export function FotosEspacio({ espacioId, codigo, activo, puedeEditar }: { espacioId: string; codigo: string; activo: boolean; puedeEditar: boolean }) {
  // Un espacio archivado no tiene ficha pública: sus fotos se ven al restaurarlo.
  const ficha = useConsulta(() => (activo ? obtenerEspacio(codigo) : Promise.resolve(null)), [codigo, activo]);
  const [subidas, setSubidas] = useState<FotoEspacio[]>([]);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [quitando, setQuitando] = useState<FotoEspacio | null>(null);
  const [version, setVersion] = useState(0);

  async function subir(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!archivo) { avisar.errorManual({ titulo: "Falta la foto", porQue: "No has elegido ninguna imagen.", queHacer: "Elige un JPG o PNG de hasta 10 MB." }); return; }
    if (!archivo.type.startsWith("image/")) { avisar.errorManual({ titulo: "Ese archivo no sirve", porQue: "Las fotos del espacio deben ser JPG o PNG.", queHacer: "Elige una imagen." }); return; }
    const formulario = evento.currentTarget;
    const datos = new FormData(formulario);
    const orden = String(datos.get("ordenFoto") ?? "").trim();
    setSubiendo(true);
    try {
      const foto = await subirFotoEspacio(espacioId, { archivo, textoAlternativo: String(datos.get("textoAlternativo") ?? "").trim(), esPortada: datos.get("esPortada") === "on", orden: orden === "" ? undefined : Number(orden) });
      setSubidas((anteriores) => [...anteriores, foto]);
      setArchivo(null); formulario.reset(); setVersion((v) => v + 1);
      avisar.exito("La foto quedó subida.");
      ficha.recargar();
    } catch (error) { avisar.error(error, "No pudimos subir la foto."); }
    finally { setSubiendo(false); }
  }

  const actuales = ficha.resultado.estado === "listo" ? (ficha.resultado.datos?.fotos ?? []) : [];
  return <section className="flex flex-col gap-3 rounded-campo border border-gris-claro p-6" aria-labelledby="titulo-fotos-espacio">
    <h3 id="titulo-fotos-espacio" className="text-2xl font-bold">Fotos del espacio</h3>
    {ficha.resultado.estado === "cargando" && <p role="status">Cargando fotos…</p>}
    {ficha.resultado.estado === "error" && <p className="text-gris">No pudimos cargar las fotos actuales: {ficha.resultado.mensaje}</p>}
    {!activo && <p className="text-gris">El espacio está archivado: restáuralo para ver y cambiar sus fotos.</p>}
    {activo && ficha.resultado.estado === "listo" && (actuales.length === 0 ? <p>Este espacio todavía no tiene fotos.</p> : <ul className="grid gap-3 sm:grid-cols-3">{actuales.map((foto) => <li key={foto.urlDetalle} className="flex flex-col gap-1">
      {/* eslint-disable-next-line @next/next/no-img-element -- las variantes las sirve el backend ya optimizadas */}
      <img src={foto.urlTarjeta} alt={foto.alt} className="aspect-video w-full rounded-campo object-cover" />
      <span className="text-base text-gris">{foto.esPortada ? "Portada · " : ""}{foto.alt}</span>
    </li>)}</ul>)}
    {subidas.length > 0 && <div className="flex flex-col gap-2">
      <p className="font-bold">Subidas ahora</p>
      <ul className="flex flex-col gap-2">{subidas.map((foto) => <li key={foto.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-gris-claro py-2">
        <span>{foto.textoAlternativo}{foto.esPortada && <span className="text-gris"> · portada</span>}</span>
        {puedeEditar && <Boton variante="secundario" onClick={() => setQuitando(foto)}>Quitar foto</Boton>}
      </li>)}</ul>
    </div>}
    {puedeEditar && activo && <form onSubmit={subir} className="flex flex-col gap-3 rounded-campo border border-gris-claro p-4">
      <h4 className="text-xl font-bold">Subir una foto</h4>
      <CargadorArchivos key={version} etiqueta="Foto del espacio (JPG o PNG, máximo 10 MB)" alElegir={setArchivo} deshabilitado={subiendo} />
      <Campo id={`foto-alt-${espacioId}`} name="textoAlternativo" etiqueta="Texto alternativo" ayuda="Describe la foto para quien no la ve. Ej.: Auditorio con 200 sillas y tarima." maxLength={250} required />
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo id={`foto-orden-${espacioId}`} name="ordenFoto" etiqueta="Orden (opcional)" type="number" min={0} max={999} step={1} />
        <label className="flex min-h-11 items-center gap-2"><input name="esPortada" type="checkbox" className="size-5" />Usar como portada</label>
      </div>
      <Boton type="submit" cargando={subiendo} className="w-fit">Subir foto</Boton>
    </form>}
    <DialogoConfirmacion abierto={quitando !== null} titulo="¿Quitar esta foto?" textoConfirmar="Quitar foto" variante="peligro"
      alConfirmar={async () => { if (!quitando) return; await eliminarFotoEspacio(espacioId, quitando.id); setSubidas((anteriores) => anteriores.filter((f) => f.id !== quitando.id)); avisar.exito("La foto quedó eliminada."); ficha.recargar(); }}
      alCerrar={() => setQuitando(null)}>
      <p className="text-gris">Se borran la foto y sus variantes. Si era la portada, la siguiente por orden pasa a serlo.</p>
    </DialogoConfirmacion>
  </section>;
}
