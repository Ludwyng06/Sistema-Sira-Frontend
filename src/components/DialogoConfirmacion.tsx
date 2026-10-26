"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { explicarError, type Explicacion } from "@/lib/mensajes";
import { Alerta, AreaTexto, Boton } from "./formularios";

/**
 * Confirmación de acciones sensibles. Con `pedirMotivo` el botón se habilita solo
 * cuando hay un motivo escrito. Si la API rechaza la acción, se muestra su mensaje
 * y el diálogo sigue abierto con lo escrito.
 */
export function DialogoConfirmacion({
  abierto,
  titulo,
  children,
  textoConfirmar,
  variante = "primario",
  pedirMotivo = false,
  etiquetaMotivo = "Motivo",
  alConfirmar,
  alCerrar,
}: {
  abierto: boolean;
  titulo: string;
  children?: ReactNode;
  textoConfirmar: string;
  variante?: "primario" | "peligro";
  pedirMotivo?: boolean;
  etiquetaMotivo?: string;
  alConfirmar: (motivo: string) => Promise<void>;
  alCerrar: () => void;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();
  const idMotivo = useId();
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<Explicacion | null>(null);

  useEffect(() => {
    const el = dialogo.current;
    if (!el) return;
    if (abierto && !el.open) el.showModal();
    if (!abierto && el.open) el.close();
  }, [abierto]);

  function cerrar() {
    setMotivo("");
    setError(null);
    alCerrar();
  }

  async function alEnviar(evento: FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await alConfirmar(motivo.trim());
      cerrar();
    } catch (e) {
      setError(explicarError(e, "No pudimos completar la acción. Intenta de nuevo."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <dialog
      ref={dialogo}
      onClose={cerrar}
      aria-labelledby={idTitulo}
      className="m-auto w-[min(92vw,32rem)] rounded-campo border border-gris-claro p-0 shadow-xl backdrop:bg-texto/50"
    >
      <form onSubmit={alEnviar} className="flex flex-col gap-4 p-6">
        <h2 id={idTitulo} className="text-xl font-bold">
          {titulo}
        </h2>
        {children}
        {pedirMotivo && (
          <AreaTexto
            id={idMotivo}
            etiqueta={etiquetaMotivo}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            maxLength={500}
            required
          />
        )}
        {error && (
          <Alerta tipo="error" titulo={error.titulo} queHacer={error.queHacer}>
            {error.porQue}
          </Alerta>
        )}
        <div className="flex flex-wrap justify-end gap-3">
          <Boton variante="secundario" onClick={cerrar} disabled={enviando}>
            Volver
          </Boton>
          <Boton
            type="submit"
            variante={variante}
            cargando={enviando}
            disabled={pedirMotivo && motivo.trim() === ""}
          >
            {textoConfirmar}
          </Boton>
        </div>
      </form>
    </dialog>
  );
}
