"use client";

import { useState, type FormEvent } from "react";
import { Esqueleto, RegionCargando } from "@/components/Esqueleto";
import { EstadoError } from "@/components/EstadoError";
import { EstadoVacio } from "@/components/EstadoVacio";
import { Paginador } from "@/components/ListaSolicitudes";
import { Boton, Campo } from "@/components/formularios";
import { listarAuditoria } from "@/lib/administracion";
import { fecha, hora } from "@/lib/formato";
import { useConsulta } from "@/lib/useConsulta";

const POR_PAGINA = 25;

interface Filtros {
  entidad: string;
  accion: string;
  desde: string;
  hasta: string;
}

const VACIOS: Filtros = { entidad: "", accion: "", desde: "", hasta: "" };

/** Día local (Bogotá) a instante UTC: 00:00 -05:00. */
const inicioDelDia = (dia: string) => (dia ? `${dia}T05:00:00.000Z` : undefined);
const finDelDia = (dia: string) => {
  if (!dia) return undefined;
  const d = new Date(`${dia}T05:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString();
};

export function PantallaBitacora() {
  const [filtros, setFiltros] = useState<Filtros>(VACIOS);
  const [pagina, setPagina] = useState(1);
  const { resultado, recargar } = useConsulta(
    () =>
      listarAuditoria({
        entidad: filtros.entidad || undefined,
        accion: filtros.accion || undefined,
        desde: inicioDelDia(filtros.desde),
        hasta: finDelDia(filtros.hasta),
        pagina,
        porPagina: POR_PAGINA,
      }),
    [filtros, pagina],
  );

  function aplicar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    setFiltros({
      entidad: String(datos.get("entidad") ?? "").trim(),
      accion: String(datos.get("accion") ?? "").trim(),
      desde: String(datos.get("desde") ?? ""),
      hasta: String(datos.get("hasta") ?? ""),
    });
    setPagina(1);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold sm:text-4xl">Bitácora</h1>
        <p className="text-gris">Registro de las acciones sensibles del sistema. Solo se puede consultar.</p>
      </header>

      <form
        onSubmit={aplicar}
        className="grid gap-4 rounded-lg border border-gris-claro bg-fondo-suave p-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end"
      >
        <Campo id="entidad" etiqueta="Entidad" placeholder="Ej. Solicitud" defaultValue={filtros.entidad} />
        <Campo id="accion" etiqueta="Acción" placeholder="Ej. ENVIAR" defaultValue={filtros.accion} />
        <Campo id="desde" etiqueta="Desde" type="date" defaultValue={filtros.desde} />
        <Campo id="hasta" etiqueta="Hasta" type="date" defaultValue={filtros.hasta} />
        <Boton type="submit">Aplicar filtros</Boton>
      </form>

      {resultado.estado === "cargando" && (
        <RegionCargando etiqueta="Cargando la bitácora">
          <div className="flex flex-col gap-2">
            {[0, 1, 2, 3].map((i) => (
              <Esqueleto key={i} className="h-12 w-full" />
            ))}
          </div>
        </RegionCargando>
      )}
      {resultado.estado === "error" && (
        <EstadoError mensaje={resultado.mensaje} alReintentar={recargar} />
      )}
      {resultado.estado === "listo" &&
        (resultado.datos.total === 0 ? (
          <EstadoVacio
            titulo="No hay registros con esos filtros"
            mensaje="Prueba con otro rango de fechas o quita algún filtro."
          />
        ) : (
          <>
            <p aria-live="polite" className="text-gris">
              {resultado.datos.total} registros.
            </p>
            <div className="overflow-x-auto rounded-lg border border-gris-claro">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Acciones registradas en la bitácora</caption>
                <thead className="bg-fondo-suave">
                  <tr>
                    <th scope="col" className="px-3 py-2">Cuándo</th>
                    <th scope="col" className="px-3 py-2">Quién</th>
                    <th scope="col" className="px-3 py-2">Acción</th>
                    <th scope="col" className="px-3 py-2">Entidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gris-claro">
                  {resultado.datos.datos.map((r) => (
                    <tr key={r.id}>
                      <td className="whitespace-nowrap px-3 py-2">
                        {fecha(r.ocurrioEn)} · {hora(r.ocurrioEn)}
                      </td>
                      <td className="px-3 py-2">{r.usuarioCorreo ?? "Sistema"}</td>
                      <td className="px-3 py-2 font-medium">{r.accion}</td>
                      <td className="px-3 py-2">
                        {r.entidad}
                        {r.entidadId && <span className="text-gris"> · {r.entidadId.slice(0, 8)}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Paginador
              pagina={resultado.datos.pagina}
              total={resultado.datos.total}
              porPagina={resultado.datos.porPagina}
              alCambiar={setPagina}
            />
          </>
        ))}
    </div>
  );
}
