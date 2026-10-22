"use client";

import { useState, type FormEvent } from "react";
import { Alerta, Boton, Campo, CampoHora, Selector } from "@/components/formularios";
import { ErrorApi } from "@/lib/api";
import { calcularTarifa, type CalcularTarifa, type TarifaCalculada } from "@/lib/disponibilidad";
import { resolverEspacioId } from "@/lib/espacio-id";
import { fecha, pesos } from "@/lib/formato";
import { aInstanteUtc } from "@/lib/zona";

const SOLICITANTES = [
  { valor: "PERSONA_NATURAL", texto: "Persona natural" },
  { valor: "EMPRESA", texto: "Empresa" },
  { valor: "ENTIDAD", texto: "Entidad" },
] as const;

const UNIDADES: Record<string, string> = {
  HORA: "hora",
  JORNADA_MANANA: "jornada de la mañana",
  JORNADA_TARDE: "jornada de la tarde",
  JORNADA_NOCHE: "jornada de la noche",
  DIA: "día",
  JORNADAS: "jornadas",
};

const RECARGOS: Record<string, string> = {
  NOCTURNO: "Recargo nocturno",
  DOMINICAL: "Recargo dominical",
  FESTIVO: "Recargo por festivo",
};

export function FormularioSimulador({
  espacios,
}: {
  espacios: { codigo: string; nombre: string; bloque: string }[];
}) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<TarifaCalculada | null>(null);

  async function calcular(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const d = new FormData(evento.currentTarget);
    setEnviando(true);
    setError(null);
    setResultado(null);
    try {
      const codigo = String(d.get("espacio"));
      const espacioId = await resolverEspacioId(codigo);
      if (!espacioId) {
        setError("No pudimos identificar el espacio. Intenta de nuevo en unos minutos.");
        return;
      }
      const dia = String(d.get("dia"));
      setResultado(
        await calcularTarifa({
          espacioId,
          tipoSolicitante: String(d.get("tipoSolicitante")) as CalcularTarifa["tipoSolicitante"],
          inicio: aInstanteUtc(dia, String(d.get("horaInicio"))),
          fin: aInstanteUtc(dia, String(d.get("horaFin"))),
        }),
      );
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : "No pudimos calcular la tarifa. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form onSubmit={calcular} className="flex flex-col gap-4 rounded-lg border border-gris-claro p-6">
        <Selector id="espacio" etiqueta="Espacio" required>
          {espacios.map((e) => (
            <option key={e.codigo} value={e.codigo}>
              {e.codigo} · {e.nombre} ({e.bloque})
            </option>
          ))}
        </Selector>
        <Selector id="tipoSolicitante" etiqueta="¿Quién alquila?" required>
          {SOLICITANTES.map((s) => (
            <option key={s.valor} value={s.valor}>
              {s.texto}
            </option>
          ))}
        </Selector>
        <Campo id="dia" etiqueta="Día del evento" type="date" required />
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoHora id="horaInicio" etiqueta="Desde" defaultValue="08:00" required />
          <CampoHora id="horaFin" etiqueta="Hasta" defaultValue="12:00" required />
        </div>
        {error && <Alerta tipo="error">{error}</Alerta>}
        <Boton type="submit" cargando={enviando}>
          {enviando ? "Calculando…" : "Calcular tarifa"}
        </Boton>
      </form>

      <section aria-live="polite" aria-labelledby="titulo-resultado" className="flex flex-col gap-4">
        <h2 id="titulo-resultado" className="text-2xl font-bold">
          Estimado
        </h2>
        {!resultado ? (
          <p className="rounded-lg border border-dashed border-gris-claro bg-fondo-suave p-6 text-gris">
            Llena el formulario y verás aquí el desglose.
          </p>
        ) : (
          <>
            <ul className="flex flex-col gap-3">
              {resultado.lineas.map((l) => (
                <li key={l.fecha} className="rounded-lg border border-gris-claro p-4">
                  <p className="font-bold">{fecha(`${l.fecha}T12:00:00-05:00`)}</p>
                  <p className="text-gris">
                    {l.cantidad} × {UNIDADES[l.unidad] ?? l.unidad.toLowerCase()} ({l.horas} h) ·{" "}
                    {pesos(l.base)}
                  </p>
                  {l.recargos.map((r) => (
                    <p key={r.tipo} className="text-sm text-gris">
                      {RECARGOS[r.tipo] ?? r.tipo} ({r.porcentaje} %): {pesos(r.valor)}
                    </p>
                  ))}
                </li>
              ))}
            </ul>
            <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 rounded-lg border border-gris-claro p-4">
              <dt>Base</dt>
              <dd className="text-right">{pesos(resultado.base)}</dd>
              <dt>Recargos</dt>
              <dd className="text-right">{pesos(resultado.recargos)}</dd>
              <dt>IVA</dt>
              <dd className="text-right">{pesos(resultado.iva)}</dd>
              <dt className="border-t border-gris-claro pt-1 font-bold">Total estimado</dt>
              <dd className="border-t border-gris-claro pt-1 text-right text-xl font-bold">
                {pesos(resultado.total)}
              </dd>
            </dl>
            <p className="text-sm text-gris">El valor definitivo se confirma en la cotización.</p>
          </>
        )}
      </section>
    </div>
  );
}
