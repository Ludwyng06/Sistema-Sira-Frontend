"use client";

import { useState, type FormEvent } from "react";
import { CalendarioEspacio } from "@/components/CalendarioEspacio";
import { DialogoConfirmacion } from "@/components/DialogoConfirmacion";
import { Alerta, AreaTexto, Boton, Campo, CampoHora, Selector } from "@/components/formularios";
import {
  anularBloqueo,
  crearBloqueo,
  MOTIVOS_BLOQUEO,
  type BloqueoCreado,
  type MotivoBloqueo,
} from "@/lib/bloqueos";
import { resolverEspacioId } from "@/lib/espacio-id";
import { fecha, hora } from "@/lib/formato";
import { useConsulta } from "@/lib/useConsulta";
import { aInstanteUtc } from "@/lib/zona";
import { avisar } from "@/lib/avisos";

const REPETICIONES = [
  { valor: "", texto: "No se repite" },
  { valor: "FREQ=DAILY", texto: "Todos los días" },
  { valor: "FREQ=WEEKLY", texto: "Cada semana, el mismo día" },
];

const texto = (d: FormData, k: string) => String(d.get(k) ?? "").trim();

export function PantallaBloqueos({
  espacios,
}: {
  espacios: { codigo: string; nombre: string; bloque: string }[];
}) {
  const [codigo, setCodigo] = useState(espacios[0]?.codigo ?? "");
  const [creados, setCreados] = useState<BloqueoCreado[]>([]);
  const [anulando, setAnulando] = useState<BloqueoCreado | null>(null);
  const [version, setVersion] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const espacioId = useConsulta(() => resolverEspacioId(codigo), [codigo]);

  async function crear(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const d = new FormData(evento.currentTarget);
    setError(null);
    setAviso(null);
    if (espacioId.resultado.estado !== "listo" || !espacioId.resultado.datos) {
      return avisar.errorManual({ titulo: "No pudimos identificar el espacio", porQue: "La conexión con el servidor falló un momento al buscarlo.", queHacer: "Espera unos segundos e inténtalo de nuevo." });
    }
    const dia = texto(d, "dia");
    const repeticion = texto(d, "rrule");
    const hasta = texto(d, "repetirHasta");
    if (repeticion && !hasta) {
      return avisar.errorManual({
        titulo: "Falta la fecha final",
        porQue: "Un bloqueo que se repite necesita saber hasta cuándo.",
        queHacer: "Elige el día en “Repetir hasta el”.",
      });
    }
    setEnviando(true);
    try {
      const creado = await crearBloqueo({
        espacioId: espacioId.resultado.datos,
        motivo: texto(d, "motivo") as MotivoBloqueo,
        descripcion: texto(d, "descripcion") || undefined,
        etiquetaPublica: texto(d, "etiquetaPublica") || undefined,
        inicio: aInstanteUtc(dia, texto(d, "horaInicio")),
        fin: aInstanteUtc(dia, texto(d, "horaFin")),
        rrule: repeticion || undefined,
        repetirHasta: repeticion ? aInstanteUtc(hasta, "23:59") : undefined,
      });
      setCreados((previos) => [creado, ...previos]);
      avisar.exito(`Bloqueo creado: ${creado.franjasCreadas} ${creado.franjasCreadas === 1 ? "franja" : "franjas"}.`);
      setVersion((v) => v + 1);
    } catch (e) {
      // Un choque con una reserva responde 409 con el mensaje de la API.
      avisar.error(e, "No pudimos crear el bloqueo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-t1 font-black">Calendario y bloqueos</h1>
        <p className="max-w-prose text-gris">
          Bloquea un espacio por clases, mantenimiento u otros eventos. Los bloqueos quedan visibles como
          “Clase”, “Mantenimiento” u “Ocupado”, sin datos de personas.
        </p>
      </header>

      <Selector id="espacio" etiqueta="Espacio" value={codigo} onChange={(e) => setCodigo(e.target.value)} className="max-w-xl">
        {espacios.map((e) => (
          <option key={e.codigo} value={e.codigo}>
            {e.codigo} · {e.nombre} ({e.bloque})
          </option>
        ))}
      </Selector>

      {espacioId.resultado.estado === "listo" && espacioId.resultado.datos && (
        <CalendarioEspacio key={`${codigo}-${version}`} espacioId={espacioId.resultado.datos} />
      )}

      <form onSubmit={crear} className="flex flex-col gap-4 rounded-campo border border-gris-claro p-6">
        <h2 className="text-2xl font-bold">Nuevo bloqueo</h2>
        {error && <Alerta tipo="error">{error}</Alerta>}
        {aviso && <Alerta tipo="exito">{aviso}</Alerta>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Selector id="motivo" etiqueta="Motivo" required>
            {(Object.keys(MOTIVOS_BLOQUEO) as MotivoBloqueo[]).map((k) => (
              <option key={k} value={k}>
                {MOTIVOS_BLOQUEO[k]}
              </option>
            ))}
          </Selector>
          <Campo
            id="etiquetaPublica"
            etiqueta="Texto público (opcional)"
            ayuda="Lo ve el público en el calendario. Si lo dejas vacío dirá “Ocupado”."
            maxLength={120}
          />
          <Campo id="dia" etiqueta="Día (o primer día)" type="date" required />
          <div className="grid grid-cols-2 gap-4">
            <CampoHora id="horaInicio" etiqueta="Desde" defaultValue="08:00" required />
            <CampoHora id="horaFin" etiqueta="Hasta" defaultValue="10:00" required />
          </div>
          <Selector id="rrule" etiqueta="Repetición">
            {REPETICIONES.map((r) => (
              <option key={r.valor} value={r.valor}>
                {r.texto}
              </option>
            ))}
          </Selector>
          <Campo id="repetirHasta" etiqueta="Repetir hasta el" type="date" />
        </div>
        <AreaTexto id="descripcion" etiqueta="Descripción interna (opcional)" maxLength={300} />
        <Boton type="submit" cargando={enviando} className="w-fit">
          Crear bloqueo
        </Boton>
      </form>

      {creados.length > 0 && (
        <section aria-labelledby="titulo-creados" className="flex flex-col gap-3">
          <h2 id="titulo-creados" className="text-2xl font-bold">
            Bloqueos creados en esta sesión
          </h2>
          <ul className="divide-y divide-gris-claro rounded-campo border border-gris-claro">
            {creados.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <span>
                  {b.motivo} · {b.franjasCreadas} {b.franjasCreadas === 1 ? "franja" : "franjas"} · desde el{" "}
                  {fecha(b.inicio)} {hora(b.inicio)}
                </span>
                <Boton variante="secundario" onClick={() => setAnulando(b)}>
                  Anular
                </Boton>
              </li>
            ))}
          </ul>
        </section>
      )}

      <DialogoConfirmacion
        abierto={anulando !== null}
        titulo="¿Anular este bloqueo?"
        textoConfirmar="Anular bloqueo"
        variante="peligro"
        pedirMotivo
        etiquetaMotivo="Motivo de la anulación"
        alConfirmar={async (motivo) => {
          if (!anulando) return;
          const r = await anularBloqueo(anulando.id, motivo);
          setCreados((previos) => previos.filter((b) => b.id !== anulando.id));
          avisar.exito(`Bloqueo anulado: ${r.franjasLiberadas} franjas volvieron a quedar libres.`);
          setVersion((v) => v + 1);
        }}
        alCerrar={() => setAnulando(null)}
      >
        <p className="text-gris">Las franjas futuras de este bloqueo vuelven a quedar libres.</p>
      </DialogoConfirmacion>
    </div>
  );
}
