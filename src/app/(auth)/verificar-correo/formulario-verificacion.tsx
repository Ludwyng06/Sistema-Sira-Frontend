"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alerta, Boton, Campo } from "@/components/formularios";
import { ErrorApi } from "@/lib/api";
import { reenviarCodigo, verificarCorreo } from "@/lib/auth";

export function FormularioVerificacion({
  correoInicial = "",
  recienEnviado,
}: {
  correoInicial?: string;
  recienEnviado: boolean;
}) {
  const router = useRouter();
  const [correo, setCorreo] = useState(correoInicial);
  const [enviando, setEnviando] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(
    recienEnviado ? "Te enviamos un código de 6 dígitos a tu correo." : null,
  );

  async function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    setEnviando(true);
    setError(null);
    try {
      await verificarCorreo({
        correo: correo.trim(),
        codigo: String(datos.get("codigo") ?? "").trim(),
      });
      router.push("/ingresar?verificado=1");
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : "No pudimos verificar el código. Intenta de nuevo.");
      setEnviando(false);
    }
  }

  async function reenviar() {
    if (!correo.trim()) {
      setError("Escribe tu correo para reenviarte el código.");
      return;
    }
    setReenviando(true);
    setError(null);
    try {
      const respuesta = await reenviarCodigo(correo.trim());
      setAviso(respuesta.mensaje);
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : "No pudimos reenviar el código. Intenta de nuevo.");
    } finally {
      setReenviando(false);
    }
  }

  return (
    <form onSubmit={alEnviar} className="flex flex-col gap-4">
      {aviso && <Alerta tipo="exito">{aviso}</Alerta>}
      {error && <Alerta tipo="error">{error}</Alerta>}
      <Campo
        id="correo"
        etiqueta="Correo electrónico"
        type="email"
        value={correo}
        onChange={(e) => setCorreo(e.target.value)}
        autoComplete="email"
        required
      />
      <Campo
        id="codigo"
        etiqueta="Código de verificación"
        inputMode="numeric"
        pattern="[0-9]{6}"
        maxLength={6}
        autoComplete="one-time-code"
        required
      />
      <Boton type="submit" cargando={enviando}>
        {enviando ? "Verificando…" : "Verificar correo"}
      </Boton>
      <Boton variante="secundario" onClick={reenviar} cargando={reenviando}>
        {reenviando ? "Reenviando…" : "Reenviar el código"}
      </Boton>
    </form>
  );
}
