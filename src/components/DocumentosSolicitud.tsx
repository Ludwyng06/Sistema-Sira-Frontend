"use client";

import { listarDocumentos, descargarDocumento, TIPOS_DOCUMENTO } from "@/lib/solicitudes";
import { useConsulta } from "@/lib/useConsulta";
import { EstadoError } from "./EstadoError";
import { BotonDescarga } from "./BotonDescarga";

export function DocumentosSolicitud({ solicitudId }: { solicitudId: string }) {
  const { resultado, recargar } = useConsulta(() => listarDocumentos(solicitudId), [solicitudId]);
  return <section className="flex flex-col gap-3" aria-labelledby="titulo-adjuntos">
    <h2 id="titulo-adjuntos" className="text-2xl font-bold">Documentos adjuntos</h2>
    {resultado.estado === "cargando" && <p role="status">Cargando documentos…</p>}
    {resultado.estado === "error" && <EstadoError mensaje={resultado.mensaje} alReintentar={recargar} />}
    {resultado.estado === "listo" && (resultado.datos.length === 0
      ? <p className="text-gris">No se adjuntaron documentos en esta solicitud.</p>
      : <ul className="divide-y divide-gris-claro rounded-campo border border-gris-claro">
        {resultado.datos.map((documento) => <li key={documento.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
          <span>{TIPOS_DOCUMENTO[documento.tipo]} · {documento.nombre}</span>
          <BotonDescarga descargar={() => descargarDocumento(solicitudId, documento.id)} nombreArchivo={documento.nombre}>Descargar</BotonDescarga>
        </li>)}
      </ul>)}
  </section>;
}
