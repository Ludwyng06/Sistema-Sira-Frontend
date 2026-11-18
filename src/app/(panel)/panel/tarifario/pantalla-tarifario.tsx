"use client";

import { useState, type FormEvent } from "react";
import { DialogoConfirmacion } from "@/components/DialogoConfirmacion";
import { Esqueleto, RegionCargando } from "@/components/Esqueleto";
import { EstadoError } from "@/components/EstadoError";
import { EstadoVacio } from "@/components/EstadoVacio";
import { Paginador } from "@/components/ListaSolicitudes";
import { Pestanas } from "@/components/Pestanas";
import { Alerta, Boton, Campo, CampoHora, Selector } from "@/components/formularios";
import { AnclaResultados } from "@/components/AnclaResultados";
import { avisar } from "@/lib/avisos";
import { pesos } from "@/lib/formato";
import { listarEspaciosAdmin } from "@/lib/inventario-admin";
import { listarServiciosAdmin } from "@/lib/servicios-admin";
import {
  actualizarRecargo,
  actualizarTarifa,
  crearFestivo,
  crearTarifa,
  eliminarFestivo,
  listarFestivos,
  listarRecargos,
  listarTarifas,
  TIPOS_RECARGO,
  TIPOS_SOLICITANTE,
  UNIDADES_TARIFA,
  type Festivo,
  type Recargo,
  type Tarifa,
  type TipoSolicitante,
  type UnidadTarifa,
} from "@/lib/tarifario-admin";
import { useConsulta } from "@/lib/useConsulta";
import { useIrAResultados } from "@/lib/useIrAResultados";
import { partesBogota } from "@/lib/zona";

const POR_PAGINA = 20;
const texto = (d: FormData, k: string) => String(d.get(k) ?? "").trim();
const hoy = () => partesBogota(new Date()).dia;

/** Días en AAAA-MM-DD sin pasar por Date: así no se corre un día por la zona horaria. */
const dia = (valor: string) => {
  const [a, m, d] = valor.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
};

export function PantallaTarifario() {
  const [pestana, setPestana] = useState(0);
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-t1 font-black">Tarifario</h1>
        <p className="text-gris">
          Tarifas de espacios y servicios, recargos y días festivos. Las cotizaciones y el simulador se calculan
          con estos valores.
        </p>
      </header>
      <Pestanas
        id="tarifario"
        etiqueta="Secciones del tarifario"
        pestanas={["Tarifas", "Recargos", "Festivos"]}
        activa={pestana}
        alCambiar={setPestana}
      >
        {pestana === 0 && <Tarifas />}
        {pestana === 1 && <Recargos />}
        {pestana === 2 && <Festivos />}
      </Pestanas>
    </div>
  );
}

/* ───────────────────────────── Tarifas ───────────────────────────── */

interface Opcion {
  id: string;
  texto: string;
}

function Tarifas() {
  const espacios = useConsulta(() => listarEspaciosAdmin({ activo: true, porPagina: 100 }), []);
  const servicios = useConsulta(() => listarServiciosAdmin({ porPagina: 100 }), []);
  const [filtros, setFiltros] = useState<{ objeto: string; tipoSolicitante: string; vigentes: boolean }>({
    objeto: "",
    tipoSolicitante: "",
    vigentes: true,
  });
  const [pagina, setPagina] = useState(1);
  const [editando, setEditando] = useState<Tarifa | null>(null);
  const [version, setVersion] = useState(0);
  const [espacioFiltro, servicioFiltro] = filtros.objeto.startsWith("espacio:")
    ? [filtros.objeto.slice(8), undefined]
    : filtros.objeto.startsWith("servicio:")
      ? [undefined, filtros.objeto.slice(9)]
      : [undefined, undefined];
  const tarifas = useConsulta(
    () =>
      listarTarifas({
        espacioId: espacioFiltro,
        servicioId: servicioFiltro,
        tipoSolicitante: (filtros.tipoSolicitante || undefined) as TipoSolicitante | undefined,
        vigentes: filtros.vigentes || undefined,
        pagina,
        porPagina: POR_PAGINA,
      }),
    [filtros, pagina, version],
  );
  const { destino: anclaResultados, ir: irAResultados, buscando: buscandoResultados } = useIrAResultados(tarifas.resultado.estado !== "cargando");

  const opcionesEspacio: Opcion[] =
    espacios.resultado.estado === "listo"
      ? espacios.resultado.datos.datos.map((e) => ({ id: e.id, texto: `${e.codigo} · ${e.nombre}` }))
      : [];
  const opcionesServicio: Opcion[] =
    servicios.resultado.estado === "listo"
      ? servicios.resultado.datos.datos.map((s) => ({ id: s.id, texto: s.activo ? s.nombre : `${s.nombre} (inactivo)` }))
      : [];
  const nombreDe = (t: Tarifa) =>
    t.espacioId
      ? (opcionesEspacio.find((o) => o.id === t.espacioId)?.texto ?? "Espacio")
      : (opcionesServicio.find((o) => o.id === t.servicioId)?.texto ?? "Servicio");
  const recargar = () => setVersion((v) => v + 1);

  return (
    <div className="flex flex-col gap-6">
      <FormularioTarifa espacios={opcionesEspacio} servicios={opcionesServicio} alCrear={recargar} />

      <section aria-labelledby="titulo-lista-tarifas" className="flex flex-col gap-4">
        <h2 id="titulo-lista-tarifas" className="text-2xl font-bold">
          Tarifas registradas
        </h2>
        <div className="grid gap-4 rounded-campo border border-gris-claro bg-fondo-suave p-4 sm:grid-cols-3 sm:items-end">
          <Selector
            id="filtro-objeto"
            etiqueta="Espacio o servicio"
            value={filtros.objeto}
            onChange={(e) => {
              setFiltros((f) => ({ ...f, objeto: e.target.value }));
              setPagina(1);
              irAResultados();
            }}
          >
            <option value="">Todos</option>
            <optgroup label="Espacios">
              {opcionesEspacio.map((o) => (
                <option key={o.id} value={`espacio:${o.id}`}>
                  {o.texto}
                </option>
              ))}
            </optgroup>
            <optgroup label="Servicios">
              {opcionesServicio.map((o) => (
                <option key={o.id} value={`servicio:${o.id}`}>
                  {o.texto}
                </option>
              ))}
            </optgroup>
          </Selector>
          <Selector
            id="filtro-solicitante"
            etiqueta="Tipo de solicitante"
            value={filtros.tipoSolicitante}
            onChange={(e) => {
              setFiltros((f) => ({ ...f, tipoSolicitante: e.target.value }));
              setPagina(1);
              irAResultados();
            }}
          >
            <option value="">Todos</option>
            {(Object.keys(TIPOS_SOLICITANTE) as TipoSolicitante[]).map((k) => (
              <option key={k} value={k}>
                {TIPOS_SOLICITANTE[k]}
              </option>
            ))}
          </Selector>
          <label className="flex min-h-11 items-center gap-2">
            <input
              type="checkbox"
              checked={filtros.vigentes}
              onChange={(e) => {
                setFiltros((f) => ({ ...f, vigentes: e.target.checked }));
                setPagina(1);
                irAResultados();
              }}
              className="size-5"
            />
            Solo vigentes hoy
          </label>
        </div>

        {editando && (
          <EditorTarifa
            key={editando.id}
            tarifa={editando}
            nombre={nombreDe(editando)}
            alGuardar={recargar}
            alCerrar={() => setEditando(null)}
          />
        )}

        <AnclaResultados ref={anclaResultados} buscando={buscandoResultados} etiqueta="Tarifas encontradas" />
        {tarifas.resultado.estado === "cargando" && (
          <RegionCargando etiqueta="Cargando tarifas">
            <Esqueleto className="h-40 w-full" />
          </RegionCargando>
        )}
        {tarifas.resultado.estado === "error" && (
          <EstadoError mensaje={tarifas.resultado.mensaje} alReintentar={tarifas.recargar} />
        )}
        {tarifas.resultado.estado === "listo" &&
          (tarifas.resultado.datos.total === 0 ? (
            <EstadoVacio titulo="No hay tarifas con esos filtros" mensaje="Crea una arriba o cambia los filtros." />
          ) : (
            <>
              <div className="rounded-campo border border-gris-claro">
                <table className="tabla-completa text-left text-base">
                  <caption className="sr-only">Tarifas registradas</caption>
                  <thead className="bg-fondo-suave">
                    <tr>
                      <th scope="col" className="px-3 py-2">Aplica a</th>
                      <th scope="col" className="px-3 py-2">Solicitante</th>
                      <th scope="col" className="px-3 py-2">Unidad</th>
                      <th scope="col" className="px-3 py-2">Valor</th>
                      <th scope="col" className="px-3 py-2">IVA</th>
                      <th scope="col" className="px-3 py-2">Vigencia</th>
                      <th scope="col" className="px-3 py-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gris-claro">
                    {tarifas.resultado.datos.datos.map((t) => (
                      <tr key={t.id}>
                        <th scope="row" data-etiqueta="Aplica a" className="px-3 py-2 font-medium">
                          {nombreDe(t)}
                          <span className="block text-meta font-normal text-gris">{t.espacioId ? "Espacio" : "Servicio"}</span>
                        </th>
                        <td data-etiqueta="Solicitante" className="px-3 py-2">{TIPOS_SOLICITANTE[t.tipoSolicitante]}</td>
                        <td data-etiqueta="Unidad" className="px-3 py-2">{t.unidad ? UNIDADES_TARIFA[t.unidad] : "La del servicio"}</td>
                        <td data-etiqueta="Valor" className="px-3 py-2">
                          {pesos(t.valor)}
                          {t.valorEnSmmlv !== null && (
                            <span className="block text-meta text-gris">{t.valorEnSmmlv} SMMLV</span>
                          )}
                        </td>
                        <td data-etiqueta="IVA" className="px-3 py-2">{t.ivaAplica ? `${t.porcentajeIva} %` : "No"}</td>
                        <td data-etiqueta="Vigencia" className="px-3 py-2">
                          Desde {dia(t.vigenciaDesde)}
                          <span className="block">{t.vigenciaHasta ? `Hasta ${dia(t.vigenciaHasta)}` : "Indefinida"}</span>
                          {t.acuerdoSoporte && (
                            <span className="block text-meta text-gris">Soporte: {t.acuerdoSoporte}</span>
                          )}
                        </td>
                        <td data-etiqueta="Acciones" className="px-3 py-2">
                          <Boton variante="secundario" className="min-h-11 px-3 py-1" onClick={() => setEditando(t)}>
                            Cerrar vigencia o editar soporte
                          </Boton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Paginador
                pagina={tarifas.resultado.datos.pagina}
                total={tarifas.resultado.datos.total}
                porPagina={tarifas.resultado.datos.porPagina}
                alCambiar={(p) => {
                  irAResultados();
                  setPagina(p);
                }}
              />
            </>
          ))}
      </section>
    </div>
  );
}

/** Nueva tarifa. Exactamente uno de espacio o servicio; valor en pesos o en SMMLV, no ambos. */
function FormularioTarifa({
  espacios,
  servicios,
  alCrear,
}: {
  espacios: Opcion[];
  servicios: Opcion[];
  alCrear: () => void;
}) {
  const [aplicaA, setAplicaA] = useState<"espacio" | "servicio">("espacio");
  const [enSmmlv, setEnSmmlv] = useState(false);
  const [ivaAplica, setIvaAplica] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const d = new FormData(formulario);
    const objeto = texto(d, "objetoTarifa");
    const valor = Number(texto(d, "valorTarifa"));
    setEnviando(true);
    try {
      await crearTarifa({
        ...(aplicaA === "espacio" ? { espacioId: objeto, unidad: texto(d, "unidadTarifa") as UnidadTarifa } : { servicioId: objeto }),
        tipoSolicitante: texto(d, "tipoSolicitante") as TipoSolicitante,
        ...(enSmmlv ? { valorEnSmmlv: valor } : { valor: Math.round(valor) }),
        vigenciaDesde: texto(d, "vigenciaDesde"),
        vigenciaHasta: texto(d, "vigenciaHasta") || undefined,
        acuerdoSoporte: texto(d, "acuerdoSoporte") || undefined,
        ivaAplica,
        porcentajeIva: ivaAplica ? Number(texto(d, "porcentajeIva")) : undefined,
      });
      avisar.exito("La tarifa quedó creada.");
      formulario.reset();
      setIvaAplica(false);
      setEnSmmlv(false);
      alCrear();
    } catch (e) {
      avisar.error(e, "No pudimos crear la tarifa.");
    } finally {
      setEnviando(false);
    }
  }

  const opciones = aplicaA === "espacio" ? espacios : servicios;
  return (
    <form onSubmit={guardar} className="flex flex-col gap-4 rounded-campo border border-gris-claro p-6">
      <h2 className="text-2xl font-bold">Nueva tarifa</h2>
      <p className="max-w-prose text-gris">
        El valor de una tarifa no se cambia después de creada (RN-05). Para cambiar un precio, cierra la vigencia
        de la actual y crea una nueva desde el día siguiente.
      </p>
      <fieldset className="flex flex-wrap gap-4">
        <legend className="mb-1 font-bold text-tinta">Aplica a</legend>
        {(["espacio", "servicio"] as const).map((valor) => (
          <label key={valor} className="flex min-h-11 items-center gap-2">
            <input
              type="radio"
              name="aplicaA"
              checked={aplicaA === valor}
              onChange={() => setAplicaA(valor)}
              className="size-5"
            />
            {valor === "espacio" ? "Un espacio" : "Un servicio complementario"}
          </label>
        ))}
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <Selector key={aplicaA} id="objetoTarifa" etiqueta={aplicaA === "espacio" ? "Espacio" : "Servicio"} required defaultValue="">
          <option value="" disabled>
            Elige {aplicaA === "espacio" ? "un espacio" : "un servicio"}
          </option>
          {opciones.map((o) => (
            <option key={o.id} value={o.id}>
              {o.texto}
            </option>
          ))}
        </Selector>
        <Selector id="tipoSolicitante" etiqueta="Tipo de solicitante" required defaultValue="PERSONA_NATURAL">
          {(Object.keys(TIPOS_SOLICITANTE) as TipoSolicitante[]).map((k) => (
            <option key={k} value={k}>
              {TIPOS_SOLICITANTE[k]}
            </option>
          ))}
        </Selector>
        {aplicaA === "espacio" ? (
          <Selector id="unidadTarifa" etiqueta="Unidad de cobro" required defaultValue="HORA">
            {(Object.keys(UNIDADES_TARIFA) as UnidadTarifa[]).map((k) => (
              <option key={k} value={k}>
                {UNIDADES_TARIFA[k]}
              </option>
            ))}
          </Selector>
        ) : (
          <p className="self-end text-base text-gris">En servicios, la unidad de cobro es la del servicio.</p>
        )}
        <div className="flex flex-col gap-2">
          <Campo
            id="valorTarifa"
            etiqueta={enSmmlv ? "Valor en SMMLV" : "Valor en pesos"}
            type="number"
            min={0}
            step={enSmmlv ? "0.0001" : 1}
            ayuda={enSmmlv ? "Fracción del salario mínimo, hasta 4 decimales. El valor en pesos se calcula con el año." : "Pesos enteros, sin puntos."}
            required
          />
          <label className="flex min-h-11 items-center gap-2">
            <input type="checkbox" checked={enSmmlv} onChange={(e) => setEnSmmlv(e.target.checked)} className="size-5" />
            Expresar en SMMLV
          </label>
        </div>
        <Campo id="vigenciaDesde" etiqueta="Vigente desde" type="date" defaultValue={hoy()} required />
        <Campo id="vigenciaHasta" etiqueta="Vigente hasta (opcional)" type="date" ayuda="Vacío = sin fecha de fin." />
        <Campo id="acuerdoSoporte" etiqueta="Acuerdo de soporte (opcional)" maxLength={200} ayuda="Ej.: Acuerdo 012 de 2026." />
        <div className="flex flex-col gap-2">
          <label className="flex min-h-11 items-center gap-2">
            <input type="checkbox" checked={ivaAplica} onChange={(e) => setIvaAplica(e.target.checked)} className="size-5" />
            Cobra IVA
          </label>
          {ivaAplica && (
            <Campo id="porcentajeIva" etiqueta="Porcentaje de IVA" type="number" min={0} max={100} step={1} defaultValue={19} required />
          )}
        </div>
      </div>
      <Boton type="submit" cargando={enviando} className="w-fit">
        Crear tarifa
      </Boton>
    </form>
  );
}

/** Lo único editable de una tarifa: cerrar su vigencia o cambiar el acuerdo de soporte. */
function EditorTarifa({
  tarifa,
  nombre,
  alGuardar,
  alCerrar,
}: {
  tarifa: Tarifa;
  nombre: string;
  alGuardar: () => void;
  alCerrar: () => void;
}) {
  const [enviando, setEnviando] = useState(false);

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const d = new FormData(evento.currentTarget);
    const vigenciaHasta = texto(d, "editarVigenciaHasta");
    const acuerdoSoporte = texto(d, "editarAcuerdo");
    setEnviando(true);
    try {
      await actualizarTarifa(tarifa.id, {
        vigenciaHasta: vigenciaHasta && vigenciaHasta !== tarifa.vigenciaHasta?.slice(0, 10) ? vigenciaHasta : undefined,
        acuerdoSoporte: acuerdoSoporte !== (tarifa.acuerdoSoporte ?? "") ? acuerdoSoporte : undefined,
      });
      avisar.exito("La tarifa quedó actualizada.");
      alGuardar();
      alCerrar();
    } catch (e) {
      avisar.error(e, "No pudimos actualizar la tarifa.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="flex flex-col gap-3 rounded-campo border-2 border-azul p-4">
      <h3 className="text-xl font-bold">
        {nombre} · {TIPOS_SOLICITANTE[tarifa.tipoSolicitante]} · {pesos(tarifa.valor)}
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo
          id="editarVigenciaHasta"
          etiqueta="Cerrar la vigencia el"
          type="date"
          min={tarifa.vigenciaDesde.slice(0, 10)}
          defaultValue={tarifa.vigenciaHasta?.slice(0, 10) ?? ""}
          ayuda="Último día en que se cobra este valor."
        />
        <Campo id="editarAcuerdo" etiqueta="Acuerdo de soporte" maxLength={200} defaultValue={tarifa.acuerdoSoporte ?? ""} />
      </div>
      <div className="flex flex-wrap gap-3">
        <Boton type="submit" cargando={enviando}>
          Guardar cambios de la tarifa
        </Boton>
        <Boton variante="secundario" onClick={alCerrar}>
          Cancelar
        </Boton>
      </div>
    </form>
  );
}

/* ───────────────────────────── Recargos ───────────────────────────── */

function Recargos() {
  const { resultado, recargar } = useConsulta(() => listarRecargos(), []);
  if (resultado.estado === "cargando") return <Esqueleto className="h-40 w-full" />;
  if (resultado.estado === "error") return <EstadoError mensaje={resultado.mensaje} alReintentar={recargar} />;
  return (
    <section aria-labelledby="titulo-recargos" className="flex flex-col gap-4">
      <h2 id="titulo-recargos" className="text-2xl font-bold">
        Recargos
      </h2>
      <p className="max-w-prose text-gris">
        Se suman al valor de las franjas nocturnas, dominicales o festivas. El nocturno aplica desde la hora que
        indiques (hora de Bogotá).
      </p>
      <div className="grid gap-4 lg:grid-cols-3">
        {resultado.datos.map((r) => (
          <EditorRecargo key={`${r.tipo}-${r.porcentaje}-${r.desdeHora}-${r.activo}`} recargo={r} alGuardar={recargar} />
        ))}
      </div>
    </section>
  );
}

function EditorRecargo({ recargo, alGuardar }: { recargo: Recargo; alGuardar: () => void }) {
  const [enviando, setEnviando] = useState(false);
  const prefijo = `recargo-${recargo.tipo.toLowerCase()}`;

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const d = new FormData(evento.currentTarget);
    setEnviando(true);
    try {
      await actualizarRecargo(recargo.tipo, {
        porcentaje: Number(texto(d, "porcentaje")),
        desdeHora: recargo.tipo === "NOCTURNO" ? texto(d, "desdeHora") : undefined,
        activo: d.get("activo") === "on",
      });
      avisar.exito(`El recargo ${TIPOS_RECARGO[recargo.tipo].toLowerCase()} quedó actualizado.`);
      alGuardar();
    } catch (e) {
      avisar.error(e, "No pudimos guardar el recargo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="flex flex-col gap-3 rounded-campo border border-gris-claro p-4">
      <h3 className="text-xl font-bold">{TIPOS_RECARGO[recargo.tipo]}</h3>
      <Campo
        id={`${prefijo}-porcentaje`}
        name="porcentaje"
        etiqueta="Porcentaje"
        type="number"
        min={0}
        max={100}
        step="any"
        defaultValue={recargo.porcentaje}
        required
      />
      {recargo.tipo === "NOCTURNO" && (
        <CampoHora
          id={`${prefijo}-desde`}
          name="desdeHora"
          etiqueta="Aplica desde"
          defaultValue={recargo.desdeHora ?? "18:00"}
          required
        />
      )}
      <label className="flex min-h-11 items-center gap-2">
        <input name="activo" type="checkbox" defaultChecked={recargo.activo} className="size-5" />
        Recargo activo
      </label>
      <Boton type="submit" cargando={enviando} className="w-fit">
        Guardar {TIPOS_RECARGO[recargo.tipo].toLowerCase()}
      </Boton>
    </form>
  );
}

/* ───────────────────────────── Festivos ───────────────────────────── */

function Festivos() {
  const anioActual = Number(hoy().slice(0, 4));
  const [anio, setAnio] = useState(anioActual);
  const { resultado, recargar } = useConsulta(() => listarFestivos(anio), [anio]);
  const [enviando, setEnviando] = useState(false);
  const [eliminando, setEliminando] = useState<Festivo | null>(null);

  async function agregar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const d = new FormData(formulario);
    setEnviando(true);
    try {
      const creado = await crearFestivo(texto(d, "fechaFestivo"), texto(d, "nombreFestivo"));
      avisar.exito(`${creado.nombre} quedó registrado como festivo.`);
      formulario.reset();
      recargar();
    } catch (e) {
      avisar.error(e, "No pudimos agregar el festivo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section aria-labelledby="titulo-festivos" className="flex flex-col gap-4">
      <h2 id="titulo-festivos" className="text-2xl font-bold">
        Días festivos
      </h2>
      <p className="max-w-prose text-gris">Las franjas en estos días llevan el recargo festivo.</p>
      <form onSubmit={agregar} className="flex flex-wrap items-end gap-3 rounded-campo border border-gris-claro p-4">
        <Campo id="fechaFestivo" etiqueta="Fecha" type="date" required />
        <Campo id="nombreFestivo" etiqueta="Nombre" maxLength={120} placeholder="Ej. Inmaculada Concepción" required />
        <Boton type="submit" cargando={enviando}>
          Agregar festivo
        </Boton>
      </form>
      <Selector id="anioFestivos" etiqueta="Año" value={anio} onChange={(e) => setAnio(Number(e.target.value))} className="max-w-xs">
        {[anioActual - 1, anioActual, anioActual + 1, anioActual + 2].map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </Selector>
      {resultado.estado === "cargando" && <Esqueleto className="h-32 w-full" />}
      {resultado.estado === "error" && <EstadoError mensaje={resultado.mensaje} alReintentar={recargar} />}
      {resultado.estado === "listo" &&
        (resultado.datos.length === 0 ? (
          <Alerta tipo="info">No hay festivos registrados en {anio}.</Alerta>
        ) : (
          <ul className="divide-y divide-gris-claro rounded-campo border border-gris-claro">
            {resultado.datos.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2">
                <span>
                  <span className="font-bold">{dia(f.fecha)}</span> · {f.nombre}
                </span>
                <Boton variante="secundario" className="min-h-11 px-3 py-1" onClick={() => setEliminando(f)}>
                  Quitar {f.nombre}
                </Boton>
              </li>
            ))}
          </ul>
        ))}
      <DialogoConfirmacion
        abierto={eliminando !== null}
        titulo="¿Quitar este festivo?"
        textoConfirmar="Quitar festivo"
        variante="peligro"
        alConfirmar={async () => {
          if (!eliminando) return;
          await eliminarFestivo(eliminando.id);
          avisar.exito(`${eliminando.nombre} ya no es festivo.`);
          recargar();
        }}
        alCerrar={() => setEliminando(null)}
      >
        <p className="text-gris">
          {eliminando ? `${dia(eliminando.fecha)} · ${eliminando.nombre}` : ""} dejará de contar como festivo.
        </p>
      </DialogoConfirmacion>
    </section>
  );
}

