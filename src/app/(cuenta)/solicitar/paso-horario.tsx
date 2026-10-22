"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarioEspacio } from "@/components/CalendarioEspacio";
import { IndicadorAforo } from "@/components/IndicadorAforo";
import { Alerta, Boton, Campo, CampoHora, Selector } from "@/components/formularios";
import { resolverCodigoPorId, resolverEspacioId } from "@/lib/espacio-id";
import { fecha, hora, pesos } from "@/lib/formato";
import { obtenerEspacio } from "@/lib/inventario";
import { agregarReserva, quitarReserva } from "@/lib/solicitudes";
import { useConsulta } from "@/lib/useConsulta";
import { aInstanteUtc, partesBogota } from "@/lib/zona";
import type { ContextoAsistente, EspacioOpcion } from "./asistente";
import { avisar } from "@/lib/avisos";

interface Franja {
  dia: string;
  horaInicio: string;
  horaFin: string;
}

/** Paso 1: espacio, número de personas y franjas (clic o arrastre en el calendario, o escribiéndolas). */
export function PasoHorario({
  contexto,
  espacios,
  espacioInicial,
  asistentesInicial,
  alContinuar,
}: {
  contexto: ContextoAsistente;
  espacios: EspacioOpcion[];
  espacioInicial?: string;
  asistentesInicial?: number;
  alContinuar: () => void;
}) {
  const { borrador, asegurar, recargar } = contexto;
  const [codigo, setCodigo] = useState(
    espacios.some((e) => e.codigo === espacioInicial) ? (espacioInicial as string) : espacios[0]?.codigo ?? "",
  );
  const [asistentes, setAsistentes] = useState(
    String(borrador?.asistentesEstimados ?? asistentesInicial ?? ""),
  );
  const [franja, setFranja] = useState<Franja>({ dia: "", horaInicio: "08:00", horaFin: "10:00" });
  const [error, setError] = useState<string | null>(null);
  const [agregando, setAgregando] = useState(false);

  const personas = Number.parseInt(asistentes, 10);
  const personasValidas = Number.isFinite(personas) && personas > 0;

  const espacioId = useConsulta(() => resolverEspacioId(codigo), [codigo]);
  const ficha = useConsulta(
    () => obtenerEspacio(codigo, personasValidas ? personas : undefined),
    [codigo, personasValidas ? personas : 0],
  );
  const idsReservas = (borrador?.reservas ?? []).map((r) => r.espacioId);
  const codigos = useConsulta(
    () => Promise.all(idsReservas.map((id) => resolverCodigoPorId(id))),
    [idsReservas.join(",")],
  );

  const aforo = ficha.resultado.estado === "listo" ? ficha.resultado.datos.aforo : undefined;
  const noCabe = aforo?.nivel === "NO_CABE";
  const franjaCompleta = franja.dia !== "" && franja.horaInicio < franja.horaFin;
  const seleccion = franjaCompleta
    ? {
        inicio: aInstanteUtc(franja.dia, franja.horaInicio),
        fin: aInstanteUtc(franja.dia, franja.horaFin),
      }
    : null;

  async function agregar() {
    setError(null);
    if (!personasValidas) {
      return avisar.errorManual({
        titulo: "Faltan las personas",
        porQue: "Con ese número vemos si el espacio tiene capacidad y avisamos si sobra demasiado.",
        queHacer: "Escribe cuántas personas van en el campo de arriba.",
      });
    }
    if (!seleccion) {
      return avisar.errorManual({
        titulo: "Falta completar el horario",
        porQue: "Cada horario necesita un día, una hora de inicio y una hora de fin posterior.",
        queHacer: "Elige el día y revisa que “Hasta” sea después de “Desde”.",
      });
    }
    if (espacioId.resultado.estado !== "listo" || !espacioId.resultado.datos) {
      return avisar.errorManual({ titulo: "No pudimos identificar el espacio", porQue: "La conexión con el servidor falló un momento al buscarlo.", queHacer: "Espera unos segundos e inténtalo de nuevo." });
    }
    setAgregando(true);
    try {
      const id = await asegurar(personas);
      await agregarReserva(id, espacioId.resultado.datos, seleccion.inicio, seleccion.fin);
      recargar();
      setFranja((f) => ({ ...f, dia: "" }));
      avisar.exito("Horario agregado", "Quedó en tu borrador. El espacio se retiene cuando envíes la solicitud, no antes.");
    } catch (e) {
      avisar.error(e, "No pudimos agregar el horario. Intenta de nuevo.");
    } finally {
      setAgregando(false);
    }
  }

  async function quitar(itemId: string) {
    if (!borrador) return;
    setError(null);
    try {
      await quitarReserva(borrador.id, itemId);
      recargar();
    } catch (e) {
      avisar.error(e, "No pudimos quitar el horario.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Selector id="espacio" etiqueta="Espacio" value={codigo} onChange={(e) => setCodigo(e.target.value)}>
          {espacios.map((e) => (
            <option key={e.codigo} value={e.codigo}>
              {e.codigo} · {e.nombre} ({e.bloque}, {e.capacidad} personas)
            </option>
          ))}
        </Selector>
        <Campo
          id="asistentes"
          etiqueta="¿Para cuántas personas es?"
          type="number"
          min={1}
          inputMode="numeric"
          value={asistentes}
          onChange={(e) => setAsistentes(e.target.value)}
          disabled={Boolean(borrador)}
          ayuda={borrador ? "Puedes cambiarlo en el paso 3." : undefined}
        />
      </div>

      {ficha.resultado.estado === "listo" && (
        <div className="flex flex-col gap-2 rounded-lg border border-gris-claro p-4">
          <IndicadorAforo capacidad={ficha.resultado.datos.capacidadPersonas} aforo={aforo} />
          <p className="text-sm text-gris">
            Este tipo de espacio se pide con al menos{" "}
            {ficha.resultado.datos.reglasTipo.anticipacionMinimaDias}{" "}
            {ficha.resultado.datos.reglasTipo.anticipacionEnHabiles ? "días hábiles" : "días"} de anticipación.
          </p>
          {noCabe && (
            <p>
              Ese espacio no tiene capacidad para {personas} personas.{" "}
              <Link
                href={`/?asistentes=${personas}`}
                className="font-medium text-azul-oscuro underline underline-offset-4"
              >
                Ver espacios donde sí caben
              </Link>
            </p>
          )}
        </div>
      )}

      <section aria-labelledby="titulo-franja" className="flex flex-col gap-3">
        <h2 id="titulo-franja" className="text-xl font-bold">
          Elige el horario
        </h2>
        {espacioId.resultado.estado === "listo" && espacioId.resultado.datos ? (
          <CalendarioEspacio
            espacioId={espacioId.resultado.datos}
            seleccion={seleccion}
            onSeleccion={(s) => {
              const ini = partesBogota(s.inicio);
              const fin = partesBogota(s.fin);
              setFranja({ dia: ini.dia, horaInicio: ini.hora, horaFin: ini.dia === fin.dia ? fin.hora : "23:59" });
            }}
          />
        ) : espacioId.resultado.estado === "cargando" ? (
          <p className="text-gris">Cargando el calendario…</p>
        ) : (
          <Alerta tipo="error">No pudimos cargar el calendario de este espacio.</Alerta>
        )}
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo
            id="dia"
            etiqueta="Día"
            type="date"
            value={franja.dia}
            onChange={(e) => setFranja({ ...franja, dia: e.target.value })}
          />
          <CampoHora
            id="horaInicio"
            etiqueta="Desde"
            value={franja.horaInicio}
            onChange={(e) => setFranja({ ...franja, horaInicio: e.target.value })}
          />
          <CampoHora
            id="horaFin"
            etiqueta="Hasta"
            value={franja.horaFin}
            onChange={(e) => setFranja({ ...franja, horaFin: e.target.value })}
          />
        </div>
        {error && <Alerta tipo="error">{error}</Alerta>}
        <Boton onClick={agregar} cargando={agregando} disabled={noCabe} className="w-fit">
          Agregar este horario
        </Boton>
      </section>

      <section aria-labelledby="titulo-agregados" className="flex flex-col gap-3">
        <h2 id="titulo-agregados" className="text-xl font-bold">
          Horarios de tu solicitud
        </h2>
        {!borrador || borrador.reservas.length === 0 ? (
          <p className="text-gris">Todavía no has agregado horarios.</p>
        ) : (
          <ul className="divide-y divide-gris-claro rounded-lg border border-gris-claro">
            {borrador.reservas.map((r, i) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <span>
                  <span className="font-bold">
                    {codigos.resultado.estado === "listo" ? codigos.resultado.datos[i] ?? "Espacio" : "Espacio"}
                  </span>
                  {" · "}
                  {fecha(r.inicio)} · {hora(r.inicio)} a {hora(r.fin)}
                  <span className="block text-sm text-gris">Valor estimado: {pesos(r.subtotal)}</span>
                </span>
                <Boton variante="secundario" onClick={() => quitar(r.id)}>
                  Quitar
                </Boton>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex justify-end">
        <Boton onClick={alContinuar} disabled={!borrador || borrador.reservas.length === 0}>
          Continuar a servicios
        </Boton>
      </div>
    </div>
  );
}
