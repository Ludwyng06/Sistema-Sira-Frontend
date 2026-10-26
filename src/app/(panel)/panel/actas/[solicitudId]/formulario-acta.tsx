"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ChevronLeft } from "lucide-react";
import { Esqueleto, RegionCargando } from "@/components/Esqueleto";
import { EstadoError } from "@/components/EstadoError";
import { Alerta, AreaTexto, Boton, Campo, Selector } from "@/components/formularios";
import {
  crearActa,
  descargarActaPdf,
  ESTADOS_FISICOS,
  listarElementosDeEspacio,
  TRATAMIENTOS,
  type Acta,
  type ElementoAdmin,
  type EstadoFisico,
  type NovedadEntrada,
  type TipoActa,
  type Tratamiento,
} from "@/lib/actas";
import { obtenerSolicitud } from "@/lib/solicitudes";
import { useConsulta } from "@/lib/useConsulta";
import { avisar } from "@/lib/avisos";

interface FilaChecklist {
  cantidadEncontrada: string;
  estadoFisico: EstadoFisico;
}

interface FilaNovedad {
  clave: number;
  elementoId: string;
  descripcion: string;
  valorDano: string;
  tratamiento: Tratamiento;
}

async function cargar(solicitudId: string) {
  const solicitud = await obtenerSolicitud(solicitudId);
  const espacios = [...new Set(solicitud.reservas.map((r) => r.espacioId))];
  const paginas = await Promise.all(espacios.map((id) => listarElementosDeEspacio(id)));
  return { solicitud, elementos: paginas.flatMap((p) => p.datos) };
}

/** Pensado para celular: una columna, controles grandes, todo a 360 px. */
export function FormularioActa({
  solicitudId,
  tipo,
}: {
  solicitudId: string;
  tipo: TipoActa;
}) {
  const { resultado, recargar } = useConsulta(() => cargar(solicitudId), [solicitudId]);
  const titulo = tipo === "ENTREGA" ? "Acta de entrega" : "Acta de devolución";

  const volver = (
    <Link
      href="/panel/actas"
      className="inline-flex w-fit items-center gap-1 text-azul-oscuro underline underline-offset-4"
    >
      <ChevronLeft aria-hidden className="size-4" />
      Volver a las actas
    </Link>
  );

  if (resultado.estado === "cargando") {
    return (
      <RegionCargando etiqueta="Cargando el acta">
        <div className="flex flex-col gap-3">
          <Esqueleto className="h-8 w-56" />
          <Esqueleto className="h-24 w-full" />
          <Esqueleto className="h-24 w-full" />
        </div>
      </RegionCargando>
    );
  }
  if (resultado.estado === "error") {
    return (
      <div className="flex flex-col gap-4">
        {volver}
        <EstadoError mensaje={resultado.mensaje} alReintentar={recargar} />
      </div>
    );
  }

  const { solicitud, elementos } = resultado.datos;
  return (
    <div className="flex flex-col gap-6">
      {volver}
      <header className="flex flex-col gap-1">
        <h1 className="text-4xl font-black sm:text-5xl">{titulo}</h1>
        <p className="text-gris">
          {solicitud.consecutivo} · {solicitud.objetoEvento}
        </p>
      </header>
      <CuerpoActa solicitudId={solicitudId} tipo={tipo} elementos={elementos} />
    </div>
  );
}

function CuerpoActa({
  solicitudId,
  tipo,
  elementos,
}: {
  solicitudId: string;
  tipo: TipoActa;
  elementos: ElementoAdmin[];
}) {
  const [filas, setFilas] = useState<Record<string, FilaChecklist>>(() =>
    Object.fromEntries(
      elementos.map((e) => [e.id, { cantidadEncontrada: String(e.cantidad), estadoFisico: e.estadoFisico }]),
    ),
  );
  const [novedades, setNovedades] = useState<FilaNovedad[]>([]);
  const [observaciones, setObservaciones] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acta, setActa] = useState<Acta | null>(null);

  function cambiarFila(id: string, cambio: Partial<FilaChecklist>) {
    setFilas((previas) => ({ ...previas, [id]: { ...previas[id]!, ...cambio } }));
  }

  function agregarNovedad() {
    setNovedades((previas) => [
      ...previas,
      {
        clave: Date.now() + previas.length,
        elementoId: "",
        descripcion: "",
        valorDano: "0",
        tratamiento: "SIN_COBRO",
      },
    ]);
  }

  function cambiarNovedad(clave: number, cambio: Partial<FilaNovedad>) {
    setNovedades((previas) => previas.map((n) => (n.clave === clave ? { ...n, ...cambio } : n)));
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const creada = await crearActa({
        solicitudId,
        tipo,
        checklist: elementos.map((e) => ({
          elementoId: e.id,
          cantidadEncontrada: Number(filas[e.id]?.cantidadEncontrada ?? 0),
          estadoFisico: filas[e.id]?.estadoFisico ?? "BUENO",
        })),
        observaciones: observaciones.trim() || undefined,
        novedades: novedades.map<NovedadEntrada>((n) => ({
          elementoId: n.elementoId || undefined,
          descripcion: n.descripcion.trim(),
          valorDano: Number(n.valorDano) || 0,
          tratamiento: n.tratamiento,
        })),
      });
      setActa(creada);
    } catch (e) {
      avisar.error(e, "No pudimos guardar el acta. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  async function abrirPdf() {
    if (!acta) return;
    try {
      const archivo = await descargarActaPdf(acta.id);
      const url = URL.createObjectURL(archivo);
      window.open(url, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      avisar.error(e, "No pudimos abrir el PDF.");
    }
  }

  if (acta) {
    return (
      <div className="flex flex-col gap-4">
        <Alerta tipo="exito">
          <p className="font-medium">Acta {acta.consecutivo} guardada.</p>
          <p>
            {tipo === "ENTREGA"
              ? "La solicitud quedó en uso."
              : "La solicitud quedó finalizada."}
          </p>
        </Alerta>
        {error && <Alerta tipo="error">{error}</Alerta>}
        <div className="flex flex-wrap gap-3">
          <Boton onClick={abrirPdf}>Abrir el PDF</Boton>
          <Link
            href="/panel/actas"
            className="inline-flex items-center rounded-campo border-2 border-azul px-4 py-2 font-bold text-azul-oscuro hover:bg-turquesa-suave"
          >
            Volver a las actas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-8">
      {error && <Alerta tipo="error">{error}</Alerta>}

      <section aria-labelledby="titulo-checklist" className="flex flex-col gap-3">
        <h2 id="titulo-checklist" className="text-2xl font-bold">
          Elementos
        </h2>
        {elementos.length === 0 ? (
          <p className="text-gris">Los espacios de esta solicitud no tienen elementos en servicio.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {elementos.map((e) => (
              <li key={e.id} className="flex flex-col gap-3 rounded-campo border border-gris-claro p-4">
                <p className="font-bold">
                  {e.nombre}{" "}
                  <span className="font-normal text-gris">
                    · {e.espacioCodigo} · esperado: {e.cantidad} {e.unidad}
                  </span>
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Campo
                    id={`cantidad-${e.id}`}
                    etiqueta="Cantidad encontrada"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={filas[e.id]?.cantidadEncontrada ?? ""}
                    onChange={(ev) => cambiarFila(e.id, { cantidadEncontrada: ev.target.value })}
                    required
                  />
                  <Selector
                    id={`estado-${e.id}`}
                    etiqueta="Estado físico"
                    value={filas[e.id]?.estadoFisico ?? "BUENO"}
                    onChange={(ev) => cambiarFila(e.id, { estadoFisico: ev.target.value as EstadoFisico })}
                  >
                    {(Object.keys(ESTADOS_FISICOS) as EstadoFisico[]).map((k) => (
                      <option key={k} value={k}>
                        {ESTADOS_FISICOS[k]}
                      </option>
                    ))}
                  </Selector>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="titulo-novedades" className="flex flex-col gap-3">
        <h2 id="titulo-novedades" className="text-2xl font-bold">
          Novedades
        </h2>
        {novedades.length === 0 && <p className="text-gris">Sin novedades registradas.</p>}
        <ul className="flex flex-col gap-3">
          {novedades.map((n, i) => (
            <li key={n.clave} className="flex flex-col gap-3 rounded-campo border border-gris-claro p-4">
              <p className="font-bold">Novedad {i + 1}</p>
              <Selector
                id={`novedad-elemento-${n.clave}`}
                etiqueta="Elemento afectado"
                value={n.elementoId}
                onChange={(ev) => cambiarNovedad(n.clave, { elementoId: ev.target.value })}
              >
                <option value="">Ninguno en particular</option>
                {elementos.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nombre} ({e.espacioCodigo})
                  </option>
                ))}
              </Selector>
              <AreaTexto
                id={`novedad-descripcion-${n.clave}`}
                etiqueta="Qué pasó"
                value={n.descripcion}
                onChange={(ev) => cambiarNovedad(n.clave, { descripcion: ev.target.value })}
                maxLength={500}
                required
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Campo
                  id={`novedad-valor-${n.clave}`}
                  etiqueta="Valor del daño (pesos)"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={n.valorDano}
                  onChange={(ev) => cambiarNovedad(n.clave, { valorDano: ev.target.value })}
                  required
                />
                <Selector
                  id={`novedad-tratamiento-${n.clave}`}
                  etiqueta="Tratamiento"
                  value={n.tratamiento}
                  onChange={(ev) => cambiarNovedad(n.clave, { tratamiento: ev.target.value as Tratamiento })}
                >
                  {(Object.keys(TRATAMIENTOS) as Tratamiento[]).map((k) => (
                    <option key={k} value={k}>
                      {TRATAMIENTOS[k]}
                    </option>
                  ))}
                </Selector>
              </div>
              <Boton
                variante="secundario"
                onClick={() => setNovedades((p) => p.filter((x) => x.clave !== n.clave))}
              >
                Quitar esta novedad
              </Boton>
            </li>
          ))}
        </ul>
        <Boton variante="secundario" onClick={agregarNovedad} className="w-fit">
          Agregar una novedad
        </Boton>
      </section>

      <AreaTexto
        id="observaciones"
        etiqueta="Observaciones generales"
        value={observaciones}
        onChange={(e) => setObservaciones(e.target.value)}
        maxLength={1000}
      />

      <Boton type="submit" cargando={enviando}>
        {enviando ? "Guardando acta…" : tipo === "ENTREGA" ? "Guardar acta de entrega" : "Guardar acta de devolución"}
      </Boton>
    </form>
  );
}
