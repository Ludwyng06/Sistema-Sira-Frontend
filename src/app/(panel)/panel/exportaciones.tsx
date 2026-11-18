"use client";

import { BotonDescarga } from "@/components/BotonDescarga";
import { useSesion } from "@/components/SesionProvider";
import { exportarReporte } from "@/lib/reportes";

export function ExportacionesTablero({ desde, hasta }: { desde: string; hasta: string }) {
  const { tieneRol } = useSesion();
  const soloAprobador = tieneRol("APROBADOR") && !tieneRol("ADMINISTRADOR", "TESORERIA", "AUDITOR");
  const tipos = [
    { tipo: "solicitudes" as const, texto: "Solicitudes" },
    { tipo: "ocupacion" as const, texto: "Ocupación" },
    ...(!soloAprobador ? [{ tipo: "recaudo" as const, texto: "Recaudo" }] : []),
    ...(tieneRol("ADMINISTRADOR", "AUDITOR", "RESPONSABLE_ESPACIO")
      ? [{ tipo: "inventario" as const, texto: "Inventario" }]
      : []),
  ];
  return <section aria-labelledby="titulo-exportar" className="flex flex-col gap-3">
    <h2 id="titulo-exportar" className="text-2xl font-bold">Descargar reportes</h2>
    <p className="text-gris">Los archivos corresponden al periodo mostrado en el tablero.</p>
    <div className="flex flex-wrap gap-3">{tipos.map(({ tipo, texto }) => <div key={tipo} className="flex flex-wrap gap-2">
      {(["xlsx", "csv", "pdf"] as const).map((formato) => <BotonDescarga key={formato}
        descargar={() => exportarReporte(tipo, formato, { desde, hasta })}
        nombreArchivo={`Reporte-${tipo}-${desde.slice(0, 10)}-${hasta.slice(0, 10)}.${formato}`}>
        {texto} {formato.toUpperCase()}
      </BotonDescarga>)}
    </div>)}</div>
  </section>;
}
