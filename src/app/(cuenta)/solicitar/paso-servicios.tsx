"use client";

import { useState } from "react";
import { Esqueleto, RegionCargando } from "@/components/Esqueleto";
import { EstadoError } from "@/components/EstadoError";
import { Alerta, Boton, Campo } from "@/components/formularios";
import { pesos } from "@/lib/formato";
import { CATEGORIAS, listarServicios, UNIDADES_COBRO } from "@/lib/servicios";
import { agregarServicio, quitarServicio } from "@/lib/solicitudes";
import { useConsulta } from "@/lib/useConsulta";
import type { ContextoAsistente } from "./asistente";
import { avisar } from "@/lib/avisos";

/** Paso 2: servicios complementarios (opcional). */
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
  const catalogo = useConsulta(() => listarServicios(), []);
  const [cantidades, setCantidades] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);

  if (!borrador) return null;

  async function agregar(servicioId: string) {
    setError(null);
    setOcupado(servicioId);
    try {
      await agregarServicio(borrador!.id, servicioId, Number(cantidades[servicioId] ?? 1) || 1);
      recargar();
    } catch (e) {
      avisar.error(e, "No pudimos agregar el servicio.");
    } finally {
      setOcupado(null);
    }
  }

  async function quitar(itemId: string) {
    setError(null);
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
      {error && <Alerta tipo="error">{error}</Alerta>}

      {catalogo.resultado.estado === "cargando" && (
        <RegionCargando etiqueta="Cargando servicios">
          <Esqueleto className="h-40 w-full" />
        </RegionCargando>
      )}
      {catalogo.resultado.estado === "error" && (
        <EstadoError mensaje={catalogo.resultado.mensaje} alReintentar={catalogo.recargar} />
      )}
      {catalogo.resultado.estado === "listo" &&
        (catalogo.resultado.datos.length === 0 ? (
          <p className="text-gris">No hay servicios complementarios publicados. Puedes continuar.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {catalogo.resultado.datos.map((s) => {
              const elegido = borrador.servicios.find((x) => x.servicioId === s.id);
              return (
                <li key={s.id} className="flex flex-col gap-2 rounded-campo border border-gris-claro p-4">
                  <p className="text-base font-bold text-gris">{CATEGORIAS[s.categoria]}</p>
                  <h3 className="text-lg font-bold">{s.nombre}</h3>
                  <p className="text-base text-gris">
                    Se cobra {UNIDADES_COBRO[s.unidadCobro]} · {s.anticipacionMinimaDias}{" "}
                    {s.anticipacionMinimaDias === 1 ? "día" : "días"} de anticipación
                  </p>
                  {elegido ? (
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">
                        Agregado: {elegido.cantidad} · estimado {pesos(elegido.subtotal)}
                      </p>
                      <Boton variante="secundario" onClick={() => quitar(elegido.id)}>
                        Quitar
                      </Boton>
                    </div>
                  ) : (
                    <div className="mt-auto flex flex-wrap items-end gap-3">
                      <Campo
                        id={`cantidad-${s.id}`}
                        etiqueta="Cantidad"
                        type="number"
                        min={1}
                        max={s.cantidadMaxima ?? undefined}
                        value={cantidades[s.id] ?? "1"}
                        onChange={(e) => setCantidades({ ...cantidades, [s.id]: e.target.value })}
                        className="w-28"
                      />
                      <Boton onClick={() => agregar(s.id)} cargando={ocupado === s.id}>
                        Agregar
                      </Boton>
                    </div>
                  )}
                </li>
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
