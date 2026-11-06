"use client";

import Link from "next/link";
import { useState } from "react";
import { Alerta, Boton } from "@/components/formularios";
import { ErrorApi } from "@/lib/api";
import { resolverCodigoPorId } from "@/lib/espacio-id";
import { fecha, hora, pesos } from "@/lib/formato";
import { enviarSolicitud, type SolicitudEnviada } from "@/lib/solicitudes";
import { useConsulta } from "@/lib/useConsulta";
import type { ContextoAsistente } from "./asistente";
import { avisar } from "@/lib/avisos";

interface Problema {
  codigo: string;
  mensaje: string;
}
interface Conflicto {
  espacioId: string | null;
  inicio: string;
  fin: string;
}
interface Sugerencia {
  reservaId: string;
  espacios: { codigo: string; nombre: string; capacidadPersonas: number }[];
}

/** Paso 5: resumen y envío. Los valores son estimados: la cotización la emite el servidor. */
export function PasoResumen({
  contexto,
  alVolver,
}: {
  contexto: ContextoAsistente;
  alVolver: () => void;
}) {
  const { borrador } = contexto;
  const [acepta, setAcepta] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [problemas, setProblemas] = useState<Problema[]>([]);
  const [conflictos, setConflictos] = useState<Conflicto[]>([]);
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([]);
  const [enviada, setEnviada] = useState<SolicitudEnviada | null>(null);

  const ids = (borrador?.reservas ?? []).map((r) => r.espacioId);
  const codigos = useConsulta(
    () => Promise.all(ids.map((id) => resolverCodigoPorId(id))),
    [ids.join(",")],
  );

  if (!borrador) return null;
  const id = borrador.id;

  async function enviar() {
    setEnviando(true);
    setError(null);
    setProblemas([]);
    setConflictos([]);
    setSugerencias([]);
    try {
      setEnviada(await enviarSolicitud(id));
    } catch (e) {
      if (e instanceof ErrorApi) {
        setError(e.message);
        const detalles = e.detalles as
          | { problemas?: Problema[]; conflictos?: Conflicto[]; sugerencias?: Sugerencia[] }
          | undefined;
        setProblemas(detalles?.problemas ?? []);
        setConflictos(detalles?.conflictos ?? []);
        setSugerencias(detalles?.sugerencias ?? []);
        avisar.error(e, "No pudimos enviar la solicitud. Intenta de nuevo.");
      } else {
        avisar.error(e, "No pudimos enviar la solicitud. Intenta de nuevo.");
      }
      setEnviando(false);
    }
  }

  if (enviada) {
    return (
      <div className="flex flex-col gap-4">
        <Alerta tipo="exito">
          <p className="text-lg font-bold">Solicitud enviada</p>
          <p>
            Tu número es <strong>{enviada.consecutivo}</strong>. Quedó en revisión y el horario está
            retenido mientras se decide.
          </p>
          {enviada.esExenta && <p>Es de uso institucional: no tiene costo si se aprueba.</p>}
        </Alerta>
        {enviada.advertencias.map((a) => (
          <Alerta key={a.reservaId + a.codigo} tipo="info">
            <p>{a.mensaje}</p>
            {a.sugerencias.length > 0 && (
              <ul className="mt-1 list-disc pl-5">
                {a.sugerencias.map((s) => (
                  <li key={s.codigo}>
                    <Link href={`/espacios/${s.codigo}`} className="underline underline-offset-4">
                      {s.codigo} · {s.nombre}
                    </Link>{" "}
                    ({s.capacidadPersonas} personas)
                  </li>
                ))}
              </ul>
            )}
          </Alerta>
        ))}
        <Link
          href={`/mis-solicitudes/${enviada.id}`}
          className="w-fit rounded-campo bg-azul px-5 py-3 font-bold text-white shadow-[0_2px_0_0_var(--color-azul-oscuro)] transition duration-200 hover:-translate-y-px hover:bg-azul-oscuro motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        >
          Ver mi solicitud
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="titulo-resumen" className="flex flex-col gap-3">
        <h2 id="titulo-resumen" className="text-xl font-bold">
          {borrador.objetoEvento}
        </h2>
        <p className="text-gris">
          {borrador.asistentesEstimados} personas ·{" "}
          {borrador.eventoPublico ? "evento público" : "evento privado"}
        </p>
        <ul className="divide-y divide-gris-claro rounded-campo border border-gris-claro">
          {borrador.reservas.map((r, i) => (
            <li key={r.id} className="flex flex-wrap justify-between gap-2 px-4 py-2">
              <span>
                <span className="font-bold">
                  {codigos.resultado.estado === "listo" ? codigos.resultado.datos[i] ?? "Espacio" : "Espacio"}
                </span>{" "}
                · {fecha(r.inicio)} · {hora(r.inicio)} a {hora(r.fin)}
              </span>
              <span>{pesos(r.subtotal)}</span>
            </li>
          ))}
          {borrador.servicios.map((s) => (
            <li key={s.id} className="flex flex-wrap justify-between gap-2 px-4 py-2">
              <span>
                {s.cantidad} × {s.nombre}
              </span>
              <span>{pesos(s.subtotal)}</span>
            </li>
          ))}
        </ul>
        <p className="text-base text-gris">
          Son valores estimados con el tarifario. El valor definitivo, o el valor de referencia si tu uso
          es institucional, lo confirma la cotización.
        </p>
      </section>

      {error && (
        <Alerta tipo="error">
          <p className="font-medium">{error}</p>
          {problemas.length > 0 && (
            <ul className="mt-1 list-disc pl-5">
              {problemas.map((p) => (
                <li key={p.codigo}>{p.mensaje}</li>
              ))}
            </ul>
          )}
          {conflictos.length > 0 && (
            <ul className="mt-1 list-disc pl-5">
              {conflictos.map((c, i) => (
                <li key={i}>
                  Ocupado el {fecha(c.inicio)} de {hora(c.inicio)} a {hora(c.fin)}
                </li>
              ))}
            </ul>
          )}
          {sugerencias.flatMap((s) => s.espacios).length > 0 && (
            <>
              <p className="mt-2 font-medium">Espacios libres en ese horario:</p>
              <ul className="list-disc pl-5">
                {sugerencias
                  .flatMap((s) => s.espacios)
                  .map((e) => (
                    <li key={e.codigo}>
                      <Link href={`/espacios/${e.codigo}`} className="underline underline-offset-4">
                        {e.codigo} · {e.nombre}
                      </Link>{" "}
                      ({e.capacidadPersonas} personas)
                    </li>
                  ))}
              </ul>
            </>
          )}
        </Alerta>
      )}

      <label className="flex min-h-11 items-start gap-2">
        <input
          type="checkbox"
          checked={acepta}
          onChange={(e) => setAcepta(e.target.checked)}
          className="mt-2.5 size-6"
        />
        <span>
          Entiendo que el horario se retiene al enviar, que la solicitud pasa por revisión y que puedo
          cancelarla desde “Mis solicitudes” según la política de cancelación.
        </span>
      </label>

      <div className="flex flex-wrap justify-between gap-3">
        <Boton variante="secundario" onClick={alVolver}>
          Atrás
        </Boton>
        <Boton onClick={enviar} cargando={enviando} disabled={!acepta}>
          Enviar solicitud
        </Boton>
      </div>
    </div>
  );
}
