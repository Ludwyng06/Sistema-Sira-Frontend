"use client";

import { useId, useRef, useState, type DragEvent } from "react";
import clsx from "clsx";
import { Upload } from "lucide-react";
import { Alerta } from "./formularios";

const TIPOS_PERMITIDOS = ["application/pdf", "image/png", "image/jpeg"];
const TAMANO_MAXIMO = 10 * 1024 * 1024;

/**
 * Subida de un archivo (PDF, PNG o JPG de hasta 10 MB) con clic o arrastrando.
 * La validación que cuenta es la del servidor; aquí solo se avisa antes de enviar.
 */
export function CargadorArchivos({
  etiqueta,
  alElegir,
  deshabilitado = false,
}: {
  etiqueta: string;
  alElegir: (archivo: File) => void;
  deshabilitado?: boolean;
}) {
  const id = useId();
  const entrada = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [encima, setEncima] = useState(false);
  const [elegido, setElegido] = useState<{ nombre: string; vistaPrevia: string | null } | null>(null);

  function recibir(archivo: File | undefined) {
    if (!archivo) return;
    if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
      setError("Solo se aceptan archivos PDF, PNG o JPG.");
      return;
    }
    if (archivo.size > TAMANO_MAXIMO) {
      setError("El archivo supera los 10 MB. Elige uno más liviano.");
      return;
    }
    setError(null);
    setElegido({
      nombre: archivo.name,
      vistaPrevia: archivo.type.startsWith("image/") ? URL.createObjectURL(archivo) : null,
    });
    alElegir(archivo);
    if (entrada.current) entrada.current.value = "";
  }

  function soltar(evento: DragEvent<HTMLLabelElement>) {
    evento.preventDefault();
    setEncima(false);
    if (!deshabilitado) recibir(evento.dataTransfer.files[0]);
  }

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        onDragOver={(e) => {
          e.preventDefault();
          setEncima(true);
        }}
        onDragLeave={() => setEncima(false)}
        onDrop={soltar}
        className={clsx(
          "flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center",
          encima ? "border-azul bg-fondo-suave" : "border-gris-claro",
          deshabilitado && "cursor-not-allowed opacity-60",
        )}
      >
        <Upload aria-hidden className="size-6 text-azul-oscuro" />
        <span className="font-medium">{etiqueta}</span>
        <span className="text-sm text-gris">Arrastra el archivo aquí o haz clic. PDF, PNG o JPG, máximo 10 MB.</span>
      </label>
      <input
        ref={entrada}
        id={id}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
        disabled={deshabilitado}
        onChange={(e) => recibir(e.target.files?.[0])}
        className="sr-only"
      />
      {elegido && (
        <div className="flex items-center gap-3 text-sm">
          {elegido.vistaPrevia && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={elegido.vistaPrevia} alt={`Vista previa de ${elegido.nombre}`} className="size-14 rounded object-cover" />
          )}
          <span>Archivo elegido: {elegido.nombre}</span>
        </div>
      )}
      {error && <Alerta tipo="error">{error}</Alerta>}
    </div>
  );
}
