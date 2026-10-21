"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alerta, Boton, Campo } from "@/components/formularios";
import { ErrorApi } from "@/lib/api";
import { restablecer } from "@/lib/auth";

export function FormularioRestablecer({ token }: { token?: string }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorConfirmacion, setErrorConfirmacion] = useState<string | undefined>();

  if (!token) {
    return (
      <Alerta tipo="error">
        <p>
          El enlace está incompleto. Pide uno nuevo desde{" "}
          <Link href="/recuperar" className="font-medium underline underline-offset-4">
            Recuperar contraseña
          </Link>
          .
        </p>
      </Alerta>
    );
  }

  async function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    const contrasena = String(datos.get("contrasena") ?? "");
    if (contrasena !== String(datos.get("confirmacion") ?? "")) {
      setErrorConfirmacion("Las dos contraseñas no coinciden.");
      return;
    }
    setErrorConfirmacion(undefined);
    setEnviando(true);
    setError(null);
    try {
      await restablecer(token as string, contrasena);
      router.push("/ingresar?restablecido=1");
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : "No pudimos cambiar tu contraseña. Intenta de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={alEnviar} className="flex flex-col gap-4">
      {error && <Alerta tipo="error">{error}</Alerta>}
      <Campo
        id="contrasena"
        etiqueta="Contraseña nueva"
        type="password"
        ayuda="Mínimo 10 caracteres."
        minLength={10}
        maxLength={128}
        autoComplete="new-password"
        required
      />
      <Campo
        id="confirmacion"
        etiqueta="Repite la contraseña"
        type="password"
        error={errorConfirmacion}
        autoComplete="new-password"
        required
      />
      <Boton type="submit" cargando={enviando}>
        {enviando ? "Guardando…" : "Guardar contraseña"}
      </Boton>
    </form>
  );
}
