"use client";

import { useCallback, useEffect, useState } from "react";
import { ErrorApi } from "./api";

export type EstadoConsulta<T> =
  | { estado: "cargando" }
  | { estado: "error"; mensaje: string; status: number }
  | { estado: "listo"; datos: T };

type Terminada<T> = Exclude<EstadoConsulta<T>, { estado: "cargando" }>;

/**
 * Consulta del lado del cliente (el token vive en memoria, así que lo que requiere sesión
 * no puede pedirse desde el servidor). Se repite cuando cambian las dependencias, que deben
 * ser valores simples (texto, número, booleano).
 */
export function useConsulta<T>(consulta: () => Promise<T>, dependencias: unknown[]) {
  const [version, setVersion] = useState(0);
  const clave = `${JSON.stringify(dependencias)}#${version}`;
  const [terminada, setTerminada] = useState<{ clave: string; resultado: Terminada<T> } | null>(
    null,
  );

  useEffect(() => {
    let activo = true;
    consulta()
      .then((datos) => activo && setTerminada({ clave, resultado: { estado: "listo", datos } }))
      .catch((e: unknown) => {
        if (!activo) return;
        const resultado: Terminada<T> =
          e instanceof ErrorApi
            ? { estado: "error", mensaje: e.message, status: e.status }
            : { estado: "error", mensaje: "Ocurrió un error inesperado. Intenta de nuevo.", status: 0 };
        setTerminada({ clave, resultado });
      });
    return () => {
      activo = false;
    };
    // `consulta` se vuelve a crear en cada render; la clave resume lo que la hace cambiar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);

  const resultado: EstadoConsulta<T> =
    terminada && terminada.clave === clave ? terminada.resultado : { estado: "cargando" };
  const recargar = useCallback(() => setVersion((v) => v + 1), []);
  return { resultado, recargar };
}
