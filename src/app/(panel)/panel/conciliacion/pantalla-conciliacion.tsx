"use client";

import { useState, type FormEvent } from "react";
import { BotonDescarga } from "@/components/BotonDescarga";
import { EstadoError } from "@/components/EstadoError";
import { EstadoVacio } from "@/components/EstadoVacio";
import { Boton, Campo, Selector } from "@/components/formularios";
import { fecha, hora, pesos } from "@/lib/formato";
import { useConsulta } from "@/lib/useConsulta";
import { ayerBogota, compararExtracto, consultarConciliacion, descargarConciliacionPdf,
  errorExtracto, fechaConsulta, type InformeConciliacion } from "@/lib/conciliacion";

const tituloFecha = (dia: string) => dia.split("-").reverse().join("/");
const medios = { PASARELA: "Pasarela", CONSIGNACION: "Consignación", ORDEN_SERVICIO: "Orden de servicio" };
const tiposDiferencia = { VALOR: "Valor distinto", SIN_ORDEN: "Sin orden", SIN_EXTRACTO: "Sin extracto", ESTADO: "Estado distinto" };
const totales = ["aprobadas", "rechazadas", "pendientes", "anuladas"] as const;
const celda = "border-b border-gris-claro px-4 py-3 text-left";
const tabla = "w-full border-collapse text-sm";
const monto = (valor: number | null) => valor === null ? "No disponible" : pesos(valor);

export function PantallaConciliacion() {
  const [dia, setDia] = useState(ayerBogota);
  const [seleccion, setSeleccion] = useState(() => tituloFecha(dia));
  const [errorFecha, setErrorFecha] = useState<string>();
  const [version, setVersion] = useState(0);
  function consultar(evento: FormEvent) {
    evento.preventDefault();
    const iso = fechaConsulta(seleccion);
    if (!iso) { setErrorFecha("Escribe una fecha válida en formato dd/mm/aaaa."); return; }
    setErrorFecha(undefined);
    setDia(iso);
    setVersion((actual) => actual + 1);
  }
  return <div className="flex flex-col gap-6">
    <header><h1 className="text-t1 font-black">Conciliación diaria</h1>
      <p className="text-gris">Consulta el recaudo y compara las órdenes con el extracto de tesorería.</p></header>
    <form onSubmit={consultar} className="flex flex-wrap items-end gap-3">
      <Campo id="fecha-conciliacion" etiqueta="Fecha de conciliación" ayuda="Día en Bogotá (dd/mm/aaaa)." error={errorFecha}
        value={seleccion} onChange={(e) => setSeleccion(e.target.value)} placeholder="dd/mm/aaaa" required inputMode="numeric" />
      <Boton type="submit">Consultar informe</Boton>
    </form>
    <InformeDelDia key={`${dia}-${version}`} dia={dia} />
  </div>;
}

function InformeDelDia({ dia }: { dia: string }) {
  const { resultado, recargar } = useConsulta(() => consultarConciliacion(dia), [dia]);
  const [comparado, setComparado] = useState<InformeConciliacion | null>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [errorCsv, setErrorCsv] = useState<string>();
  const [subiendo, setSubiendo] = useState(false);
  const [estado, setEstado] = useState("");
  const [medio, setMedio] = useState("");
  const datos = comparado ?? (resultado.estado === "listo" ? resultado.datos : null);

  async function comparar(evento: FormEvent) {
    evento.preventDefault();
    if (!archivo) { setErrorCsv("Selecciona un archivo CSV."); return; }
    const error = errorExtracto(archivo);
    if (error) { setErrorCsv(error); return; }
    setSubiendo(true); setErrorCsv(undefined);
    try { setComparado(await compararExtracto(dia, archivo)); }
    catch (e) { setErrorCsv(e instanceof Error ? e.message : "No pudimos comparar el extracto. Intenta de nuevo."); }
    finally { setSubiendo(false); }
  }

  const filas = datos?.filas.filter((fila) => (!estado || fila.estado === estado) && (!medio || fila.medio === medio)) ?? [];
  return <>
    <section aria-labelledby="extracto-titulo" className="rounded-campo border border-gris-claro p-5">
      <h2 id="extracto-titulo" className="text-xl font-bold">Comparar extracto CSV</h2>
      <p id="extracto-ayuda" className="my-2 text-gris">Columnas: referencia,valor,fecha. Máximo 2 MB. La comparación es temporal; el extracto no se guarda.</p>
      <form onSubmit={comparar} className="flex flex-wrap items-end gap-3">
        <Campo id="extracto-csv" etiqueta="Archivo CSV" type="file" accept=".csv,text/csv" ayuda="Valores en pesos enteros."
          error={errorCsv} disabled={subiendo || !datos} onChange={(evento) => {
            const elegido = evento.target.files?.[0] ?? null;
            const error = elegido ? errorExtracto(elegido) : null;
            setErrorCsv(error ?? undefined); setArchivo(error ? null : elegido);
          }} />
        <Boton type="submit" cargando={subiendo} disabled={!archivo || !datos}>Comparar extracto</Boton>
      </form>
      {errorCsv && <p role="alert" className="mt-3 text-error">{errorCsv}</p>}
    </section>
    <div aria-live="polite" aria-atomic="true" role="status">
      {subiendo ? "Comparando extracto…" : resultado.estado === "cargando" ? "Cargando informe de conciliación…" : datos
        ? `Informe del ${tituloFecha(dia)}: ${datos.filas.length} órdenes y ${datos.diferencias.length} diferencias${comparado ? ", comparado con el extracto" : ""}.` : "No se pudo cargar el informe."}
    </div>
    {resultado.estado === "error" && !comparado && <EstadoError mensaje={resultado.mensaje} alReintentar={recargar} />}
    {datos && <div aria-busy={subiendo} className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-xl font-bold">Informe del {tituloFecha(datos.fecha)}</h2>
          <p className="text-gris">Generado el {fecha(datos.generadoEn)} a las {hora(datos.generadoEn)} (Bogotá).</p></div>
        <BotonDescarga descargar={() => descargarConciliacionPdf(dia)} nombreArchivo={`Conciliacion-${dia}.pdf`}>Descargar PDF</BotonDescarga>
      </div>
      {comparado && <p className="text-gris">El PDF descarga el informe diario del sistema; esta comparación temporal con el extracto se muestra en pantalla.</p>}
      <section aria-label="Totales del día" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {totales.map((clave) => <article key={clave} className="rounded-campo border border-gris-claro bg-fondo-suave p-5">
          <h3 className="font-bold capitalize">{clave}</h3><p>{datos.totales[clave].cantidad} órdenes</p>
          <p className="text-xl font-bold">{pesos(datos.totales[clave].valor)}</p>
        </article>)}
      </section>
      <section aria-labelledby="diferencias-titulo" className="rounded-campo border-2 border-azul bg-fondo-suave p-5">
        <h2 id="diferencias-titulo" className="mb-3 text-xl font-bold">Diferencias frente al extracto</h2>
        {datos.diferencias.length === 0 ? <p>Sin diferencias</p> : <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Tabla de diferencias"><table className={tabla}>
          <caption className="sr-only">Diferencias del {tituloFecha(dia)} frente al extracto</caption>
          <thead><tr>{["Referencia", "Diferencia", "Valor sistema", "Valor extracto", "Detalle"].map((t) => <th key={t} scope="col" className={celda}>{t}</th>)}</tr></thead>
          <tbody>{datos.diferencias.map((d, i) => <tr key={`${d.referencia}-${d.tipo}-${i}`}>
            <th scope="row" className={celda}>{d.referencia ?? "Sin referencia"}</th><td className={celda}>{tiposDiferencia[d.tipo]}</td>
            <td className={celda}>{monto(d.valorSistema)}</td><td className={celda}>{monto(d.valorExtracto)}</td><td className={celda}>{d.detalle}</td>
          </tr>)}</tbody>
        </table></div>}
      </section>
      <section><h2 className="mb-3 text-xl font-bold">Por proveedor</h2>
        {datos.porProveedor.length === 0 ? <p>No hay movimientos por proveedor para este día.</p> : <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Tabla por proveedor"><table className={tabla}>
          <caption className="sr-only">Cantidad y valor en pesos por proveedor del {tituloFecha(dia)}</caption>
          <thead><tr>{["Proveedor", "Aprobadas (cantidad / valor COP)", "Rechazadas (cantidad / valor COP)", "Pendientes (cantidad / valor COP)"].map((t) => <th key={t} scope="col" className={celda}>{t}</th>)}</tr></thead>
          <tbody>{datos.porProveedor.map((p) => <tr key={p.proveedor}><th scope="row" className={celda}>{p.proveedor}</th>
            {(["aprobadas", "rechazadas", "pendientes"] as const).map((k) => <td key={k} className={celda}>{p[k].cantidad} / {pesos(p[k].valor)}</td>)}
          </tr>)}</tbody>
        </table></div>}
      </section>
      <section><h2 className="mb-3 text-xl font-bold">Órdenes del día</h2>
        <div className="mb-4 flex flex-wrap gap-3">
          <Selector id="estado-conciliacion" etiqueta="Estado" value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Todos los estados</option>{Array.from(new Set(datos.filas.map((f) => f.estado))).sort().map((e) => <option key={e} value={e}>{e.replaceAll("_", " ")}</option>)}
          </Selector>
          <Selector id="medio-conciliacion" etiqueta="Medio" value={medio} onChange={(e) => setMedio(e.target.value)}>
            <option value="">Todos los medios</option>{Object.entries(medios).map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
          </Selector>
        </div>
        <p role="status" className="mb-2 text-gris">{filas.length} órdenes visibles</p>
        {filas.length === 0 ? <EstadoVacio titulo="Sin órdenes" mensaje={datos.filas.length ? "No hay órdenes que coincidan con los filtros." : "No hay órdenes para el día seleccionado."} /> : <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Tabla de órdenes"><table className={tabla}>
          <caption className="sr-only">Órdenes del {tituloFecha(dia)}, valores en pesos colombianos</caption>
          <thead><tr>{["Referencia", "Proveedor", "Medio", "Estado", "Valor COP", "Transacción externa", "Fecha de pago"].map((t) => <th key={t} scope="col" className={celda}>{t}</th>)}</tr></thead>
          <tbody>{filas.map((fila) => <tr key={fila.ordenId}><th scope="row" className={celda}>{fila.referencia}</th>
            <td className={celda}>{fila.proveedor ?? "No aplica"}</td><td className={celda}>{medios[fila.medio]}</td><td className={celda}>{fila.estado.replaceAll("_", " ")}</td>
            <td className={celda}>{pesos(fila.valor)}</td><td className={`${celda} break-all`}>{fila.transaccionExternaId ?? "Sin transacción"}</td>
            <td className={celda}>{fila.pagadoEn ? `${fecha(fila.pagadoEn)} ${hora(fila.pagadoEn)}` : "Sin pago"}</td>
          </tr>)}</tbody>
        </table></div>}
      </section>
    </div>}
  </>;
}
