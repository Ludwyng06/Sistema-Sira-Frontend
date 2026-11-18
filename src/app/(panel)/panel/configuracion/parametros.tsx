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

export interface MetadatosParametro {
  grupo?: string;
  etiqueta: string;
  ayuda?: string;
  multilinea?: boolean;
  tipoInput?: "text" | "url" | "email" | "tel";
  placeholder?: string;
  validar?: (valor: unknown) => string | null;
}

export function validarUrlHttps(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const v = valor.trim();
  if (v === "") return null;
  try {
    const u = new URL(v);
    if (u.protocol !== "https:") {
      return "La URL debe comenzar con https:// (conexión segura).";
    }
    return null;
  } catch {
    return "Debe ingresar una URL válida que comience con https://";
  }
}

export function validarWhatsapp(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const v = valor.trim();
  if (v === "") return null;
  if (!/^\d{10,15}$/.test(v)) {
    return "El número de WhatsApp debe contener de 10 a 15 dígitos (10 a 15 digitos) con indicativo o dejarse vacío.";
  }
  return null;
}

export function validarCorreo(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const v = valor.trim();
  if (v === "") return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
    return "Debe ingresar un correo electrónico válido o dejarse vacío.";
  }
  return null;
}

export const METADATOS_PARAMETROS: Record<string, MetadatosParametro> = {
  PAGO_ENLACE_URL: {
    grupo: "Pago por enlace",
    etiqueta: "URL del enlace de pago",
    ayuda: "Dirección HTTPS del portal institucional de pagos (PSE o recaudo) o vacío si no aplica.",
    tipoInput: "url",
    placeholder: "https://recaudo.institucion.edu.co/pse",
    validar: validarUrlHttps,
  },
  PAGO_INSTRUCCIONES: {
    grupo: "Pago por enlace",
    etiqueta: "Instrucciones de pago",
    ayuda: "Indicaciones para el solicitante sobre cómo realizar el pago por consignación o enlace.",
    multilinea: true,
    placeholder: "Realiza el pago a través del portal y sube el comprobante en formato PDF o imagen.",
    validar: () => null,
  },
  PAGO_WHATSAPP_AREA: {
    grupo: "Pago por enlace",
    etiqueta: "WhatsApp del área de tesorería",
    ayuda: "Número de 10 a 15 dígitos con indicativo de país (ej. 573001234567) o dejar vacío.",
    tipoInput: "tel",
    placeholder: "573001234567",
    validar: validarWhatsapp,
  },
  PAGO_CORREO_AREA: {
    grupo: "Pago por enlace",
    etiqueta: "Correo del área de tesorería",
    ayuda: "Correo electrónico del área de tesorería para notificaciones de pago o dejar vacío.",
    tipoInput: "email",
    placeholder: "tesoreria@institucion.edu.co",
    validar: validarCorreo,
  },
};

/** Conserva la forma recibida del servidor, sin inventar claves ni reglas de negocio. */
function CampoValor({
  valor,
  ruta,
  etiqueta,
  metadatos,
  error,
}: {
  valor: unknown;
  ruta: string;
  etiqueta: string;
  metadatos?: MetadatosParametro;
  error?: string;
}) {
  if (metadatos?.multilinea) {
    return (
      <AreaTexto
        id={ruta}
        etiqueta={etiqueta}
        ayuda={metadatos.ayuda}
        error={error}
        defaultValue={typeof valor === "string" ? valor : ""}
        placeholder={metadatos.placeholder}
        rows={4}
      />
    );
  }
  if (typeof valor === "string" || valor === null || valor === undefined) {
    return (
      <Campo
        id={ruta}
        etiqueta={etiqueta}
        ayuda={metadatos?.ayuda}
        error={error}
        type={metadatos?.tipoInput ?? "text"}
        defaultValue={typeof valor === "string" ? valor : ""}
        placeholder={metadatos?.placeholder}
      />
    );
  }
  if (typeof valor === "number") {
    return (
      <Campo
        id={ruta}
        etiqueta={etiqueta}
        ayuda={metadatos?.ayuda}
        error={error}
        type="number"
        step={1}
        required
        defaultValue={valor}
      />
    );
  }
  if (typeof valor === "boolean") {
    return (
      <label className="flex items-center gap-2">
        <input name={ruta} type="checkbox" defaultChecked={valor} className="size-5" />
        {etiqueta}
      </label>
    );
  }
  if (Array.isArray(valor)) {
    return (
      <AreaTexto
        id={ruta}
        etiqueta={etiqueta}
        ayuda={metadatos?.ayuda ?? "Escribe la lista en formato JSON, conservando el tipo de sus valores."}
        error={error}
        defaultValue={JSON.stringify(valor, null, 2)}
        rows={5}
        required
      />
    );
  }
  if (valor && typeof valor === "object") {
    return (
      <fieldset className="flex flex-col gap-3 rounded-campo border border-gris-claro p-4">
        <legend className="px-1 font-bold">{etiqueta}</legend>
        {Object.entries(valor).map(([clave, contenido]) => (
          <CampoValor key={clave} valor={contenido} ruta={`${ruta}.${clave}`} etiqueta={clave} />
        ))}
      </fieldset>
    );
  }
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
  if (typeof original === "string" || original === null || original === undefined) {
    return String(datos.get(ruta) ?? "");
  }
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

export function EditorParametro({
  parametro,
  alGuardar,
  metadatos = METADATOS_PARAMETROS[parametro.clave],
}: {
  parametro: Parametro;
  alGuardar: () => void;
  metadatos?: MetadatosParametro;
}) {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function procesarGuardado(form: HTMLFormElement) {
    const datos = new FormData(form);
    setGuardando(true);
    setError(null);
    try {
      const nuevoValor = leerValor(parametro.valor, datos, `parametro-${parametro.clave}`);
      if (metadatos?.validar) {
        const errorValidacion = metadatos.validar(nuevoValor);
        if (errorValidacion) {
          setError(errorValidacion);
          setGuardando(false);
          return;
        }
      }
      await actualizarParametro(parametro.clave, nuevoValor);
      avisar.exito(`El parámetro ${parametro.clave} quedó actualizado.`);
      alGuardar();
    } catch (error) {
      setError(error instanceof Error ? error.message : "No pudimos guardar el parámetro.");
    } finally {
      setGuardando(false);
    }
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    await procesarGuardado(evento.currentTarget);
  }

  const etiquetaHumana = metadatos?.etiqueta ?? parametro.clave;
  const descripcionMostrar = parametro.descripcion || metadatos?.ayuda;

  return (
    <form
      onSubmit={guardar}
      aria-label={etiquetaHumana}
      className="flex flex-col gap-3 rounded-campo border border-gris-claro p-4"
    >
      <div className="flex flex-wrap items-baseline gap-2">
        <h3 className="text-xl font-bold break-all">{etiquetaHumana}</h3>
        {metadatos && (
          <span className="font-mono text-sm text-gris">({parametro.clave})</span>
        )}
      </div>
      {descripcionMostrar && <p className="text-gris">{descripcionMostrar}</p>}
      <p className="text-xs text-gris">
        Actualizado el {fecha(parametro.actualizadoEn)} a las {hora(parametro.actualizadoEn)}.
      </p>
      <CampoValor
        valor={parametro.valor}
        ruta={`parametro-${parametro.clave}`}
        etiqueta={metadatos ? etiquetaHumana : "Valor"}
        metadatos={metadatos}
        error={error ?? undefined}
      />
      {error && <Alerta tipo="error">{error}</Alerta>}
      <Boton
        type="submit"
        cargando={guardando}
        className="w-fit"
        onClick={(e) => {
          const form = e.currentTarget.closest("form");
          if (form) {
            e.preventDefault();
            void procesarGuardado(form);
          }
        }}
      >
        Guardar parámetro
      </Boton>
    </form>
  );
}

export function ParametrosSistema() {
  const { resultado, recargar } = useConsulta(listarParametros, []);
  if (resultado.estado === "cargando") return <p role="status">Cargando parámetros…</p>;
  if (resultado.estado === "error") return <EstadoError mensaje={resultado.mensaje} alReintentar={recargar} />;

  const parametros = resultado.datos;
  const clavesOrdenPago = ["PAGO_ENLACE_URL", "PAGO_INSTRUCCIONES", "PAGO_WHATSAPP_AREA", "PAGO_CORREO_AREA"];
  const parametrosPago = parametros.filter((p) => METADATOS_PARAMETROS[p.clave]?.grupo === "Pago por enlace");
  parametrosPago.sort((a, b) => clavesOrdenPago.indexOf(a.clave) - clavesOrdenPago.indexOf(b.clave));

  const otrosParametros = parametros.filter((p) => METADATOS_PARAMETROS[p.clave]?.grupo !== "Pago por enlace");

  return (
    <section className="flex flex-col gap-6" aria-label="Parámetros del sistema">
      <VigenciasSmmlv />
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold">Parámetros del sistema</h2>
          <p className="text-gris">
            Variables de configuración institucional y operativa para el funcionamiento de SIRA.
          </p>
        </div>

        {parametros.length === 0 && <p>No hay parámetros registrados.</p>}

        {parametrosPago.length > 0 && (
          <section
            aria-labelledby="grupo-pago-enlace"
            className="flex flex-col gap-4 rounded-campo border border-azul-claro/40 bg-fondo-suave/40 p-4"
          >
            <div className="flex flex-col gap-1">
              <h3 id="grupo-pago-enlace" className="text-xl font-bold text-azul-oscuro">
                Pago por enlace
              </h3>
              <p className="text-sm text-gris">
                Configuración del canal de pago institucional por enlace (PSE / portal de recaudo) y verificación manual de comprobantes.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              {parametrosPago.map((parametro) => (
                <EditorParametro
                  key={`${parametro.clave}-${parametro.actualizadoEn}`}
                  parametro={parametro}
                  metadatos={METADATOS_PARAMETROS[parametro.clave]}
                  alGuardar={recargar}
                />
              ))}
            </div>
          </section>
        )}

        {otrosParametros.length > 0 && (
          <div className="flex flex-col gap-4">
            {parametrosPago.length > 0 && (
              <h3 className="text-xl font-bold text-azul-oscuro">Otros parámetros</h3>
            )}
            {otrosParametros.map((parametro) => (
              <EditorParametro
                key={`${parametro.clave}-${parametro.actualizadoEn}`}
                parametro={parametro}
                metadatos={METADATOS_PARAMETROS[parametro.clave]}
                alGuardar={recargar}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
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
