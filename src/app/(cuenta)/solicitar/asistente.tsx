"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import clsx from "clsx";
import { Check } from "lucide-react";
import { Esqueleto, RegionCargando } from "@/components/Esqueleto";
import { EstadoError } from "@/components/EstadoError";
import { Alerta } from "@/components/formularios";
import { crearSolicitud, obtenerSolicitud, type SolicitudDetalle } from "@/lib/solicitudes";
import { useConsulta } from "@/lib/useConsulta";
import { PasoEvento } from "./paso-evento";
import { PasoHorario } from "./paso-horario";
import { PasoIdentificacion } from "./paso-identificacion";
import { PasoResumen } from "./paso-resumen";
import { PasoServicios } from "./paso-servicios";

export interface EspacioOpcion {
  codigo: string;
  nombre: string;
  bloque: string;
  capacidad: number;
}

/** Título provisional del borrador hasta que la persona escribe el objeto del evento (paso 3). */
export const TITULO_PROVISIONAL = "Solicitud en borrador";

const PASOS = ["Espacio y horario", "Servicios", "Datos del evento", "Identificación", "Resumen"];

/** Contexto que reciben los pasos. El borrador vive en el servidor: recargar la página no pierde nada. */
export interface ContextoAsistente {
  borrador: SolicitudDetalle | null;
  /** Crea el borrador si todavía no existe y devuelve su id. */
  asegurar: (asistentes: number) => Promise<string>;
  recargar: () => void;
}

export function Asistente({
  espacios,
  espacioInicial,
  borradorInicial,
  asistentesInicial,
}: {
  espacios: EspacioOpcion[];
  espacioInicial?: string;
  borradorInicial?: string;
  asistentesInicial?: number;
}) {
  const [borradorId, setBorradorId] = useState<string | undefined>(borradorInicial);
  const [paso, setPaso] = useState(0);
  const { resultado, recargar } = useConsulta(
    () => (borradorId ? obtenerSolicitud(borradorId) : Promise.resolve(null)),
    [borradorId ?? ""],
  );

  const asegurar = useCallback(
    async (asistentes: number) => {
      if (borradorId) return borradorId;
      const creada = await crearSolicitud({
        objetoEvento: TITULO_PROVISIONAL,
        asistentesEstimados: asistentes,
      });
      setBorradorId(creada.id);
      // El borrador queda en la dirección: si se recarga la página, se retoma.
      window.history.replaceState(null, "", `/solicitar?borrador=${creada.id}`);
      return creada.id;
    },
    [borradorId],
  );

  if (resultado.estado === "cargando") {
    return (
      <RegionCargando etiqueta="Cargando tu borrador">
        <Esqueleto className="h-72 w-full" />
      </RegionCargando>
    );
  }
  if (resultado.estado === "error") {
    return resultado.status === 404 ? (
      <Alerta tipo="error">
        No encontramos ese borrador. <Link href="/solicitar" className="underline">Empezar una solicitud nueva</Link>
      </Alerta>
    ) : (
      <EstadoError mensaje={resultado.mensaje} alReintentar={recargar} />
    );
  }

  const borrador = resultado.datos;
  if (borrador && borrador.estado !== "BORRADOR") {
    return (
      <Alerta tipo="info">
        <p className="font-medium">Esta solicitud ya se envió.</p>
        <Link href={`/mis-solicitudes/${borrador.id}`} className="underline underline-offset-4">
          Ver su estado
        </Link>
      </Alerta>
    );
  }

  const contexto: ContextoAsistente = { borrador, asegurar, recargar };
  const siguiente = () => setPaso((p) => Math.min(p + 1, PASOS.length - 1));
  const anterior = () => setPaso((p) => Math.max(p - 1, 0));

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Avance de la solicitud" className="flex flex-col gap-3">
        <ol className="grid grid-cols-5 gap-2">
          {PASOS.map((nombre, i) => (
            <li key={nombre} aria-current={i === paso ? "step" : undefined} className="flex flex-col gap-2">
              <span
                aria-hidden
                className={clsx(
                  "h-2 rounded-full transition-colors duration-500",
                  i < paso ? "bg-azul" : i === paso ? "bg-turquesa" : "bg-gris-claro/50",
                )}
              />
              <span
                className={clsx(
                  "hidden items-center gap-2 text-sm font-bold sm:flex",
                  i === paso ? "text-tinta" : i < paso ? "text-azul-oscuro" : "text-gris",
                )}
              >
                <span
                  aria-hidden
                  className={clsx(
                    "flex size-6 items-center justify-center rounded-full text-xs",
                    i < paso ? "bg-azul text-white" : i === paso ? "bg-tinta text-white" : "border border-gris-claro",
                  )}
                >
                  {i < paso ? <Check className="size-3.5" /> : i + 1}
                </span>
                {nombre}
              </span>
              <span className="sr-only sm:hidden">{nombre}</span>
            </li>
          ))}
        </ol>
        <p className="font-titulo text-2xl font-black text-tinta sm:text-3xl">
          <span className="text-turquesa">{paso + 1}.</span> {PASOS[paso]}
        </p>
      </nav>

      <p className="text-sm text-gris">
        Tu borrador se guarda solo. No se retiene el horario hasta que envíes la solicitud.
      </p>

      {paso === 0 && (
        <PasoHorario
          contexto={contexto}
          espacios={espacios}
          espacioInicial={espacioInicial}
          asistentesInicial={asistentesInicial}
          alContinuar={siguiente}
        />
      )}
      {paso === 1 && <PasoServicios contexto={contexto} alContinuar={siguiente} alVolver={anterior} />}
      {paso === 2 && <PasoEvento contexto={contexto} alContinuar={siguiente} alVolver={anterior} />}
      {paso === 3 && <PasoIdentificacion contexto={contexto} alContinuar={siguiente} alVolver={anterior} />}
      {paso === 4 && <PasoResumen contexto={contexto} alVolver={anterior} />}
    </div>
  );
}
