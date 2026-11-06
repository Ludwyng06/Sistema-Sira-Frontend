"use client";

import { useState, type ReactNode } from "react";
import { Boton } from "./formularios";
import { guardarArchivo } from "@/lib/descarga";
import { avisar } from "@/lib/avisos";

export function BotonDescarga({ descargar, nombreArchivo, children }: {
  descargar: () => Promise<Blob>;
  nombreArchivo: string;
  children: ReactNode;
}) {
  const [cargando, setCargando] = useState(false);
  return <Boton variante="secundario" cargando={cargando} onClick={async () => {
    setCargando(true);
    try { guardarArchivo(await descargar(), nombreArchivo); }
    catch (error) { avisar.error(error, "No pudimos descargar el archivo."); }
    finally { setCargando(false); }
  }}>{children}</Boton>;
}
