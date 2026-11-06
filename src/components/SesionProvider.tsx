"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { restaurarSesion } from "@/lib/api";
import * as auth from "@/lib/auth";
import type { Ingresar, Rol, UsuarioSesion } from "@/lib/tipos-auth";

type EstadoSesion = "cargando" | "anonimo" | "autenticado";

interface ValorSesion {
  estado: EstadoSesion;
  usuario: UsuarioSesion | null;
  ingresar: (datos: Ingresar) => Promise<UsuarioSesion>;
  salir: () => Promise<void>;
  /** ¿Tiene alguno de estos roles? Sin argumentos: ¿tiene cualquier rol de panel? */
  tieneRol: (...roles: Rol[]) => boolean;
  /** Tiene algún rol distinto de SOLICITANTE (acceso al panel). */
  esPersonal: boolean;
}

const Contexto = createContext<ValorSesion | null>(null);

/** El access token vive en memoria; al cargar la página se recupera con la cookie de refresco. */
export function SesionProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoSesion>("cargando");
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        if (await restaurarSesion()) {
          const yo = await auth.obtenerYo();
          if (!activo) return;
          setUsuario(yo);
          setEstado("autenticado");
          return;
        }
      } catch {
        // sin sesión válida
      }
      if (activo) setEstado("anonimo");
    })();
    return () => {
      activo = false;
    };
  }, []);

  const ingresar = useCallback(async (datos: Ingresar) => {
    const yo = await auth.ingresar(datos);
    setUsuario(yo);
    setEstado("autenticado");
    return yo;
  }, []);

  const salir = useCallback(async () => {
    try {
      await auth.salir();
    } finally {
      setUsuario(null);
      setEstado("anonimo");
    }
  }, []);

  const valor = useMemo<ValorSesion>(() => {
    const roles = usuario?.roles.map((r) => r.rol) ?? [];
    return {
      estado,
      usuario,
      ingresar,
      salir,
      tieneRol: (...pedidos) =>
        pedidos.length === 0 ? roles.length > 0 : pedidos.some((r) => roles.includes(r)),
      esPersonal: roles.some((r) => r !== "SOLICITANTE"),
    };
  }, [estado, usuario, ingresar, salir]);

  return <Contexto value={valor}>{children}</Contexto>;
}

export function useSesion(): ValorSesion {
  const valor = useContext(Contexto);
  if (!valor) throw new Error("useSesion debe usarse dentro de SesionProvider");
  return valor;
}
