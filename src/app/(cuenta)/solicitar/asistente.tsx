"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Save } from "lucide-react";
import { Esqueleto, RegionCargando } from "@/components/Esqueleto";
import { EstadoError } from "@/components/EstadoError";
import { Alerta } from "@/components/formularios";
import { LineaMetro } from "@/components/LineaEstaciones";
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
const ESTACIONES = PASOS.map((nombre, i) => ({ clave: String(i), nombre }));

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
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-5">
        <nav aria-label="Avance de la solicitud">
          <LineaMetro estaciones={ESTACIONES} actual={paso} className="hidden sm:flex" />
          <LineaMetro estaciones={ESTACIONES} actual={paso} compacta className="sm:hidden" />
        </nav>
        <h1 className="text-t1 font-black">{PASOS[paso]}</h1>
        <p className="flex items-start gap-2 text-gris">
          <Save aria-hidden className="mt-0.5 size-5 shrink-0 text-azul" />
          Tu borrador se guarda solo. El horario no se retiene hasta que envíes la solicitud.
        </p>
      </header>

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
