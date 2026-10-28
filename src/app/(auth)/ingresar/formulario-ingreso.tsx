"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alerta, Boton, Campo } from "@/components/formularios";
import { useSesion } from "@/components/SesionProvider";
import { ErrorApi } from "@/lib/api";
import { avisar } from "@/lib/avisos";

/** Solo rutas internas: evita redirecciones a otros sitios. */
function destinoSeguro(siguiente?: string): string | null {
  return siguiente && siguiente.startsWith("/") && !siguiente.startsWith("//")
    ? siguiente
    : null;
}

export function FormularioIngreso({
  siguiente,
  aviso,
}: {
  siguiente?: string;
  aviso?: string;
}) {
  const { ingresar } = useSesion();
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [correoSinVerificar, setCorreoSinVerificar] = useState<string | null>(null);

  async function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    const correo = String(datos.get("correo") ?? "").trim();
    setEnviando(true);
    setError(null);
    setCorreoSinVerificar(null);
    try {
      const usuario = await ingresar({
        correo,
        contrasena: String(datos.get("contrasena") ?? ""),
      });
      const personal = usuario.roles.some((r) => r.rol !== "SOLICITANTE");
      const destino = destinoSeguro(siguiente) ?? (personal ? "/panel" : "/mis-solicitudes");
      router.push(destino);
      // Respaldo: si la navegación del cliente no avanza, se carga la página completa
      // (la sesión se recupera con la cookie de refresco).
      setTimeout(() => {
        if (window.location.pathname === "/ingresar") window.location.assign(destino);
      }, 4000);
    } catch (e) {
      avisar.error(e, "No pudimos iniciar tu sesión. Intenta de nuevo.");
      if (e instanceof ErrorApi && e.codigo.includes("CORREO")) setCorreoSinVerificar(correo);
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={alEnviar} className="flex flex-col gap-4">
      {aviso && <Alerta tipo="exito">{aviso}</Alerta>}
      {error && (
        <Alerta tipo="error">
          <p>{error}</p>
          {correoSinVerificar && (
            <p className="mt-1">
              <Link
                href={`/verificar-correo?correo=${encodeURIComponent(correoSinVerificar)}`}
                className="font-medium text-azul-oscuro underline underline-offset-4"
              >
                Verificar mi correo
              </Link>
            </p>
          )}
        </Alerta>
      )}
      <Campo
        id="correo"
        etiqueta="Correo electrónico"
        type="email"
        autoComplete="email"
        required
      />
      <Campo
        id="contrasena"
        etiqueta="Contraseña"
        type="password"
        autoComplete="current-password"
        required
      />
      <Boton type="submit" cargando={enviando}>
        {enviando ? "Ingresando…" : "Ingresar"}
      </Boton>
      <Link
        href="/recuperar"
        className="inline-flex min-h-11 w-fit items-center font-bold text-azul-oscuro underline decoration-turquesa decoration-2 underline-offset-4"
      >
        Olvidé mi contraseña
      </Link>
      <div className="flex flex-col gap-3 border-t border-gris-claro/60 pt-5">
        <p className="text-gris">¿Es tu primera vez?</p>
        <Link
          href="/registro"
          className="inline-flex min-h-12 items-center justify-center rounded-campo border-2 border-azul px-5 font-bold text-azul-oscuro transition-colors hover:bg-turquesa-suave"
        >
          Crear una cuenta
        </Link>
      </div>
    </form>
  );
}
