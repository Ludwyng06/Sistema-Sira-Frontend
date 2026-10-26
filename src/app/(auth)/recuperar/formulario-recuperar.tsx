"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Alerta, Boton, Campo } from "@/components/formularios";
import { recuperar } from "@/lib/auth";
import { avisar } from "@/lib/avisos";

export function FormularioRecuperar() {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    setEnviando(true);
    setError(null);
    try {
      const respuesta = await recuperar(String(datos.get("correo") ?? "").trim());
      setMensaje(respuesta.mensaje);
    } catch (e) {
      avisar.error(e, "No pudimos enviar el enlace. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={alEnviar} className="flex flex-col gap-4">
      {mensaje && <Alerta tipo="exito">{mensaje}</Alerta>}
      {error && <Alerta tipo="error">{error}</Alerta>}
      <Campo id="correo" etiqueta="Correo electrónico" type="email" autoComplete="email" required />
      <Boton type="submit" cargando={enviando}>
        {enviando ? "Enviando…" : "Enviar enlace"}
      </Boton>
      <p className="text-base">
        <Link href="/ingresar" className="text-azul-oscuro underline underline-offset-4">
          Volver a ingresar
        </Link>
      </p>
    </form>
  );
}
