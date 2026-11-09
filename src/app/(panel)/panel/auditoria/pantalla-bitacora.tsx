"use client";

import { AnclaResultados } from "@/components/AnclaResultados";
import { useIrAResultados } from "@/lib/useIrAResultados";
import { useState, type FormEvent } from "react";
import { Esqueleto, RegionCargando } from "@/components/Esqueleto";
import { EstadoError } from "@/components/EstadoError";
import { EstadoVacio } from "@/components/EstadoVacio";
import { Paginador } from "@/components/ListaSolicitudes";
import { Boton, Campo, Selector } from "@/components/formularios";
import { useSesion } from "@/components/SesionProvider";
import { listarAuditoria, listarUsuarios } from "@/lib/administracion";
import { fecha, hora } from "@/lib/formato";
import { useConsulta } from "@/lib/useConsulta";
import { finDiaBogota, inicioDiaBogota } from "@/lib/zona";

const POR_PAGINA = 25;

interface Filtros {
  entidad: string;
  entidadId: string;
  accion: string;
  usuarioId: string;
  desde: string;
  hasta: string;
}

const VACIOS: Filtros = { entidad: "", entidadId: "", accion: "", usuarioId: "", desde: "", hasta: "" };

/** Valor anterior o nuevo de un registro (RF-AUD-02), tal como lo guardó el servidor. */
function BloqueJson({ titulo, datos }: { titulo: string; datos: Record<string, unknown> | null }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <p className="font-bold">{titulo}</p>
      {datos ? (
        <pre className="whitespace-pre-wrap break-all rounded-campo bg-fondo-suave p-3 text-meta">
          {JSON.stringify(datos, null, 2)}
        </pre>
      ) : (
        <p className="text-gris">—</p>
      )}
    </div>
  );
}

export function PantallaBitacora() {
  const { tieneRol } = useSesion();
  const esAdministrador = tieneRol("ADMINISTRADOR");
  const [filtros, setFiltros] = useState<Filtros>(VACIOS);
  const [pagina, setPagina] = useState(1);
  const { resultado, recargar } = useConsulta(
    () =>
      listarAuditoria({
        entidad: filtros.entidad || undefined,
        entidadId: filtros.entidadId || undefined,
        accion: filtros.accion || undefined,
        usuarioId: filtros.usuarioId || undefined,
        desde: filtros.desde ? inicioDiaBogota(filtros.desde) : undefined,
        hasta: filtros.hasta ? finDiaBogota(filtros.hasta) : undefined,
        pagina,
        porPagina: POR_PAGINA,
      }),
    [filtros, pagina],
  );
  const { destino: anclaResultados, ir: irAResultados, buscando: buscandoResultados } = useIrAResultados(resultado.estado !== "cargando");
  // El listado de usuarios es solo del administrador; el auditor filtra con "Ver solo este usuario" en la tabla.
  const usuarios = useConsulta(
    () => (esAdministrador ? listarUsuarios({ porPagina: 100 }) : Promise.resolve(null)),
    [esAdministrador],
  );
  const opcionesUsuario = usuarios.resultado.estado === "listo" ? (usuarios.resultado.datos?.datos ?? []) : [];

  function aplicar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    setFiltros({
      entidad: String(datos.get("entidad") ?? "").trim(),
      entidadId: String(datos.get("entidadId") ?? "").trim(),
      accion: String(datos.get("accion") ?? "").trim(),
      usuarioId: String(datos.get("usuarioId") ?? filtros.usuarioId),
      desde: String(datos.get("desde") ?? ""),
      hasta: String(datos.get("hasta") ?? ""),
    });
    setPagina(1);
    irAResultados();
  }

  function filtrarPorUsuario(usuarioId: string) {
    setFiltros((previos) => ({ ...previos, usuarioId }));
    setPagina(1);
    irAResultados();
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-t1 font-black">Bitácora</h1>
        <p className="text-gris">Registro de las acciones sensibles del sistema. Solo se puede consultar.</p>
      </header>

      <form
        key={JSON.stringify(filtros)}
        onSubmit={aplicar}
        className="grid gap-4 rounded-campo border border-gris-claro bg-fondo-suave p-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
      >
        <Campo id="entidad" etiqueta="Entidad" placeholder="Ej. Solicitud" defaultValue={filtros.entidad} />
        <Campo
          id="entidadId"
          etiqueta="Id de la entidad"
          placeholder="Ej. el id de una solicitud"
          defaultValue={filtros.entidadId}
        />
        <Campo id="accion" etiqueta="Acción" placeholder="Ej. ENVIAR" defaultValue={filtros.accion} />
        {esAdministrador ? (
          <Selector id="usuarioId" etiqueta="Usuario" defaultValue={filtros.usuarioId}>
            <option value="">Todos</option>
            {opcionesUsuario.map((u) => (
              <option key={u.id} value={u.id}>
                {u.correo}
              </option>
            ))}
          </Selector>
        ) : (
          filtros.usuarioId && (
            <div className="flex flex-col gap-1">
              <p className="font-bold text-tinta">Usuario</p>
              <Boton variante="secundario" onClick={() => filtrarPorUsuario("")}>
                Quitar filtro de usuario
              </Boton>
            </div>
          )
        )}
        <Campo id="desde" etiqueta="Desde" type="date" defaultValue={filtros.desde} />
        <Campo id="hasta" etiqueta="Hasta" type="date" defaultValue={filtros.hasta} />
        <div className="flex flex-wrap gap-3 sm:col-span-2 lg:col-span-2">
          <Boton type="submit">Aplicar filtros</Boton>
          <Boton
            variante="secundario"
            onClick={() => {
              setFiltros(VACIOS);
              setPagina(1);
              irAResultados();
            }}
          >
            Limpiar
          </Boton>
        </div>
      </form>

      <AnclaResultados ref={anclaResultados} buscando={buscandoResultados} etiqueta="Resultados de la bitácora" />
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
            <div className="rounded-campo border border-gris-claro">
              <table className="tabla-completa text-left text-base">
                <caption className="sr-only">Acciones registradas en la bitácora, con todos sus datos</caption>
                <thead className="bg-fondo-suave">
                  <tr>
                    <th scope="col" className="px-3 py-2">Cuándo</th>
                    <th scope="col" className="px-3 py-2">Quién</th>
                    <th scope="col" className="px-3 py-2">Acción</th>
                    <th scope="col" className="px-3 py-2">Entidad</th>
                    <th scope="col" className="px-3 py-2">Origen</th>
                  </tr>
                </thead>
                {resultado.datos.datos.map((r) => (
                  // Un tbody por registro: la fila principal y debajo, a lo ancho, los valores anterior y nuevo.
                  <tbody key={r.id} className="border-t border-gris-claro first-of-type:border-t-0">
                    <tr>
                      <td data-etiqueta="Cuándo" className="px-3 pt-3 pb-1">
                        {fecha(r.ocurrioEn)} · {hora(r.ocurrioEn)}
                      </td>
                      <td data-etiqueta="Quién" className="px-3 pt-3 pb-1">
                        <span>
                          {r.usuarioCorreo ?? "Sistema"}
                          {r.usuarioId && r.usuarioId !== filtros.usuarioId && (
                            <button
                              type="button"
                              onClick={() => filtrarPorUsuario(r.usuarioId!)}
                              className="block min-h-11 text-meta font-bold text-azul-oscuro underline underline-offset-4"
                            >
                              Ver solo este usuario
                            </button>
                          )}
                        </span>
                      </td>
                      <td data-etiqueta="Acción" className="px-3 pt-3 pb-1 font-medium">{r.accion}</td>
                      <td data-etiqueta="Entidad" className="px-3 pt-3 pb-1">
                        <span>
                          {r.entidad}
                          {r.entidadId && <span className="block text-meta text-gris">{r.entidadId}</span>}
                        </span>
                      </td>
                      <td data-etiqueta="Origen" className="px-3 pt-3 pb-1">
                        <dl className="grid grid-cols-[auto_1fr] gap-x-2 text-meta">
                          <dt className="font-bold">IP</dt>
                          <dd>{r.ip ?? "—"}</dd>
                          <dt className="font-bold">Correlación</dt>
                          <dd>{r.correlacionId ?? "—"}</dd>
                          <dt className="font-bold">Navegador</dt>
                          <dd>{r.userAgent ?? "—"}</dd>
                        </dl>
                      </td>
                    </tr>
                    {(r.datosAntes || r.datosDespues) && (
                      <tr>
                        <td colSpan={5} className="px-3 pb-3">
                          <div className="grid gap-3 md:grid-cols-2">
                            <BloqueJson titulo="Valor anterior" datos={r.datosAntes} />
                            <BloqueJson titulo="Valor nuevo" datos={r.datosDespues} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                ))}
              </table>
            </div>
            <Paginador
              pagina={resultado.datos.pagina}
              total={resultado.datos.total}
              porPagina={resultado.datos.porPagina}
              alCambiar={(p) => {
                irAResultados();
                setPagina(p);
              }}
            />
          </>
        ))}
    </div>
  );
}
