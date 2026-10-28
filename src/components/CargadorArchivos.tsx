"use client";

import { useId, useRef, useState, type DragEvent } from "react";
import clsx from "clsx";
import { Upload } from "lucide-react";
import { Alerta } from "./formularios";
import { avisar } from "@/lib/avisos";

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
      avisar.errorManual({
        titulo: "Ese archivo no sirve",
        porQue: "Solo aceptamos PDF, PNG o JPG.",
        queHacer: "Conviértelo a uno de esos formatos o elige otro archivo.",
      });
      return;
    }
    if (archivo.size > TAMANO_MAXIMO) {
      avisar.errorManual({
        titulo: "El archivo pesa demasiado",
        porQue: "El máximo es de 10 MB por archivo.",
        queHacer: "Comprímelo o toma una foto más liviana.",
      });
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
          "flex cursor-pointer flex-col items-center gap-2 rounded-campo border-2 border-dashed px-4 py-6 text-center",
          encima ? "border-azul bg-fondo-suave" : "border-gris-claro",
          deshabilitado && "cursor-not-allowed opacity-60",
        )}
      >
        <Upload aria-hidden className="size-6 text-azul-oscuro" />
        <span className="font-medium">{etiqueta}</span>
        <span className="text-base text-gris">Arrastra el archivo aquí o haz clic. PDF, PNG o JPG, máximo 10 MB.</span>
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
        <div className="flex items-center gap-3 text-base">
          {elegido.vistaPrevia && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={elegido.vistaPrevia} alt={`Vista previa de ${elegido.nombre}`} className="size-14 rounded-campo object-cover" />
          )}
          <span>Archivo elegido: {elegido.nombre}</span>
        </div>
      )}
      {error && <Alerta tipo="error">{error}</Alerta>}
    </div>
  );
}
