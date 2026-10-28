import { api, fijarToken } from "./api";
import type {
  Ingresar,
  Mensaje,
  Registro,
  RegistroRespuesta,
  Sesion,
  UsuarioSesion,
  VerificarCorreo,
} from "./tipos-auth";

export const registrar = (datos: Registro) =>
  api<RegistroRespuesta>("/auth/registro", { method: "POST", json: datos });

export const verificarCorreo = (datos: VerificarCorreo) =>
  api<Mensaje>("/auth/verificar-correo", { method: "POST", json: datos });

export const reenviarCodigo = (correo: string) =>
  api<Mensaje>("/auth/reenviar-codigo", { method: "POST", json: { correo } });

export async function ingresar(datos: Ingresar): Promise<UsuarioSesion> {
  const sesion = await api<Sesion>("/auth/ingresar", { method: "POST", json: datos });
  fijarToken(sesion.accessToken);
  return obtenerYo();
}

export async function salir(): Promise<void> {
  try {
    await api<void>("/auth/salir", { method: "POST" });
  } finally {
    fijarToken(null);
  }
}

export const recuperar = (correo: string) =>
  api<Mensaje>("/auth/recuperar", { method: "POST", json: { correo } });

export const restablecer = (token: string, contrasenaNueva: string) =>
  api<Mensaje>("/auth/restablecer", { method: "POST", json: { token, contrasenaNueva } });

export const obtenerYo = () => api<UsuarioSesion>("/auth/yo");
