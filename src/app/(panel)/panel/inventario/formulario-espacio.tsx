"use client";

import { useState, type FormEvent } from "react";
import { DialogoConfirmacion } from "@/components/DialogoConfirmacion";
import { Esqueleto, RegionCargando } from "@/components/Esqueleto";
import { EstadoError } from "@/components/EstadoError";
import { Alerta, AreaTexto, Boton, Campo, Selector } from "@/components/formularios";
import { ErrorApi } from "@/lib/api";
import {
  actualizarEspacio,
  archivarEspacio,
  crearEspacio,
  ESTADOS_ESPACIO,
  type ActualizarEspacio,
  type EstadoEspacio,
} from "@/lib/inventario-admin";
import { listarTiposEspacio, obtenerEspacio } from "@/lib/inventario";
import { useConsulta } from "@/lib/useConsulta";
import type { Seleccion } from "./pantalla-inventario";

const texto = (d: FormData, k: string) => String(d.get(k) ?? "").trim();
const numero = (d: FormData, k: string) => Number(d.get(k));
const opcionalNumero = (d: FormData, k: string) => (texto(d, k) === "" ? undefined : Number(texto(d, k)));

export function FormularioEspacio({
  seleccion,
  puedeEditar,
  alCambiar,
  alCerrar,
}: {
  seleccion: NonNullable<Seleccion>;
  puedeEditar: boolean;
  alCambiar: () => void;
  alCerrar: () => void;
}) {
  const codigo = seleccion.tipo === "espacio" ? seleccion.codigo : null;
  const ficha = useConsulta(() => (codigo ? obtenerEspacio(codigo) : Promise.resolve(null)), [codigo ?? ""]);
  const tipos = useConsulta(() => listarTiposEspacio(), []);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [archivando, setArchivando] = useState(false);

  if (ficha.resultado.estado === "cargando" || tipos.resultado.estado === "cargando") {
    return (
      <RegionCargando etiqueta="Cargando el espacio">
        <div className="flex flex-col gap-3">
          <Esqueleto className="h-8 w-64" />
          <Esqueleto className="h-48 w-full" />
        </div>
      </RegionCargando>
    );
  }
  if (ficha.resultado.estado === "error") {
    return <EstadoError mensaje={ficha.resultado.mensaje} alReintentar={ficha.recargar} />;
  }
  if (tipos.resultado.estado === "error") {
    return <EstadoError mensaje={tipos.resultado.mensaje} alReintentar={tipos.recargar} />;
  }

  const actual = ficha.resultado.datos;
  const listaTipos = tipos.resultado.datos;
  const soloLectura = !puedeEditar;

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const d = new FormData(evento.currentTarget);
    setEnviando(true);
    setError(null);
    setAviso(null);
    try {
      if (actual) {
        // Swagger tipa los campos que aceptan null como objeto; el cuerpo real es número, texto o null.
        await actualizarEspacio(actual.codigo, {
          tipo: texto(d, "tipo"),
          nombre: texto(d, "nombre"),
          piso: numero(d, "piso"),
          capacidadPersonas: numero(d, "capacidadPersonas"),
          areaM2: opcionalNumero(d, "areaM2") ?? null,
          descripcion: texto(d, "descripcion") || null,
          condicionesUso: texto(d, "condicionesUso") || null,
          estado: (texto(d, "estado") || undefined) as EstadoEspacio | undefined,
          minutosMontaje: numero(d, "minutosMontaje"),
          minutosDesmontaje: numero(d, "minutosDesmontaje"),
        } as ActualizarEspacio);
        setAviso("Los cambios del espacio quedaron guardados.");
      } else {
        const creado = await crearEspacio({
          sede: seleccion.sede,
          bloque: seleccion.bloque,
          tipo: texto(d, "tipo"),
          codigo: texto(d, "codigo").toUpperCase(),
          nombre: texto(d, "nombre"),
          piso: numero(d, "piso"),
          capacidadPersonas: numero(d, "capacidadPersonas"),
          areaM2: opcionalNumero(d, "areaM2"),
          descripcion: texto(d, "descripcion") || undefined,
          condicionesUso: texto(d, "condicionesUso") || undefined,
          minutosMontaje: numero(d, "minutosMontaje"),
          minutosDesmontaje: numero(d, "minutosDesmontaje"),
          requiereAval: d.get("requiereAval") === "on",
          esReservable: d.get("esReservable") === "on",
        });
        setAviso(`El espacio ${creado.codigo} se creó.`);
      }
      alCambiar();
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : "No pudimos guardar el espacio.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="flex flex-col gap-4 rounded-lg border border-gris-claro p-6">
      <h2 className="text-2xl font-bold">
        {actual ? `${actual.codigo} · ${actual.nombre}` : `Nuevo espacio en el bloque ${seleccion.bloque}`}
      </h2>
      {aviso && <Alerta tipo="exito">{aviso}</Alerta>}
      {error && <Alerta tipo="error">{error}</Alerta>}

      <fieldset disabled={soloLectura} className="flex flex-col gap-4">
        <legend className="sr-only">Datos del espacio</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {!actual && (
            <Campo
              id="codigo"
              etiqueta="Código del plano"
              ayuda="Por ejemplo A-201."
              required
            />
          )}
          <Campo id="nombre" etiqueta="Nombre" maxLength={120} defaultValue={actual?.nombre} required />
          <Selector id="tipo" etiqueta="Tipo de espacio" defaultValue={actual?.tipo.codigo} required>
            {listaTipos.map((t) => (
              <option key={t.codigo} value={t.codigo}>
                {t.nombre}
              </option>
            ))}
          </Selector>
          <Campo id="piso" etiqueta="Piso" type="number" min={1} defaultValue={actual?.piso} required />
          <Campo
            id="capacidadPersonas"
            etiqueta="Capacidad (personas)"
            type="number"
            min={1}
            defaultValue={actual?.capacidadPersonas}
            required
          />
          <Campo id="areaM2" etiqueta="Área (m²)" type="number" min={0} step="any" defaultValue={actual?.areaM2 ?? undefined} />
          <Campo
            id="minutosMontaje"
            etiqueta="Minutos de montaje"
            type="number"
            min={0}
            defaultValue={actual?.minutosMontaje ?? 0}
          />
          <Campo
            id="minutosDesmontaje"
            etiqueta="Minutos de desmontaje"
            type="number"
            min={0}
            defaultValue={actual?.minutosDesmontaje ?? 0}
          />
          {actual && (
            <Selector
              id="estado"
              etiqueta="Estado del espacio"
              ayuda="Déjalo en “Sin cambios” si no vas a modificarlo."
              defaultValue=""
            >
              <option value="">Sin cambios</option>
              {(Object.keys(ESTADOS_ESPACIO) as EstadoEspacio[]).map((k) => (
                <option key={k} value={k}>
                  {ESTADOS_ESPACIO[k]}
                </option>
              ))}
            </Selector>
          )}
        </div>
        {!actual && (
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2">
              <input name="requiereAval" type="checkbox" defaultChecked className="size-5" />
              Requiere el aval del responsable del espacio
            </label>
            <label className="flex items-center gap-2">
              <input name="esReservable" type="checkbox" defaultChecked className="size-5" />
              Se puede reservar
            </label>
          </div>
        )}
        <AreaTexto id="descripcion" etiqueta="Descripción" maxLength={1000} defaultValue={actual?.descripcion ?? ""} />
        <AreaTexto
          id="condicionesUso"
          etiqueta="Condiciones de uso"
          maxLength={1000}
          defaultValue={actual?.condicionesUso ?? ""}
        />
      </fieldset>

      <div className="flex flex-wrap gap-3">
        {puedeEditar && (
          <Boton type="submit" cargando={enviando}>
            {actual ? "Guardar cambios" : "Crear espacio"}
          </Boton>
        )}
        {puedeEditar && actual && (
          <Boton variante="secundario" onClick={() => setArchivando(true)}>
            Archivar espacio
          </Boton>
        )}
        <Boton variante="secundario" onClick={alCerrar}>
          Cerrar
        </Boton>
      </div>

      <DialogoConfirmacion
        abierto={archivando}
        titulo="¿Archivar este espacio?"
        textoConfirmar="Archivar espacio"
        variante="peligro"
        alConfirmar={async () => {
          if (!actual) return;
          await archivarEspacio(actual.codigo);
          alCambiar();
          alCerrar();
        }}
        alCerrar={() => setArchivando(false)}
      >
        <p className="text-gris">
          {actual?.codigo} dejará de mostrarse en el portal y no se podrá reservar. Nada se borra:
          puedes volver a tenerlo si lo necesitas.
        </p>
      </DialogoConfirmacion>
    </form>
  );
}
