"use client";

import { useState } from "react";
import { CargadorArchivos } from "@/components/CargadorArchivos";
import { Esqueleto } from "@/components/Esqueleto";
import { Alerta, Boton, Selector } from "@/components/formularios";
import { useSesion } from "@/components/SesionProvider";
import {
  actualizarSolicitud,
  listarDocumentos,
  quitarDocumento,
  subirDocumento,
  TIPOS_DOCUMENTO,
  type TipoDocumento,
} from "@/lib/solicitudes";
import { useConsulta } from "@/lib/useConsulta";
import type { ContextoAsistente } from "./asistente";
import { avisar } from "@/lib/avisos";

/**
 * Paso 4: identificación. Quien usa correo institucional declara si el uso es institucional;
 * la exención la decide el servidor al enviar (el cliente nunca la envía). Todos pueden adjuntar documentos.
 */
export function PasoIdentificacion({
  contexto,
  alContinuar,
  alVolver,
}: {
  contexto: ContextoAsistente;
  alContinuar: () => void;
  alVolver: () => void;
}) {
  const { borrador, recargar } = contexto;
  const { usuario } = useSesion();
  const [tipo, setTipo] = useState<TipoDocumento>("CARTA_SOLICITUD");
  const [error, setError] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [uso, setUso] = useState<"INSTITUCIONAL" | "PARTICULAR">(
    borrador?.declaraUsoInstitucional ? "INSTITUCIONAL" : "PARTICULAR",
  );
  const documentos = useConsulta(
    () => (borrador ? listarDocumentos(borrador.id) : Promise.resolve([])),
    [borrador?.id ?? ""],
  );

  if (!borrador) return null;
  const id = borrador.id;
  const esInterno = usuario?.esInstitucional === true;

  async function elegirUso(valor: "INSTITUCIONAL" | "PARTICULAR") {
    setUso(valor);
    setError(null);
    try {
      await actualizarSolicitud(id, { declaraUsoInstitucional: valor === "INSTITUCIONAL" });
      recargar();
    } catch (e) {
      avisar.error(e, "No pudimos guardar tu elección.");
    }
  }

  async function subir(archivo: File) {
    setError(null);
    setSubiendo(true);
    try {
      await subirDocumento(id, tipo, archivo);
      documentos.recargar();
    } catch (e) {
      avisar.error(e, "No pudimos subir el documento.");
    } finally {
      setSubiendo(false);
    }
  }

  async function quitar(documentoId: string) {
    setError(null);
    try {
      await quitarDocumento(id, documentoId);
      documentos.recargar();
    } catch (e) {
      avisar.error(e, "No pudimos quitar el documento.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <Alerta tipo="error">{error}</Alerta>}

      {esInterno && (
        <fieldset className="flex flex-col gap-3 rounded-lg border border-gris-claro p-4">
          <legend className="px-1 text-xl font-bold">¿Para qué es el uso?</legend>
          <label className="flex items-start gap-2">
            <input
              type="radio"
              name="uso"
              checked={uso === "INSTITUCIONAL"}
              onChange={() => elegirUso("INSTITUCIONAL")}
              className="mt-1 size-5"
            />
            <span>
              <span className="font-medium">Uso institucional</span>
              <span className="block text-sm text-gris">
                Actividad de la Institución. Si se aprueba, no tiene costo. El responsable del espacio
                y el aprobador lo verifican.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-2">
            <input
              type="radio"
              name="uso"
              checked={uso === "PARTICULAR"}
              onChange={() => elegirUso("PARTICULAR")}
              className="mt-1 size-5"
            />
            <span>
              <span className="font-medium">Uso particular</span>
              <span className="block text-sm text-gris">Actividad personal: se cotiza como persona natural.</span>
            </span>
          </label>
        </fieldset>
      )}

      <section aria-labelledby="titulo-documentos" className="flex flex-col gap-3">
        <h2 id="titulo-documentos" className="text-xl font-bold">
          Documentos
        </h2>
        <p className="max-w-prose text-gris">
          Adjunta lo que corresponda a tu caso (carta de solicitud, RUT, cámara de comercio, cédula del
          representante). Si el aforo lo exige, también la póliza: te avisamos al enviar.
        </p>
        <Selector
          id="tipoDocumento"
          etiqueta="Tipo de documento"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoDocumento)}
          className="max-w-sm"
        >
          {(Object.keys(TIPOS_DOCUMENTO) as TipoDocumento[]).map((k) => (
            <option key={k} value={k}>
              {TIPOS_DOCUMENTO[k]}
            </option>
          ))}
        </Selector>
        <CargadorArchivos etiqueta={`Subir: ${TIPOS_DOCUMENTO[tipo]}`} alElegir={subir} deshabilitado={subiendo} />

        {documentos.resultado.estado === "cargando" && <Esqueleto className="h-12 w-full" />}
        {documentos.resultado.estado === "listo" && documentos.resultado.datos.length > 0 && (
          <ul className="divide-y divide-gris-claro rounded-lg border border-gris-claro">
            {documentos.resultado.datos.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2">
                <span>
                  <span className="font-medium">{TIPOS_DOCUMENTO[d.tipo]}</span> · {d.nombre}
                  <span className="block text-sm text-gris">{Math.ceil(d.tamanoBytes / 1024)} KB</span>
                </span>
                <Boton variante="secundario" onClick={() => quitar(d.id)}>
                  Quitar
                </Boton>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-wrap justify-between gap-3">
        <Boton variante="secundario" onClick={alVolver}>
          Atrás
        </Boton>
        <Boton onClick={alContinuar}>Continuar al resumen</Boton>
      </div>
    </div>
  );
}
