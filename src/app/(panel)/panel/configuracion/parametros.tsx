"use client";

import { useState, type FormEvent } from "react";
import { Alerta, AreaTexto, Boton, Campo } from "@/components/formularios";
import { EstadoError } from "@/components/EstadoError";
import {
  actualizarParametro,
  guardarSmmlv,
  listarParametros,
  listarSmmlv,
  type Parametro,
} from "@/lib/administracion";
import { fecha, hora, pesos } from "@/lib/formato";
import { useConsulta } from "@/lib/useConsulta";
import { avisar } from "@/lib/avisos";

/** Conserva la forma recibida del servidor, sin inventar claves ni reglas de negocio. */
function CampoValor({ valor, ruta, etiqueta }: { valor: unknown; ruta: string; etiqueta: string }) {
  if (typeof valor === "number") return <Campo id={ruta} etiqueta={etiqueta} type="number" step={1} required defaultValue={valor} />;
  if (typeof valor === "string") return <Campo id={ruta} etiqueta={etiqueta} defaultValue={valor} />;
  if (typeof valor === "boolean") return <label className="flex items-center gap-2"><input name={ruta} type="checkbox" defaultChecked={valor} className="size-5" />{etiqueta}</label>;
  if (Array.isArray(valor)) return <AreaTexto id={ruta} etiqueta={etiqueta} ayuda="Escribe la lista en formato JSON, conservando el tipo de sus valores." defaultValue={JSON.stringify(valor, null, 2)} rows={5} required />;
  if (valor && typeof valor === "object") return <fieldset className="flex flex-col gap-3 rounded-campo border border-gris-claro p-4">
    <legend className="px-1 font-bold">{etiqueta}</legend>
    {Object.entries(valor).map(([clave, contenido]) => <CampoValor key={clave} valor={contenido} ruta={`${ruta}.${clave}`} etiqueta={clave} />)}
  </fieldset>;
  return <p>{etiqueta}: sin valor.</p>;
}

function mismaForma(original: unknown, nuevo: unknown): boolean {
  if (Array.isArray(original)) return Array.isArray(nuevo) && nuevo.every((valor) => original.length === 0 || mismaForma(original[0], valor));
  if (original !== null && typeof original === "object") return nuevo !== null && typeof nuevo === "object" && !Array.isArray(nuevo)
    && Object.keys(original).length === Object.keys(nuevo).length
    && Object.entries(original).every(([clave, valor]) => clave in nuevo && mismaForma(valor, (nuevo as Record<string, unknown>)[clave]));
  return original === null ? nuevo === null : typeof original === typeof nuevo;
}

function leerValor(original: unknown, datos: FormData, ruta: string): unknown {
  if (typeof original === "number") {
    const valor = Number(datos.get(ruta));
    if (!Number.isSafeInteger(valor)) throw new Error("Los valores numéricos deben ser enteros válidos.");
    return valor;
  }
  if (typeof original === "string") return String(datos.get(ruta) ?? "");
  if (typeof original === "boolean") return datos.get(ruta) === "on";
  if (Array.isArray(original)) {
    let valor: unknown;
    try { valor = JSON.parse(String(datos.get(ruta))); }
    catch { throw new Error(`Revisa el formato JSON de ${ruta}.`); }
    if (!mismaForma(original, valor)) throw new Error("La lista debe conservar el tipo de sus valores.");
    return valor;
  }
  if (original && typeof original === "object") return Object.fromEntries(Object.entries(original).map(([clave, valor]) => [clave, leerValor(valor, datos, `${ruta}.${clave}`)]));
  return null;
}

function EditorParametro({ parametro, alGuardar }: { parametro: Parametro; alGuardar: () => void }) {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    setGuardando(true);
    setError(null);
    try {
      await actualizarParametro(parametro.clave, leerValor(parametro.valor, datos, `parametro-${parametro.clave}`));
      avisar.exito(`El parámetro ${parametro.clave} quedó actualizado.`);
      alGuardar();
    } catch (error) { setError(error instanceof Error ? error.message : "No pudimos guardar el parámetro."); }
    finally { setGuardando(false); }
  }
  return <form onSubmit={guardar} className="flex flex-col gap-3 rounded-campo border border-gris-claro p-4">
    <h3 className="text-xl font-bold break-all">{parametro.clave}</h3>
    {parametro.descripcion && <p>{parametro.descripcion}</p>}
    <p className="text-gris">Actualizado el {fecha(parametro.actualizadoEn)} a las {hora(parametro.actualizadoEn)}.</p>
    <CampoValor valor={parametro.valor} ruta={`parametro-${parametro.clave}`} etiqueta="Valor" />
    {error && <Alerta tipo="error">{error}</Alerta>}
    <Boton type="submit" cargando={guardando} className="w-fit">Guardar parámetro</Boton>
  </form>;
}

export function ParametrosSistema() {
  const { resultado, recargar } = useConsulta(listarParametros, []);
  if (resultado.estado === "cargando") return <p role="status">Cargando parámetros…</p>;
  if (resultado.estado === "error") return <EstadoError mensaje={resultado.mensaje} alReintentar={recargar} />;
  return <section className="flex flex-col gap-6" aria-label="Parámetros del sistema">
    <VigenciasSmmlv />
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">Parámetros del sistema</h2>
      {resultado.datos.length === 0 && <p>No hay parámetros registrados.</p>}
      {resultado.datos.map((parametro) => <EditorParametro key={`${parametro.clave}-${parametro.actualizadoEn}`} parametro={parametro} alGuardar={recargar} />)}
    </div>
  </section>;
}

function VigenciasSmmlv() {
  const { resultado, recargar } = useConsulta(listarSmmlv, []);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    const anio = Number(datos.get("anio"));
    const valor = Number(datos.get("valor"));
    setGuardando(true);
    setError(null);
    try {
      await guardarSmmlv(anio, valor);
      avisar.exito(`SMMLV del año ${anio} guardado en ${pesos(valor)}.`);
      recargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos guardar el SMMLV.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-campo border border-gris-claro p-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold">Valor anual del SMMLV (RN-06)</h2>
        <p className="text-gris">
          Se usa para liquidar las tarifas expresadas en fracciones del salario mínimo mensual legal vigente.
        </p>
      </div>
      {resultado.estado === "listo" && resultado.datos.length > 0 && (
        <ul className="flex flex-wrap gap-3">
          {resultado.datos.map((s) => (
            <li
              key={s.anio}
              className="rounded-campo border border-gris-claro bg-fondo-suave px-4 py-2 font-bold text-azul-oscuro"
            >
              {s.anio}: {pesos(s.valor)}
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={guardar} className="flex flex-wrap items-end gap-3">
        <Campo
          id="anio"
          etiqueta="Año de vigencia"
          type="number"
          min={2020}
          max={2100}
          defaultValue={new Date().getFullYear()}
          required
          className="w-36"
        />
        <Campo
          id="valor"
          etiqueta="Valor SMMLV ($)"
          type="number"
          min={1}
          step={1}
          required
          className="w-48"
        />
        <Boton type="submit" cargando={guardando}>
          Guardar SMMLV
        </Boton>
      </form>
      {error && <Alerta tipo="error">{error}</Alerta>}
    </div>
  );
}
