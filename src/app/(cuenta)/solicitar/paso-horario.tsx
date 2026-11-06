"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarioEspacio } from "@/components/CalendarioEspacio";
import { IndicadorAforo } from "@/components/IndicadorAforo";
import { Alerta, Boton, Campo, CampoHora, Selector } from "@/components/formularios";
import { resolverCodigoPorId, resolverEspacioId } from "@/lib/espacio-id";
import { fecha, hora, pesos } from "@/lib/formato";
import { obtenerDisponibilidad } from "@/lib/disponibilidad";
import { avisoAnticipacion, motivoFueraDeReglas, opcionesHora, textoHorario } from "@/lib/horario";
import { SelectorFecha } from "@/components/SelectorFecha";
import { ErrorApi } from "@/lib/api";
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
  // Aviso de anticipación: solo aparece al intentar agregar, y se va al cambiar la franja.
  const [avisoAntic, setAvisoAntic] = useState<{ clave: string; texto: string } | null>(null);

  const personas = Number.parseInt(asistentes, 10);
  const personasValidas = Number.isFinite(personas) && personas > 0;

  const espacioId = useConsulta(() => resolverEspacioId(codigo), [codigo]);
  // Horario y anticipación del espacio (ayuda visual; el servidor valida). Ausentes = sin restricción.
  const idEspacio = espacioId.resultado.estado === "listo" ? espacioId.resultado.datos : null;
  const reglas = useConsulta(async () => {
    if (!idEspacio) return null;
    const ahora = new Date();
    const r = await obtenerDisponibilidad(
      idEspacio,
      ahora.toISOString(),
      new Date(ahora.getTime() + 86_400_000).toISOString(),
    );
    return { horarios: r.horarios ?? [], reservableDesde: r.reservableDesde };
  }, [idEspacio ?? ""]);
  const horarios = reglas.resultado.estado === "listo" ? reglas.resultado.datos?.horarios ?? [] : [];
  const reservableDesde = reglas.resultado.estado === "listo" ? reglas.resultado.datos?.reservableDesde : undefined;
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

  // Reglas del día elegido (ayuda visual; el servidor valida). Sin datos de horario = sin restricción.
  const hoy = partesBogota(new Date()).dia;
  const filaDeDia = (dia: string) =>
    horarios.length > 0 ? horarios.find((h) => h.diaSemana === new Date(`${dia}T12:00:00Z`).getUTCDay()) : undefined;
  /** Días que no se pueden escoger: cerrados por horario de operación y pasados. La anticipación se avisa al agregar. */
  const motivoDia = (dia: string): string | null =>
    horarios.length > 0 && !filaDeDia(dia) ? "Cerrado" : dia < hoy ? "Pasado" : null;
  const filaDia =
    franja.dia ? filaDeDia(franja.dia) : undefined;
  const avisoDia =
    franja.dia === ""
      ? null
      : horarios.length > 0 && !filaDia
        ? "El espacio no abre ese día. Elige otro día."
        : franja.dia < hoy
          ? "Ese día ya pasó. Elige otro día."
          : null;
  const diaValido = franja.dia !== "" && avisoDia === null;
  // Horas ofrecidas: solo las de operación de ese día.
  const horasDesde = filaDia ? opcionesHora(filaDia.abre, filaDia.cierra).slice(0, -1) : undefined;
  const horaInicio =
    horasDesde && horasDesde.length > 0 && !horasDesde.includes(franja.horaInicio) ? (horasDesde[0] as string) : franja.horaInicio;
  const horasHasta = filaDia ? opcionesHora(filaDia.abre, filaDia.cierra).filter((h) => h > horaInicio) : undefined;
  const horaFin =
    horasHasta && horasHasta.length > 0 && !horasHasta.includes(franja.horaFin)
      ? ((horasHasta.find((h) => h >= franja.horaFin) ?? horasHasta[Math.min(7, horasHasta.length - 1)]) as string)
      : franja.horaFin;

  const franjaCompleta = diaValido && horaInicio < horaFin;
  const seleccion = franjaCompleta
    ? {
        inicio: aInstanteUtc(franja.dia, horaInicio),
        fin: aInstanteUtc(franja.dia, horaFin),
      }
    : null;

  const motivo = seleccion ? motivoFueraDeReglas(seleccion.inicio, seleccion.fin, horarios) : null;

  const claveFranja = `${codigo}|${franja.dia}|${horaInicio}|${horaFin}`;
  const anticipacionVisible = avisoAntic && avisoAntic.clave === claveFranja ? avisoAntic.texto : null;
  const reglasTipo = ficha.resultado.estado === "listo" ? ficha.resultado.datos.reglasTipo : undefined;

  async function agregar() {
    setError(null);
    if (!personasValidas) {
      return avisar.errorManual({
        titulo: "Faltan las personas",
        porQue: "Con ese número vemos si el espacio tiene capacidad y avisamos si sobra demasiado.",
        queHacer: "Escribe cuántas personas van en el campo de arriba.",
      });
    }
    if (avisoDia) {
      return avisar.errorManual({ titulo: "Ese día no está disponible", porQue: avisoDia, queHacer: "Elige otro día." });
    }
    if (!seleccion) {
      return avisar.errorManual({
        titulo: "Falta completar el horario",
        porQue: "Cada horario necesita un día, una hora de inicio y una hora de fin posterior.",
        queHacer: "Elige el día y revisa que “Hasta” sea después de “Desde”.",
      });
    }
    if (motivo) {
      return avisar.errorManual({
        titulo: "Ese horario no es posible",
        porQue: motivo,
        queHacer: "Elige otro día u otra hora.",
      });
    }
    const antic = avisoAnticipacion(
      seleccion.inicio,
      reservableDesde,
      reglasTipo?.anticipacionMinimaDias,
      reglasTipo?.anticipacionEnHabiles,
    );
    if (antic) {
      setAvisoAntic({ clave: claveFranja, texto: antic });
      return;
    }
    setAvisoAntic(null);
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
      if (e instanceof ErrorApi && e.codigo === "ANTICIPACION_INSUFICIENTE") {
        setAvisoAntic({
          clave: claveFranja,
          texto:
            avisoAnticipacion(
              seleccion.inicio,
              reservableDesde ?? seleccion.fin,
              reglasTipo?.anticipacionMinimaDias,
              reglasTipo?.anticipacionEnHabiles,
            ) ?? `No puedes continuar con esta reserva: ${e.message}`,
        });
      } else {
        avisar.error(e, "No pudimos agregar el horario. Intenta de nuevo.");
      }
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

  const hayHorarios = Boolean(borrador && borrador.reservas.length > 0);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,25rem)_minmax(0,1fr)] lg:items-start">
      {/* Columna del formulario: lo estándar, en orden de uso */}
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <Selector id="espacio" etiqueta="Espacio" value={codigo} onChange={(e) => setCodigo(e.target.value)}>
            {espacios.map((e) => (
              <option key={e.codigo} value={e.codigo}>
                {e.codigo} · {e.nombre} ({e.bloque})
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
          {ficha.resultado.estado === "listo" && (
            <div className="flex flex-col gap-2 rounded-tarjeta border border-gris-claro/60 bg-fondo-suave p-4">
              <IndicadorAforo capacidad={ficha.resultado.datos.capacidadPersonas} aforo={aforo} />
              <p className="text-gris">
                Se pide con al menos {ficha.resultado.datos.reglasTipo.anticipacionMinimaDias}{" "}
                {ficha.resultado.datos.reglasTipo.anticipacionEnHabiles ? "días hábiles" : "días"} de anticipación.
              </p>
              {noCabe && (
                <p>
                  No caben {personas} personas en este espacio.{" "}
                  <Link
                    href={`/?asistentes=${personas}`}
                    className="inline-flex min-h-11 items-center font-bold text-azul-oscuro underline underline-offset-4"
                  >
                    Ver espacios donde sí caben
                  </Link>
                </p>
              )}
            </div>
          )}
        </div>

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-1 text-xl font-extrabold text-tinta">¿Cuándo?</legend>
          <SelectorFecha
            id="dia"
            etiqueta="Día"
            value={franja.dia}
            onChange={(dia) => setFranja({ ...franja, dia })}
            motivoDeshabilitado={motivoDia}
          />
          <div className="grid grid-cols-2 gap-4">
            <CampoHora
              id="horaInicio"
              etiqueta="Desde"
              value={horaInicio}
              horas={horasDesde}
              disabled={franja.dia !== "" && !diaValido}
              onChange={(e) => setFranja({ ...franja, horaInicio: e.target.value })}
            />
            <CampoHora
              id="horaFin"
              etiqueta="Hasta"
              value={horaFin}
              horas={horasHasta}
              disabled={franja.dia !== "" && !diaValido}
              onChange={(e) => setFranja({ ...franja, horaFin: e.target.value })}
            />
          </div>
          {horarios.length > 0 && (
            <p className="text-gris">
              <span className="font-bold text-tinta">Horario del espacio:</span> {textoHorario(horarios)}
            </p>
          )}
          {(avisoDia || motivo) && <Alerta tipo="error">{avisoDia ?? motivo}</Alerta>}
          <p className="text-gris">También puedes tocar o arrastrar sobre el calendario.</p>
          {error && <Alerta tipo="error">{error}</Alerta>}
          <Boton
            onClick={agregar}
            cargando={agregando}
            disabled={noCabe}
            variante={hayHorarios ? "secundario" : "primario"}
          >
            Agregar este horario
          </Boton>
          {anticipacionVisible && <Alerta tipo="error">{anticipacionVisible}</Alerta>}
        </fieldset>

        <section aria-labelledby="titulo-agregados" className="flex flex-col gap-3">
          <h2 id="titulo-agregados" className="text-xl font-extrabold">
            Horarios de tu solicitud
          </h2>
          {!borrador || borrador.reservas.length === 0 ? (
            <p className="text-gris">Todavía no has agregado horarios.</p>
          ) : (
            <ul className="divide-y divide-gris-claro/60 rounded-tarjeta border border-gris-claro/60">
              {borrador.reservas.map((r, i) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <span className="flex flex-col">
                    <span className="font-bold text-tinta">
                      {codigos.resultado.estado === "listo" ? codigos.resultado.datos[i] ?? "Espacio" : "Espacio"}
                      {" · "}
                      {fecha(r.inicio)}
                    </span>
                    <span className="text-gris">
                      {hora(r.inicio)} a {hora(r.fin)} · estimado {pesos(r.subtotal)}
                    </span>
                  </span>
                  <Boton variante="secundario" onClick={() => quitar(r.id)}>
                    Quitar
                  </Boton>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="sticky bottom-3 z-20 lg:static">
          <Boton onClick={alContinuar} disabled={!hayHorarios} className="w-full shadow-elevada lg:shadow-boton">
            Continuar a servicios
          </Boton>
        </div>
      </div>

      {/* Columna del calendario: queda a la vista mientras se completa el formulario */}
      <section aria-labelledby="titulo-franja" className="flex flex-col gap-3 lg:sticky lg:top-4">
        <h2 id="titulo-franja" className="text-xl font-extrabold">
          Calendario del espacio
        </h2>
        {espacioId.resultado.estado === "listo" && espacioId.resultado.datos ? (
          <CalendarioEspacio
            espacioId={espacioId.resultado.datos}
            seleccion={seleccion}
            restringirAHorario
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
      </section>
    </div>
  );
}
