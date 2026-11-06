"use client";

import { useState, type FormEvent } from "react";
import { Boton, Campo, Alerta } from "@/components/formularios";
import { importarHorarioCsv, type ReporteImportacion } from "@/lib/bloqueos";
import { fecha, hora } from "@/lib/formato";
import { avisar } from "@/lib/avisos";

export function ImportacionHorario({ alImportar }: { alImportar: () => void }) {
  const [reporte, setReporte] = useState<ReporteImportacion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  async function importar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const archivo = new FormData(formulario).get("horarioCsv");
    if (!(archivo instanceof File) || archivo.size === 0) { setError("Selecciona el archivo CSV del horario académico."); return; }
    setCargando(true);
    setError(null);
    setReporte(null);
    try {
      const respuesta = await importarHorarioCsv(archivo);
      setReporte(respuesta);
      alImportar();
      avisar.exito("La importación terminó. Revisa las filas importadas, los conflictos y los errores.");
    } catch (error) { setError(error instanceof Error ? error.message : "No pudimos importar el horario."); }
    finally { setCargando(false); }
  }
  return <section className="flex flex-col gap-4 rounded-campo border border-gris-claro p-6" aria-labelledby="titulo-importacion">
    <h2 id="titulo-importacion" className="text-2xl font-bold">Importar horario académico (CSV)</h2>
    <p className="text-gris">Encabezados: espacio, dia, horaInicio, horaFin, desde, hasta y descripcion (opcional). Usa códigos de espacio, días LUN a DOM, horas HH:MM de Bogotá y fechas AAAA-MM-DD. Máximo 2 MB. Los conflictos se omiten y aparecen en el resultado.</p>
    <form onSubmit={importar} className="flex flex-col items-start gap-3">
      <Campo id="horarioCsv" etiqueta="Archivo del horario académico" type="file" accept=".csv,text/csv" required />
      <Boton type="submit" cargando={cargando}>Importar horario</Boton>
    </form>
    {error && <Alerta tipo="error">{error}</Alerta>}
    {reporte && <div role="status" className="flex flex-col gap-3">
      <p>{reporte.filasLeidas} filas leídas · {reporte.bloqueosCreados} bloqueos creados · {reporte.franjasCreadas} franjas creadas.</p>
      <h3 className="text-xl font-bold">Conflictos ({reporte.conflictos.length})</h3>
      {reporte.conflictos.length === 0 ? <p>No hubo conflictos.</p> : <ul className="list-disc pl-5">{reporte.conflictos.map((conflicto, indice) => <li key={`${conflicto.fila}-${indice}`}>Fila {conflicto.fila} · {conflicto.espacio} · {fecha(conflicto.inicio)} {hora(conflicto.inicio)} a {hora(conflicto.fin)}: {conflicto.motivo}</li>)}</ul>}
      <h3 className="text-xl font-bold">Errores ({reporte.errores.length})</h3>
      {reporte.errores.length === 0 ? <p>No hubo filas inválidas.</p> : <ul className="list-disc pl-5">{reporte.errores.map((error, indice) => <li key={`${error.fila}-${indice}`}>Fila {error.fila}: {error.mensaje}</li>)}</ul>}
    </div>}
  </section>;
}
