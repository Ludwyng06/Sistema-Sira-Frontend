"use client";

import { useState, type FormEvent } from "react";
import { DialogoConfirmacion } from "@/components/DialogoConfirmacion";
import { EstadoError } from "@/components/EstadoError";
import { Alerta, Boton, Campo } from "@/components/formularios";
import { avisar } from "@/lib/avisos";
import {
  actualizarBloque,
  actualizarSede,
  actualizarTipoEspacio,
  archivarTipoEspacio,
  crearBloque,
  crearSede,
  crearTipoEspacio,
  listarTiposEspacioAdmin,
  restaurarTipoEspacio,
  type BloqueAdmin,
  type SedeAdmin,
  type TipoEspacioAdmin,
} from "@/lib/inventario-admin";
import { useConsulta } from "@/lib/useConsulta";

const texto = (d: FormData, k: string) => String(d.get(k) ?? "").trim();
const entero = (d: FormData, k: string) => Number(texto(d, k) || 0);

/**
 * Archivar o restaurar un registro del catálogo. Archivar pide confirmación; restaurar no.
 * Nada se borra: lo archivado deja de verse en el portal y se puede restaurar.
 */
export function BotonArchivo({
  activo,
  nombre,
  consecuencia,
  archivar,
  restaurar,
  alCambiar,
}: {
  activo: boolean;
  nombre: string;
  consecuencia: string;
  archivar: () => Promise<unknown>;
  restaurar: () => Promise<unknown>;
  alCambiar: () => void;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [restaurando, setRestaurando] = useState(false);

  async function alRestaurar() {
    setRestaurando(true);
    try {
      await restaurar();
      avisar.exito(`${nombre} quedó restaurado.`);
      alCambiar();
    } catch (e) {
      avisar.error(e, `No pudimos restaurar ${nombre}.`);
    } finally {
      setRestaurando(false);
    }
  }

  if (!activo) {
    return (
      <Boton variante="secundario" cargando={restaurando} onClick={alRestaurar}>
        Restaurar {nombre}
      </Boton>
    );
  }
  return (
    <>
      <Boton variante="secundario" onClick={() => setConfirmando(true)}>
        Archivar {nombre}
      </Boton>
      <DialogoConfirmacion
        abierto={confirmando}
        titulo={`¿Archivar ${nombre}?`}
        textoConfirmar="Archivar"
        variante="peligro"
        alConfirmar={async () => {
          await archivar();
          avisar.exito(`${nombre} quedó archivado.`);
          alCambiar();
        }}
        alCerrar={() => setConfirmando(false)}
      >
        <p className="text-gris">{consecuencia} Nada se borra: lo puedes restaurar después.</p>
      </DialogoConfirmacion>
    </>
  );
}

/** Crear o editar una sede. El código no cambia una vez creada. */
export function FormularioSede({
  sede,
  alGuardar,
  alCerrar,
}: {
  sede?: SedeAdmin;
  alGuardar: () => void;
  alCerrar: () => void;
}) {
  const [enviando, setEnviando] = useState(false);

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const d = new FormData(evento.currentTarget);
    setEnviando(true);
    try {
      if (sede) {
        await actualizarSede(sede.id, {
          nombre: texto(d, "nombre"),
          municipio: texto(d, "municipio"),
          direccion: texto(d, "direccion") || null,
          telefono: texto(d, "telefono") || null,
          orden: entero(d, "orden"),
        });
        avisar.exito("La sede quedó actualizada.");
      } else {
        await crearSede({
          codigo: texto(d, "codigo").toUpperCase(),
          nombre: texto(d, "nombre"),
          municipio: texto(d, "municipio"),
          direccion: texto(d, "direccion") || undefined,
          telefono: texto(d, "telefono") || undefined,
          orden: entero(d, "orden"),
        });
        avisar.exito("La sede quedó creada.");
      }
      alGuardar();
      alCerrar();
    } catch (e) {
      avisar.error(e, "No pudimos guardar la sede.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="flex flex-col gap-4 rounded-campo border border-gris-claro p-6">
      <h2 className="text-2xl font-bold">{sede ? `Editar la sede ${sede.nombre}` : "Nueva sede"}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {!sede && <Campo id="codigo" etiqueta="Código" ayuda="Único. Por ejemplo MOC." maxLength={10} required />}
        <Campo id="nombre" etiqueta="Nombre" maxLength={120} defaultValue={sede?.nombre} required />
        <Campo id="municipio" etiqueta="Municipio" maxLength={80} defaultValue={sede?.municipio} required />
        <Campo id="direccion" etiqueta="Dirección (opcional)" maxLength={200} defaultValue={sede?.direccion ?? ""} />
        <Campo id="telefono" etiqueta="Teléfono (opcional)" maxLength={30} defaultValue={sede?.telefono ?? ""} />
        <Campo
          id="orden"
          etiqueta="Orden en los listados"
          type="number"
          min={0}
          step={1}
          defaultValue={sede?.orden ?? 0}
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <Boton type="submit" cargando={enviando}>
          {sede ? "Guardar sede" : "Crear sede"}
        </Boton>
        <Boton variante="secundario" onClick={alCerrar}>
          Cerrar
        </Boton>
      </div>
    </form>
  );
}

/** Crear o editar un bloque de una sede. El código es único dentro de la sede y no cambia. */
export function FormularioBloque({
  sede,
  bloque,
  alGuardar,
  alCerrar,
}: {
  sede: { id: string; nombre: string };
  bloque?: BloqueAdmin;
  alGuardar: () => void;
  alCerrar: () => void;
}) {
  const [enviando, setEnviando] = useState(false);

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const d = new FormData(evento.currentTarget);
    setEnviando(true);
    try {
      if (bloque) {
        await actualizarBloque(bloque.id, {
          nombre: texto(d, "nombre"),
          descripcion: texto(d, "descripcion") || null,
          numeroPisos: entero(d, "numeroPisos"),
          orden: entero(d, "orden"),
        });
        avisar.exito("El bloque quedó actualizado.");
      } else {
        await crearBloque({
          sedeId: sede.id,
          codigo: texto(d, "codigo").toUpperCase(),
          nombre: texto(d, "nombre"),
          descripcion: texto(d, "descripcion") || undefined,
          numeroPisos: entero(d, "numeroPisos"),
          orden: entero(d, "orden"),
        });
        avisar.exito("El bloque quedó creado.");
      }
      alGuardar();
      alCerrar();
    } catch (e) {
      avisar.error(e, "No pudimos guardar el bloque.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="flex flex-col gap-4 rounded-campo border border-gris-claro p-6">
      <h2 className="text-2xl font-bold">
        {bloque ? `Editar ${bloque.nombre}` : `Nuevo bloque en la sede ${sede.nombre}`}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {!bloque && (
          <Campo id="codigo" etiqueta="Código" ayuda="Único en la sede. Por ejemplo A." maxLength={10} required />
        )}
        <Campo id="nombre" etiqueta="Nombre" maxLength={120} defaultValue={bloque?.nombre} required />
        <Campo
          id="numeroPisos"
          etiqueta="Número de pisos"
          type="number"
          min={1}
          step={1}
          defaultValue={bloque?.numeroPisos ?? 1}
          ayuda={bloque ? "No puede dejar espacios en pisos que ya no existan." : undefined}
          required
        />
        <Campo
          id="orden"
          etiqueta="Orden en los listados"
          type="number"
          min={0}
          step={1}
          defaultValue={bloque?.orden ?? 0}
        />
      </div>
      <Campo id="descripcion" etiqueta="Descripción (opcional)" maxLength={500} defaultValue={bloque?.descripcion ?? ""} />
      <div className="flex flex-wrap gap-3">
        <Boton type="submit" cargando={enviando}>
          {bloque ? "Guardar bloque" : "Crear bloque"}
        </Boton>
        <Boton variante="secundario" onClick={alCerrar}>
          Cerrar
        </Boton>
      </div>
    </form>
  );
}

/** Formulario de un tipo de espacio (RN-04 anticipación y aforo que exige póliza). */
function EditorTipo({
  tipo,
  alGuardar,
  alCerrar,
}: {
  tipo?: TipoEspacioAdmin;
  alGuardar: () => void;
  alCerrar?: () => void;
}) {
  const [enviando, setEnviando] = useState(false);
  const prefijo = tipo?.id ?? "nuevo-tipo";

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const d = new FormData(formulario);
    const aforo = texto(d, "aforoExigePoliza");
    setEnviando(true);
    try {
      if (tipo) {
        await actualizarTipoEspacio(tipo.id, {
          nombre: texto(d, "nombreTipo"),
          anticipacionMinimaDias: entero(d, "anticipacionMinimaDias"),
          anticipacionEnHabiles: d.get("anticipacionEnHabiles") === "on",
          aforoExigePoliza: aforo === "" ? null : Number(aforo),
        });
        avisar.exito("El tipo de espacio quedó actualizado.");
      } else {
        await crearTipoEspacio({
          codigo: texto(d, "codigoTipo").toUpperCase(),
          nombre: texto(d, "nombreTipo"),
          anticipacionMinimaDias: entero(d, "anticipacionMinimaDias"),
          anticipacionEnHabiles: d.get("anticipacionEnHabiles") === "on",
          aforoExigePoliza: aforo === "" ? undefined : Number(aforo),
        });
        avisar.exito("El tipo de espacio quedó creado.");
        formulario.reset();
      }
      alGuardar();
      alCerrar?.();
    } catch (e) {
      avisar.error(e, "No pudimos guardar el tipo de espacio.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="flex flex-col gap-3 rounded-campo border border-gris-claro p-4">
      <h3 className="text-xl font-bold">{tipo ? `Editar ${tipo.nombre}` : "Nuevo tipo de espacio"}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {!tipo && (
          <Campo
            id={`${prefijo}-codigo`}
            name="codigoTipo"
            etiqueta="Código"
            ayuda="Único. Por ejemplo AUDITORIO."
            maxLength={40}
            required
          />
        )}
        <Campo id={`${prefijo}-nombre`} name="nombreTipo" etiqueta="Nombre" maxLength={120} defaultValue={tipo?.nombre} required />
        <Campo
          id={`${prefijo}-anticipacion`}
          name="anticipacionMinimaDias"
          etiqueta="Anticipación mínima (días)"
          type="number"
          min={0}
          step={1}
          defaultValue={tipo?.anticipacionMinimaDias ?? 3}
          required
        />
        <Campo
          id={`${prefijo}-poliza`}
          name="aforoExigePoliza"
          etiqueta="Aforo desde el que exige póliza"
          type="number"
          min={1}
          step={1}
          defaultValue={tipo?.aforoExigePoliza ?? ""}
          ayuda="Déjalo vacío si nunca exige póliza."
        />
        <label className="flex min-h-11 items-center gap-2 sm:col-span-2">
          <input
            name="anticipacionEnHabiles"
            type="checkbox"
            defaultChecked={tipo ? tipo.anticipacionEnHabiles : true}
            className="size-5"
          />
          La anticipación se cuenta en días hábiles
        </label>
      </div>
      <div className="flex flex-wrap gap-3">
        <Boton type="submit" cargando={enviando}>
          {tipo ? "Guardar tipo" : "Crear tipo"}
        </Boton>
        {alCerrar && (
          <Boton variante="secundario" onClick={alCerrar}>
            Cancelar edición del tipo
          </Boton>
        )}
      </div>
    </form>
  );
}

/** Tipos de espacio: lista con archivados, edición y alta. */
export function GestionTiposEspacio({ alCambiar, alCerrar }: { alCambiar: () => void; alCerrar: () => void }) {
  const { resultado, recargar } = useConsulta(() => listarTiposEspacioAdmin(), []);
  const [editando, setEditando] = useState<TipoEspacioAdmin | null>(null);
  const cambiar = () => {
    recargar();
    alCambiar();
  };

  return (
    <section aria-labelledby="titulo-tipos" className="flex flex-col gap-4 rounded-campo border border-gris-claro p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="titulo-tipos" className="text-2xl font-bold">
          Tipos de espacio
        </h2>
        <Boton variante="secundario" onClick={alCerrar}>
          Cerrar
        </Boton>
      </div>
      <p className="text-gris">
        Cada tipo define la anticipación mínima para solicitar y desde qué aforo se exige póliza.
      </p>
      <EditorTipo
        key={editando?.id ?? "nuevo"}
        tipo={editando ?? undefined}
        alGuardar={cambiar}
        alCerrar={editando ? () => setEditando(null) : undefined}
      />
      {resultado.estado === "cargando" && <p role="status">Cargando tipos de espacio…</p>}
      {resultado.estado === "error" && <EstadoError mensaje={resultado.mensaje} alReintentar={recargar} />}
      {resultado.estado === "listo" &&
        (resultado.datos.datos.length === 0 ? (
          <Alerta tipo="info">Todavía no hay tipos de espacio.</Alerta>
        ) : (
          <ul className="flex flex-col divide-y divide-gris-claro">
            {resultado.datos.datos.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span>
                  <span className="font-bold">{t.nombre}</span> · {t.codigo}
                  {!t.activo && (
                    <span className="ml-2 rounded bg-gris-claro px-1.5 py-0.5 text-xs font-semibold">Archivado</span>
                  )}
                  <span className="block text-base text-gris">
                    {t.anticipacionMinimaDias} día{t.anticipacionMinimaDias === 1 ? "" : "s"}{" "}
                    {t.anticipacionEnHabiles ? "hábiles" : "calendario"} de anticipación ·{" "}
                    {t.aforoExigePoliza ? `póliza desde ${t.aforoExigePoliza} personas` : "sin póliza"} ·{" "}
                    {t.espaciosActivos} espacio{t.espaciosActivos === 1 ? "" : "s"}
                  </span>
                </span>
                <span className="flex flex-wrap gap-2">
                  {t.activo && (
                    <Boton variante="secundario" onClick={() => setEditando(t)}>
                      Editar {t.nombre}
                    </Boton>
                  )}
                  <BotonArchivo
                    activo={t.activo}
                    nombre={t.nombre}
                    consecuencia="No se podrá elegir para espacios nuevos."
                    archivar={() => archivarTipoEspacio(t.id)}
                    restaurar={() => restaurarTipoEspacio(t.id)}
                    alCambiar={cambiar}
                  />
                </span>
              </li>
            ))}
          </ul>
        ))}
    </section>
  );
}
