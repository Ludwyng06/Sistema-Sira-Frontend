"use client";

import { useState, type FormEvent } from "react";
import { DialogoConfirmacion } from "@/components/DialogoConfirmacion";
import { Esqueleto, RegionCargando } from "@/components/Esqueleto";
import { EstadoError } from "@/components/EstadoError";
import { EstadoVacio } from "@/components/EstadoVacio";
import { Paginador } from "@/components/ListaSolicitudes";
import { Pestanas } from "@/components/Pestanas";
import { AreaTexto, Boton, Campo, Selector } from "@/components/formularios";
import { AnclaResultados } from "@/components/AnclaResultados";
import { avisar } from "@/lib/avisos";
import { listarTiposEspacioAdmin } from "@/lib/inventario-admin";
import { UNIDADES_COBRO, type UnidadCobro } from "@/lib/servicios";
import {
  actualizarProveedor,
  actualizarServicio,
  CATEGORIAS_SERVICIO,
  crearProveedor,
  crearServicio,
  desactivarProveedor,
  desactivarServicio,
  listarProveedores,
  listarServiciosAdmin,
  TIPOS_PROVEEDOR,
  type CategoriaServicio,
  type ProveedorAdmin,
  type ServicioAdmin,
} from "@/lib/servicios-admin";
import { useConsulta } from "@/lib/useConsulta";
import { useIrAResultados } from "@/lib/useIrAResultados";

const POR_PAGINA = 20;
const texto = (d: FormData, k: string) => String(d.get(k) ?? "").trim();
type FiltroActivo = "activos" | "inactivos" | "todos";
const aBooleano = (f: FiltroActivo) => (f === "activos" ? true : f === "inactivos" ? false : undefined);

export function PantallaServicios() {
  const [pestana, setPestana] = useState(0);
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-t1 font-black">Servicios y proveedores</h1>
        <p className="text-gris">
          Servicios complementarios que se pueden pedir con un espacio (sonido, refrigerios, logística…) y quién los
          presta. Las tarifas de cada servicio se crean en Tarifario.
        </p>
      </header>
      <Pestanas
        id="servicios"
        etiqueta="Secciones de servicios"
        pestanas={["Servicios complementarios", "Proveedores"]}
        activa={pestana}
        alCambiar={setPestana}
      >
        {pestana === 0 ? <Servicios /> : <Proveedores />}
      </Pestanas>
    </div>
  );
}

function FiltroEstado({ id, valor, alCambiar }: { id: string; valor: FiltroActivo; alCambiar: (f: FiltroActivo) => void }) {
  return (
    <Selector id={id} etiqueta="Mostrar" value={valor} onChange={(e) => alCambiar(e.target.value as FiltroActivo)} className="max-w-xs">
      <option value="activos">Activos</option>
      <option value="inactivos">Inactivos</option>
      <option value="todos">Todos</option>
    </Selector>
  );
}

/* ───────────────────────────── Servicios ───────────────────────────── */

function Servicios() {
  const [filtro, setFiltro] = useState<FiltroActivo>("activos");
  const [pagina, setPagina] = useState(1);
  const [editando, setEditando] = useState<ServicioAdmin | null>(null);
  const [desactivando, setDesactivando] = useState<ServicioAdmin | null>(null);
  const { resultado, recargar } = useConsulta(
    () => listarServiciosAdmin({ activo: aBooleano(filtro), pagina, porPagina: POR_PAGINA }),
    [filtro, pagina],
  );
  const { destino: anclaResultados, ir: irAResultados, buscando: buscandoResultados } = useIrAResultados(resultado.estado !== "cargando");
  const proveedores = useConsulta(() => listarProveedores({ activo: true, porPagina: 100 }), []);
  const tipos = useConsulta(() => listarTiposEspacioAdmin(true), []);
  const listaProveedores = proveedores.resultado.estado === "listo" ? proveedores.resultado.datos.datos : [];
  const listaTipos = tipos.resultado.estado === "listo" ? tipos.resultado.datos.datos : [];

  async function reactivar(s: ServicioAdmin) {
    try {
      await actualizarServicio(s.id, { activo: true });
      avisar.exito(`${s.nombre} quedó activo otra vez.`);
      recargar();
    } catch (e) {
      avisar.error(e, "No pudimos reactivar el servicio.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <FormularioServicio
        key={editando?.id ?? `nuevo-${listaProveedores.length}-${listaTipos.length}`}
        servicio={editando ?? undefined}
        proveedores={listaProveedores}
        tipos={listaTipos}
        alGuardar={recargar}
        alCerrar={editando ? () => setEditando(null) : undefined}
      />

      <section aria-labelledby="titulo-lista-servicios" className="flex flex-col gap-4">
        <h2 id="titulo-lista-servicios" className="text-2xl font-bold">
          Servicios registrados
        </h2>
        <FiltroEstado
          id="filtro-servicios"
          valor={filtro}
          alCambiar={(f) => {
            setFiltro(f);
            setPagina(1);
            irAResultados();
          }}
        />
        <AnclaResultados ref={anclaResultados} buscando={buscandoResultados} etiqueta="Servicios encontrados" />
        {resultado.estado === "cargando" && (
          <RegionCargando etiqueta="Cargando servicios">
            <Esqueleto className="h-32 w-full" />
          </RegionCargando>
        )}
        {resultado.estado === "error" && <EstadoError mensaje={resultado.mensaje} alReintentar={recargar} />}
        {resultado.estado === "listo" &&
          (resultado.datos.total === 0 ? (
            <EstadoVacio titulo="No hay servicios con ese filtro" mensaje="Crea uno arriba o cambia el filtro." />
          ) : (
            <>
              <ul className="flex flex-col gap-2">
                {resultado.datos.datos.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-campo border border-gris-claro p-4">
                    <span>
                      <span className="font-bold">{s.nombre}</span> · {CATEGORIAS_SERVICIO[s.categoria]}
                      {!s.activo && <span className="ml-2 rounded bg-gris-claro px-1.5 py-0.5 text-xs font-semibold">Inactivo</span>}
                      <span className="block text-base text-gris">
                        {s.proveedor.nombre} · se cobra {UNIDADES_COBRO[s.unidadCobro as UnidadCobro]} ·{" "}
                        {s.anticipacionMinimaDias} día{s.anticipacionMinimaDias === 1 ? "" : "s"} de anticipación
                        {s.cantidadMaxima !== null && ` · máximo ${s.cantidadMaxima}`}
                        {s.requiereConfirmacion && " · el proveedor confirma"}
                      </span>
                      <span className="block text-base text-gris">
                        {s.tiposPermitidos.length === 0
                          ? "Para todos los tipos de espacio"
                          : `Solo en: ${s.tiposPermitidos.map((t) => t.nombre).join(", ")}`}
                      </span>
                    </span>
                    <span className="flex flex-wrap gap-2">
                      <Boton variante="secundario" onClick={() => setEditando(s)}>
                        Editar {s.nombre}
                      </Boton>
                      {s.activo ? (
                        <Boton variante="secundario" onClick={() => setDesactivando(s)}>
                          Desactivar
                        </Boton>
                      ) : (
                        <Boton variante="secundario" onClick={() => reactivar(s)}>
                          Reactivar
                        </Boton>
                      )}
                    </span>
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
      </section>

      <DialogoConfirmacion
        abierto={desactivando !== null}
        titulo={`¿Desactivar ${desactivando?.nombre ?? "el servicio"}?`}
        textoConfirmar="Desactivar"
        variante="peligro"
        alConfirmar={async () => {
          if (!desactivando) return;
          await desactivarServicio(desactivando.id);
          avisar.exito(`${desactivando.nombre} quedó desactivado.`);
          if (editando?.id === desactivando.id) setEditando(null);
          recargar();
        }}
        alCerrar={() => setDesactivando(null)}
      >
        <p className="text-gris">Deja de ofrecerse en las solicitudes nuevas. Nada se borra: lo puedes reactivar después.</p>
      </DialogoConfirmacion>
    </div>
  );
}

function FormularioServicio({
  servicio,
  proveedores,
  tipos,
  alGuardar,
  alCerrar,
}: {
  servicio?: ServicioAdmin;
  proveedores: ProveedorAdmin[];
  tipos: { id: string; nombre: string }[];
  alGuardar: () => void;
  alCerrar?: () => void;
}) {
  const [enviando, setEnviando] = useState(false);
  const [tiposElegidos, setTiposElegidos] = useState<string[]>(() => servicio?.tiposPermitidos.map((t) => t.id) ?? []);
  // El proveedor actual puede estar inactivo: se deja en la lista para no perderlo al editar.
  const opcionesProveedor =
    servicio && !proveedores.some((p) => p.id === servicio.proveedor.id)
      ? [{ id: servicio.proveedor.id, nombre: `${servicio.proveedor.nombre} (inactivo)` }, ...proveedores]
      : proveedores;

  function alternarTipo(id: string, marcado: boolean) {
    setTiposElegidos((previos) => (marcado ? [...previos, id] : previos.filter((t) => t !== id)));
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const d = new FormData(formulario);
    const maxima = texto(d, "cantidadMaxima");
    const datos = {
      proveedorId: texto(d, "proveedorId"),
      nombre: texto(d, "nombreServicio"),
      categoria: texto(d, "categoria") as CategoriaServicio,
      descripcion: texto(d, "descripcionServicio") || undefined,
      unidadCobro: texto(d, "unidadCobro") as UnidadCobro,
      requiereConfirmacion: d.get("requiereConfirmacion") === "on",
      anticipacionMinimaDias: Number(texto(d, "anticipacionServicio") || 0),
      cantidadMaxima: maxima === "" ? null : Number(maxima),
      tiposPermitidos: tiposElegidos,
    };
    setEnviando(true);
    try {
      if (servicio) {
        await actualizarServicio(servicio.id, datos);
        avisar.exito("El servicio quedó actualizado.");
      } else {
        await crearServicio(datos);
        avisar.exito("El servicio quedó creado. Recuerda crearle su tarifa en Tarifario.");
        formulario.reset();
        setTiposElegidos([]);
      }
      alGuardar();
      alCerrar?.();
    } catch (e) {
      avisar.error(e, "No pudimos guardar el servicio.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="flex flex-col gap-4 rounded-campo border border-gris-claro p-6">
      <h2 className="text-2xl font-bold">{servicio ? `Editar ${servicio.nombre}` : "Nuevo servicio complementario"}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="nombreServicio" etiqueta="Nombre" maxLength={120} defaultValue={servicio?.nombre} required />
        <Selector id="proveedorId" etiqueta="Proveedor" defaultValue={servicio?.proveedor.id ?? ""} required>
          <option value="" disabled>
            {proveedores.length === 0 ? "Primero crea un proveedor" : "Elige el proveedor"}
          </option>
          {opcionesProveedor.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </Selector>
        <Selector id="categoria" etiqueta="Categoría" defaultValue={servicio?.categoria ?? "TECNICO"} required>
          {(Object.keys(CATEGORIAS_SERVICIO) as CategoriaServicio[]).map((k) => (
            <option key={k} value={k}>
              {CATEGORIAS_SERVICIO[k]}
            </option>
          ))}
        </Selector>
        <Selector id="unidadCobro" etiqueta="Se cobra" defaultValue={servicio?.unidadCobro ?? "EVENTO"} required>
          {(Object.keys(UNIDADES_COBRO) as UnidadCobro[]).map((k) => (
            <option key={k} value={k}>
              {UNIDADES_COBRO[k]}
            </option>
          ))}
        </Selector>
        <Campo
          id="anticipacionServicio"
          etiqueta="Anticipación mínima (días)"
          type="number"
          min={0}
          step={1}
          defaultValue={servicio?.anticipacionMinimaDias ?? 3}
          required
        />
        <Campo
          id="cantidadMaxima"
          etiqueta="Cantidad máxima por solicitud (opcional)"
          type="number"
          min={1}
          step={1}
          defaultValue={servicio?.cantidadMaxima ?? ""}
          ayuda="Vacío = sin tope."
        />
      </div>
      <AreaTexto id="descripcionServicio" etiqueta="Descripción (opcional)" maxLength={1000} defaultValue={servicio?.descripcion ?? ""} />
      <label className="flex min-h-11 items-center gap-2">
        <input
          name="requiereConfirmacion"
          type="checkbox"
          defaultChecked={servicio ? servicio.requiereConfirmacion : true}
          className="size-5"
        />
        El proveedor debe confirmar la disponibilidad
      </label>
      <fieldset className="flex flex-col gap-2 rounded-campo border border-gris-claro p-4">
        <legend className="px-1 font-bold text-tinta">Tipos de espacio donde se ofrece</legend>
        <p className="text-base text-gris">Si no marcas ninguno, se ofrece en todos los tipos de espacio.</p>
        <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
          {tipos.map((t) => (
            <label key={t.id} className="flex min-h-11 items-center gap-2">
              <input
                type="checkbox"
                checked={tiposElegidos.includes(t.id)}
                onChange={(e) => alternarTipo(t.id, e.target.checked)}
                className="size-5"
              />
              {t.nombre}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-wrap gap-3">
        <Boton type="submit" cargando={enviando}>
          {servicio ? "Guardar servicio" : "Crear servicio"}
        </Boton>
        {alCerrar && (
          <Boton variante="secundario" onClick={alCerrar}>
            Cancelar edición
          </Boton>
        )}
      </div>
    </form>
  );
}

/* ───────────────────────────── Proveedores ───────────────────────────── */

function Proveedores() {
  const [filtro, setFiltro] = useState<FiltroActivo>("activos");
  const [pagina, setPagina] = useState(1);
  const [editando, setEditando] = useState<ProveedorAdmin | null>(null);
  const [desactivando, setDesactivando] = useState<ProveedorAdmin | null>(null);
  const { resultado, recargar } = useConsulta(
    () => listarProveedores({ activo: aBooleano(filtro), pagina, porPagina: POR_PAGINA }),
    [filtro, pagina],
  );
  const { destino: anclaResultados, ir: irAResultados, buscando: buscandoResultados } = useIrAResultados(resultado.estado !== "cargando");

  async function reactivar(p: ProveedorAdmin) {
    try {
      await actualizarProveedor(p.id, { activo: true });
      avisar.exito(`${p.nombre} quedó activo. Sus servicios siguen inactivos hasta que los reactives.`);
      recargar();
    } catch (e) {
      avisar.error(e, "No pudimos reactivar el proveedor.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <FormularioProveedor
        key={editando?.id ?? "nuevo"}
        proveedor={editando ?? undefined}
        alGuardar={recargar}
        alCerrar={editando ? () => setEditando(null) : undefined}
      />
      <section aria-labelledby="titulo-lista-proveedores" className="flex flex-col gap-4">
        <h2 id="titulo-lista-proveedores" className="text-2xl font-bold">
          Proveedores registrados
        </h2>
        <FiltroEstado
          id="filtro-proveedores"
          valor={filtro}
          alCambiar={(f) => {
            setFiltro(f);
            setPagina(1);
            irAResultados();
          }}
        />
        <AnclaResultados ref={anclaResultados} buscando={buscandoResultados} etiqueta="Proveedores encontrados" />
        {resultado.estado === "cargando" && <Esqueleto className="h-32 w-full" />}
        {resultado.estado === "error" && <EstadoError mensaje={resultado.mensaje} alReintentar={recargar} />}
        {resultado.estado === "listo" &&
          (resultado.datos.total === 0 ? (
            <EstadoVacio titulo="No hay proveedores con ese filtro" mensaje="Crea uno arriba o cambia el filtro." />
          ) : (
            <>
              <ul className="flex flex-col gap-2">
                {resultado.datos.datos.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-campo border border-gris-claro p-4">
                    <span>
                      <span className="font-bold">{p.nombre}</span> · {TIPOS_PROVEEDOR[p.tipo]}
                      {!p.activo && <span className="ml-2 rounded bg-gris-claro px-1.5 py-0.5 text-xs font-semibold">Inactivo</span>}
                      <span className="block text-base text-gris">
                        {[p.documento && `Doc. ${p.documento}`, p.contactoNombre, p.contactoCorreo, p.contactoTelefono]
                          .filter(Boolean)
                          .join(" · ") || "Sin datos de contacto"}
                      </span>
                      <span className="block text-base text-gris">
                        {p.serviciosActivos} servicio{p.serviciosActivos === 1 ? "" : "s"} activo
                        {p.serviciosActivos === 1 ? "" : "s"}
                        {p.tipo === "EXTERNO" && ` · la institución retiene ${p.porcentajeAdministracion} %`}
                      </span>
                    </span>
                    <span className="flex flex-wrap gap-2">
                      <Boton variante="secundario" onClick={() => setEditando(p)}>
                        Editar {p.nombre}
                      </Boton>
                      {p.activo ? (
                        <Boton variante="secundario" onClick={() => setDesactivando(p)}>
                          Desactivar
                        </Boton>
                      ) : (
                        <Boton variante="secundario" onClick={() => reactivar(p)}>
                          Reactivar
                        </Boton>
                      )}
                    </span>
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
      </section>
      <DialogoConfirmacion
        abierto={desactivando !== null}
        titulo={`¿Desactivar ${desactivando?.nombre ?? "el proveedor"}?`}
        textoConfirmar="Desactivar"
        variante="peligro"
        alConfirmar={async () => {
          if (!desactivando) return;
          await desactivarProveedor(desactivando.id);
          avisar.exito(`${desactivando.nombre} y sus servicios quedaron desactivados.`);
          if (editando?.id === desactivando.id) setEditando(null);
          recargar();
        }}
        alCerrar={() => setDesactivando(null)}
      >
        <p className="text-gris">
          También se desactivan todos sus servicios ({desactivando?.serviciosActivos ?? 0} activos). Nada se borra.
        </p>
      </DialogoConfirmacion>
    </div>
  );
}

function FormularioProveedor({
  proveedor,
  alGuardar,
  alCerrar,
}: {
  proveedor?: ProveedorAdmin;
  alGuardar: () => void;
  alCerrar?: () => void;
}) {
  const [enviando, setEnviando] = useState(false);
  const [tipo, setTipo] = useState<ProveedorAdmin["tipo"]>(proveedor?.tipo ?? "EXTERNO");

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const d = new FormData(formulario);
    const datos = {
      tipo,
      nombre: texto(d, "nombreProveedor"),
      documento: texto(d, "documento") || undefined,
      contactoNombre: texto(d, "contactoNombre") || undefined,
      contactoCorreo: texto(d, "contactoCorreo") || undefined,
      contactoTelefono: texto(d, "contactoTelefono") || undefined,
      porcentajeAdministracion: tipo === "EXTERNO" ? Number(texto(d, "porcentajeAdministracion") || 0) : 0,
    };
    setEnviando(true);
    try {
      if (proveedor) {
        await actualizarProveedor(proveedor.id, datos);
        avisar.exito("El proveedor quedó actualizado.");
      } else {
        await crearProveedor(datos);
        avisar.exito("El proveedor quedó creado.");
        formulario.reset();
        setTipo("EXTERNO");
      }
      alGuardar();
      alCerrar?.();
    } catch (e) {
      avisar.error(e, "No pudimos guardar el proveedor.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="flex flex-col gap-4 rounded-campo border border-gris-claro p-6">
      <h2 className="text-2xl font-bold">{proveedor ? `Editar ${proveedor.nombre}` : "Nuevo proveedor"}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Selector id="tipoProveedor" etiqueta="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value as ProveedorAdmin["tipo"])}>
          {(Object.keys(TIPOS_PROVEEDOR) as ProveedorAdmin["tipo"][]).map((k) => (
            <option key={k} value={k}>
              {TIPOS_PROVEEDOR[k]}
            </option>
          ))}
        </Selector>
        <Campo id="nombreProveedor" etiqueta="Nombre" maxLength={150} defaultValue={proveedor?.nombre} required />
        <Campo id="documento" etiqueta="NIT o documento (opcional)" maxLength={30} defaultValue={proveedor?.documento ?? ""} />
        <Campo id="contactoNombre" etiqueta="Persona de contacto (opcional)" maxLength={120} defaultValue={proveedor?.contactoNombre ?? ""} />
        <Campo id="contactoCorreo" etiqueta="Correo de contacto (opcional)" type="email" maxLength={150} defaultValue={proveedor?.contactoCorreo ?? ""} />
        <Campo id="contactoTelefono" etiqueta="Teléfono de contacto (opcional)" type="tel" maxLength={30} defaultValue={proveedor?.contactoTelefono ?? ""} />
        {tipo === "EXTERNO" && (
          <Campo
            id="porcentajeAdministracion"
            etiqueta="Porcentaje de administración"
            type="number"
            min={0}
            max={100}
            step="any"
            defaultValue={proveedor?.porcentajeAdministracion ?? 0}
            ayuda="Lo que retiene la institución sobre el valor del servicio."
            required
          />
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        <Boton type="submit" cargando={enviando}>
          {proveedor ? "Guardar proveedor" : "Crear proveedor"}
        </Boton>
        {alCerrar && (
          <Boton variante="secundario" onClick={alCerrar}>
            Cancelar edición
          </Boton>
        )}
      </div>
    </form>
  );
}
