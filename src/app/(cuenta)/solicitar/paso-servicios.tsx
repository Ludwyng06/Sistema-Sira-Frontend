"use client";

import { useEffect, useState } from "react";
import { Esqueleto, RegionCargando } from "@/components/Esqueleto";
import { EstadoError } from "@/components/EstadoError";
import { Boton } from "@/components/formularios";
import { pesos } from "@/lib/formato";
import {
  CATEGORIAS,
  listarServicios,
  UNIDADES_COBRO,
  UNIDADES_PLURAL,
  type Servicio,
} from "@/lib/servicios";
import { agregarServicio, quitarServicio } from "@/lib/solicitudes";
import { useConsulta } from "@/lib/useConsulta";
import type { ContextoAsistente } from "./asistente";
import { avisar } from "@/lib/avisos";

/**
 * Catálogo del paso: la unión (sin duplicados) de los servicios compatibles con cada tipo de espacio
 * del borrador. Si alguna reserva no trae el tipo (servidor antiguo) se pide el catálogo completo.
 */
async function catalogoParaTipos(tipos: (string | undefined)[]): Promise<Servicio[]> {
  const ids = [...new Set(tipos.filter((t): t is string => Boolean(t)))];
  if (ids.length === 0 || tipos.some((t) => !t)) return listarServicios();
  const listas = await Promise.all(ids.map((id) => listarServicios(id)));
  const vistos = new Map<string, Servicio>();
  for (const lista of listas) for (const s of lista) if (!vistos.has(s.id)) vistos.set(s.id, s);
  return [...vistos.values()];
}

/** Paso 2: servicios complementarios (opcional). Cada tarjeta empieza solo con "Agregar". */
export function PasoServicios({
  contexto,
  alContinuar,
  alVolver,
}: {
  contexto: ContextoAsistente;
  alContinuar: () => void;
  alVolver: () => void;
}) {
  const { borrador, recargar } = contexto;
  const tipos = (borrador?.reservas ?? []).map((r) => r.tipoEspacioId);
  const catalogo = useConsulta(() => catalogoParaTipos(tipos), [tipos.map((t) => t ?? "-").join(",")]);

  if (!borrador) return null;

  const idsCatalogo = new Set(catalogo.resultado.estado === "listo" ? catalogo.resultado.datos.map((c) => c.id) : []);
  const huerfanos =
    catalogo.resultado.estado === "listo" ? borrador.servicios.filter((x) => !idsCatalogo.has(x.servicioId)) : [];

  async function agregar(servicioId: string, cantidad: number): Promise<boolean> {
    try {
      await agregarServicio(borrador!.id, servicioId, cantidad);
      recargar();
      return true;
    } catch (e) {
      avisar.error(e, "No pudimos agregar el servicio.");
      return false;
    }
  }

  async function quitar(itemId: string) {
    try {
      await quitarServicio(borrador!.id, itemId);
      recargar();
    } catch (e) {
      avisar.error(e, "No pudimos quitar el servicio.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-prose text-gris">
        Si tu evento necesita algo más, agrégalo aquí. Es opcional y su valor se confirma en la cotización.
      </p>

      {catalogo.resultado.estado === "cargando" && (
        <RegionCargando etiqueta="Cargando servicios">
          <Esqueleto className="h-40 w-full" />
        </RegionCargando>
      )}
      {catalogo.resultado.estado === "error" && (
        <EstadoError mensaje={catalogo.resultado.mensaje} alReintentar={catalogo.recargar} />
      )}
      {/* Solo se evalúa con el catálogo ya cargado; mientras carga no se marca nada como incompatible. */}
      {catalogo.resultado.estado === "listo" && huerfanos.length > 0 && (
        <section aria-labelledby="titulo-incompatibles" className="flex flex-col gap-3">
          <h2 id="titulo-incompatibles" className="text-xl font-extrabold">
            Servicios que debes quitar
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {huerfanos.map((x) => (
              <li key={x.id} className="flex flex-col gap-2 rounded-campo border-2 border-tinta bg-fondo-suave p-4">
                <h3 className="text-lg font-bold">{x.nombre}</h3>
                <p className="font-medium">Cantidad: {x.cantidad}</p>
                <p role="alert">
                  Este servicio no está disponible para los espacios que escogiste. Quítalo para poder enviar.
                </p>
                <Boton variante="secundario" onClick={() => quitar(x.id)} aria-label={`Quitar ${x.nombre}`} className="self-start">
                  Quitar
                </Boton>
              </li>
            ))}
          </ul>
        </section>
      )}
      {catalogo.resultado.estado === "listo" &&
        (catalogo.resultado.datos.length === 0 ? (
          <p className="text-gris">
            No hay servicios complementarios para los espacios que escogiste. Puedes continuar.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {catalogo.resultado.datos.map((s) => {
              const elegido = borrador.servicios.find((x) => x.servicioId === s.id);
              return (
                <TarjetaServicio
                  key={s.id}
                  servicio={s}
                  elegido={elegido ? { id: elegido.id, cantidad: elegido.cantidad, subtotal: elegido.subtotal } : null}
                  alAgregar={(c) => agregar(s.id, c)}
                  alQuitar={() => quitar(elegido!.id)}
                />
              );
            })}
          </ul>
        ))}

      <div className="flex flex-wrap justify-between gap-3">
        <Boton variante="secundario" onClick={alVolver}>
          Atrás
        </Boton>
        <Boton onClick={alContinuar}>Continuar a datos del evento</Boton>
      </div>
    </div>
  );
}

function TarjetaServicio({
  servicio: s,
  elegido,
  alAgregar,
  alQuitar,
}: {
  servicio: Servicio;
  elegido: { id: string; cantidad: number; subtotal: number } | null;
  alAgregar: (cantidad: number) => Promise<boolean>;
  alQuitar: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("1");
  const [ocupado, setOcupado] = useState(false);
  const idCantidad = `cantidad-${s.id}`;
  const maximo = s.cantidadMaxima ?? undefined;
  const cantidad = Number(texto);
  const valida = Number.isInteger(cantidad) && cantidad >= 1 && (maximo === undefined || cantidad <= maximo);
  const unidad = UNIDADES_PLURAL[s.unidadCobro];

  // Al abrir, el foco pasa al selector de cantidad.
  useEffect(() => {
    if (abierto) document.getElementById(idCantidad)?.focus();
  }, [abierto, idCantidad]);

  function cancelar() {
    setAbierto(false);
    setTexto("1");
  }

  async function confirmar() {
    if (!valida) return;
    setOcupado(true);
    const ok = await alAgregar(cantidad);
    setOcupado(false);
    if (ok) cancelar();
  }

  return (
    <li
      className={`flex flex-col gap-2 rounded-campo p-4 ${
        elegido ? "border-2 border-azul bg-turquesa-suave" : "border border-gris-claro"
      }`}
    >
      <p className="text-base font-bold text-gris">{CATEGORIAS[s.categoria]}</p>
      <h3 className="text-lg font-bold">{s.nombre}</h3>
      <p className="text-base text-gris">
        Se cobra {UNIDADES_COBRO[s.unidadCobro]} · {s.anticipacionMinimaDias}{" "}
        {s.anticipacionMinimaDias === 1 ? "día" : "días"} de anticipación
      </p>
      {elegido ? (
        <div className="mt-auto flex flex-col gap-2">
          <p className="font-bold text-azul-oscuro">Agregado</p>
          <p className="font-medium">
            {elegido.cantidad} {unidad} · estimado {pesos(elegido.subtotal)}
          </p>
          <Boton variante="secundario" onClick={alQuitar} aria-label={`Quitar ${s.nombre}`} className="self-start">
            Quitar
          </Boton>
        </div>
      ) : abierto ? (
        <div
          role="group"
          aria-label={`Cantidad de ${s.nombre}`}
          className="mt-auto flex flex-col gap-3"
          onKeyDown={(e) => {
            if (e.key === "Escape") cancelar();
            if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
              e.preventDefault();
              void confirmar();
            }
          }}
        >
          <div className="flex flex-col gap-1">
            <label htmlFor={idCantidad} className="font-bold text-tinta">
              Cantidad de {s.nombre}
            </label>
            <div className="flex items-center gap-2">
              <input
                id={idCantidad}
                type="number"
                min={1}
                max={maximo}
                step={1}
                inputMode="numeric"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                aria-invalid={!valida}
                aria-describedby={`${idCantidad}-ayuda`}
                className="min-h-12 w-24 rounded-campo border-2 border-gris bg-fondo px-3 text-base"
              />
              <span>{unidad}</span>
            </div>
            <p id={`${idCantidad}-ayuda`} className={valida ? "text-meta text-gris" : "text-meta font-bold text-tinta"}>
              {maximo !== undefined ? `Entre 1 y ${maximo} ${unidad}.` : "Mínimo 1."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Boton onClick={confirmar} cargando={ocupado} disabled={!valida} aria-label={`Confirmar ${s.nombre}`}>
              Confirmar
            </Boton>
            <Boton variante="secundario" onClick={cancelar} disabled={ocupado} aria-label={`Cancelar ${s.nombre}`}>
              Cancelar
            </Boton>
          </div>
        </div>
      ) : (
        <Boton onClick={() => setAbierto(true)} aria-label={`Agregar ${s.nombre}`} className="mt-auto self-start">
          Agregar
        </Boton>
      )}
    </li>
  );
}
