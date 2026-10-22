"use client";

import { useState, type FocusEvent, type FormEvent } from "react";
import { Alerta, AreaTexto, Boton, Campo } from "@/components/formularios";
import { actualizarSolicitud, type ActualizarSolicitud } from "@/lib/solicitudes";
import { TITULO_PROVISIONAL, type ContextoAsistente } from "./asistente";
import { avisar } from "@/lib/avisos";

const texto = (d: FormData, k: string) => String(d.get(k) ?? "").trim();

function leer(formulario: HTMLFormElement): ActualizarSolicitud {
  const d = new FormData(formulario);
  const datos: ActualizarSolicitud = { eventoPublico: d.get("eventoPublico") === "on" };
  if (texto(d, "objetoEvento")) datos.objetoEvento = texto(d, "objetoEvento");
  if (texto(d, "descripcion")) datos.descripcion = texto(d, "descripcion");
  if (texto(d, "asistentesEstimados")) datos.asistentesEstimados = Number(texto(d, "asistentesEstimados"));
  if (texto(d, "responsableEnSitio")) datos.responsableEnSitio = texto(d, "responsableEnSitio");
  if (texto(d, "telefonoContacto")) datos.telefonoContacto = texto(d, "telefonoContacto");
  return datos;
}

/** Paso 3: datos del evento. Se guardan al salir de cada campo y al continuar. */
export function PasoEvento({
  contexto,
  alContinuar,
  alVolver,
}: {
  contexto: ContextoAsistente;
  alContinuar: () => void;
  alVolver: () => void;
}) {
  const { borrador, recargar } = contexto;
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  if (!borrador) return null;
  const id = borrador.id;

  async function autoguardar(evento: FocusEvent<HTMLFormElement>) {
    try {
      await actualizarSolicitud(id, leer(evento.currentTarget));
      setGuardado(true);
    } catch {
      // El error de verdad se muestra al continuar.
    }
  }

  async function continuar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await actualizarSolicitud(id, leer(evento.currentTarget));
      recargar();
      alContinuar();
    } catch (e) {
      // Lo escrito se conserva: el formulario no se reinicia.
      avisar.error(e, "No pudimos guardar los datos. Intenta de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={continuar} onBlur={autoguardar} className="flex flex-col gap-4">
      {error && <Alerta tipo="error">{error}</Alerta>}
      <Campo
        id="objetoEvento"
        etiqueta="Nombre o motivo del evento"
        maxLength={200}
        defaultValue={borrador.objetoEvento === TITULO_PROVISIONAL ? "" : borrador.objetoEvento}
        required
      />
      <AreaTexto
        id="descripcion"
        etiqueta="Descripción"
        maxLength={1000}
        defaultValue={borrador.descripcion ?? ""}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Campo
          id="asistentesEstimados"
          etiqueta="Número de asistentes"
          type="number"
          min={1}
          defaultValue={borrador.asistentesEstimados}
          required
        />
        <Campo
          id="responsableEnSitio"
          etiqueta="Responsable en el sitio"
          maxLength={120}
          defaultValue={borrador.responsableEnSitio ?? ""}
        />
        <Campo
          id="telefonoContacto"
          etiqueta="Teléfono de contacto"
          type="tel"
          maxLength={30}
          defaultValue={borrador.telefonoContacto ?? ""}
        />
      </div>
      <label className="flex items-center gap-2">
        <input
          name="eventoPublico"
          type="checkbox"
          defaultChecked={borrador.eventoPublico}
          className="size-5"
        />
        Es un evento abierto al público
      </label>
      {guardado && (
        <p role="status" className="text-sm text-gris">
          Borrador guardado.
        </p>
      )}
      <div className="flex flex-wrap justify-between gap-3">
        <Boton variante="secundario" onClick={alVolver}>
          Atrás
        </Boton>
        <Boton type="submit" cargando={enviando}>
          Continuar a identificación
        </Boton>
      </div>
    </form>
  );
}
