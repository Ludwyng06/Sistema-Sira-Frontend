"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Save } from "lucide-react";
import { Esqueleto, RegionCargando } from "@/components/Esqueleto";
import { EstadoError } from "@/components/EstadoError";
import { Alerta } from "@/components/formularios";
import { LineaMetro } from "@/components/LineaEstaciones";
import { useSesion } from "@/components/SesionProvider";
import { fecha, hora } from "@/lib/formato";
import { crearSolicitud, obtenerSolicitud, type SolicitudDetalle, type TipoDocumento } from "@/lib/solicitudes";
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
const PASO_IDENTIFICACION = 3;
const ESTACIONES = PASOS.map((nombre, i) => ({ clave: String(i), nombre }));

/** Contexto que reciben los pasos. El borrador vive en el servidor: recargar la página no pierde nada. */
export interface ContextoAsistente {
  borrador: SolicitudDetalle | null;
  /** Crea el borrador si todavía no existe y devuelve su id. */
  asegurar: (asistentes: number) => Promise<string>;
  recargar: () => void;
}

/**
 * Las cuentas de gestión (administración, aprobación, tesorería…) no tienen perfil de solicitante: el
 * backend les responde 422 PERFIL_INCOMPLETO al agregar un horario. Se les explica antes de que lo intenten.
 */
export function Asistente(props: Parameters<typeof AsistenteSolicitud>[0]) {
  const { estado, usuario, tieneRol } = useSesion();
  if (estado === "autenticado" && usuario && (usuario.perfil === null || !tieneRol("SOLICITANTE"))) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-t1 font-black">Solicitar un espacio</h1>
        <Alerta tipo="info" titulo="Tu cuenta no puede reservar espacios">
          <p>
            Ingresaste con una cuenta de gestión de SIRA ({usuario.correo}), que no tiene perfil de solicitante. Para
            reservar un espacio, ingresa con una cuenta de solicitante.
          </p>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            <Link href="/espacios" className="font-bold underline underline-offset-4">
              Volver a los espacios
            </Link>
            {tieneRol() && (
              <Link href="/panel" className="font-bold underline underline-offset-4">
                Ir al panel
              </Link>
            )}
          </p>
        </Alerta>
      </div>
    );
  }
  return <AsistenteSolicitud {...props} />;
}

function AsistenteSolicitud({
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
  // Tipo de documento con el que abre el paso de identificación (p. ej. "POLIZA" si el envío la exigió).
  const [tipoDocumentoInicial, setTipoDocumentoInicial] = useState<TipoDocumento | undefined>();
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
  const irAAdjuntarPoliza = () => {
    setTipoDocumentoInicial("POLIZA");
    setPaso(PASO_IDENTIFICACION);
  };
  // Si quien aprueba devolvió la solicitud, se muestra qué pidió corregir mientras se recorren los pasos.
  const ultimaDecision = borrador?.decisiones.at(-1);
  const devolucion = ultimaDecision?.resultado === "DEVUELTA" ? ultimaDecision : null;

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

      {devolucion && (
        <Alerta
          tipo="info"
          titulo="Solicitud devuelta para corregir"
          queHacer="Corrige lo que te pidieron en los pasos que correspondan y vuelve a enviarla desde el Resumen."
        >
          {devolucion.motivo && <p className="whitespace-pre-line">{devolucion.motivo}</p>}
          <p className="text-base text-gris">
            Devuelta el {fecha(devolucion.decididaEn)} a las {hora(devolucion.decididaEn)}
          </p>
        </Alerta>
      )}

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
      {paso === PASO_IDENTIFICACION && (
        <PasoIdentificacion
          contexto={contexto}
          alContinuar={siguiente}
          alVolver={anterior}
          tipoDocumentoInicial={tipoDocumentoInicial}
        />
      )}
      {paso === 4 && <PasoResumen contexto={contexto} alVolver={anterior} alIrAAdjuntarPoliza={irAAdjuntarPoliza} />}
    </div>
  );
}
