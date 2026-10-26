"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alerta, Boton, Campo, Selector } from "@/components/formularios";
import { registrar } from "@/lib/auth";
import { VERSION_POLITICA, type Registro } from "@/lib/tipos-auth";
import { avisar } from "@/lib/avisos";

type TipoElegible = Exclude<Registro["tipo"], "INTERNO">;

const TIPOS: { valor: TipoElegible; texto: string }[] = [
  { valor: "PERSONA_NATURAL", texto: "Persona natural" },
  { valor: "EMPRESA", texto: "Empresa" },
  { valor: "ENTIDAD", texto: "Entidad" },
];

const DOCUMENTOS: { valor: Registro["tipoDocumento"]; texto: string }[] = [
  { valor: "CC", texto: "Cédula de ciudadanía" },
  { valor: "CE", texto: "Cédula de extranjería" },
  { valor: "NIT", texto: "NIT" },
  { valor: "TI", texto: "Tarjeta de identidad" },
  { valor: "PASAPORTE", texto: "Pasaporte" },
];

const texto = (datos: FormData, clave: string) => String(datos.get(clave) ?? "").trim();
const opcional = (datos: FormData, clave: string) => texto(datos, clave) || undefined;

export function FormularioRegistro() {
  const router = useRouter();
  const [tipo, setTipo] = useState<TipoElegible>("PERSONA_NATURAL");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorContrasena, setErrorContrasena] = useState<string | undefined>();
  const juridica = tipo !== "PERSONA_NATURAL";

  async function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    const contrasena = String(datos.get("contrasena") ?? "");
    if (contrasena !== String(datos.get("confirmacion") ?? "")) {
      setErrorContrasena("Las dos contraseñas no coinciden.");
      return;
    }
    setErrorContrasena(undefined);
    setEnviando(true);
    setError(null);
    const correo = texto(datos, "correo");
    try {
      await registrar({
        correo,
        contrasena,
        tipo,
        nombres: texto(datos, "nombres"),
        apellidos: opcional(datos, "apellidos"),
        razonSocial: juridica ? opcional(datos, "razonSocial") : undefined,
        representanteLegal: juridica ? opcional(datos, "representanteLegal") : undefined,
        tipoDocumento: texto(datos, "tipoDocumento") as Registro["tipoDocumento"],
        numeroDocumento: texto(datos, "numeroDocumento"),
        telefono: texto(datos, "telefono"),
        direccion: opcional(datos, "direccion"),
        municipio: opcional(datos, "municipio"),
        aceptaPoliticaDatos: datos.get("aceptaPoliticaDatos") === "on",
        versionPolitica: VERSION_POLITICA,
      });
      router.push(`/verificar-correo?correo=${encodeURIComponent(correo)}&enviado=1`);
    } catch (e) {
      avisar.error(e, "No pudimos crear tu cuenta. Intenta de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={alEnviar} className="flex flex-col gap-4">
      {error && <Alerta tipo="error">{error}</Alerta>}

      <Selector
        id="tipo"
        etiqueta="Tipo de solicitante"
        value={tipo}
        onChange={(e) => setTipo(e.target.value as TipoElegible)}
        required
      >
        {TIPOS.map((t) => (
          <option key={t.valor} value={t.valor}>
            {t.texto}
          </option>
        ))}
      </Selector>

      {juridica && (
        <>
          <Campo id="razonSocial" etiqueta="Razón social" required autoComplete="organization" />
          <Campo id="representanteLegal" etiqueta="Representante legal" />
        </>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          id="nombres"
          etiqueta={juridica ? "Nombres del contacto" : "Nombres"}
          required
          autoComplete="given-name"
        />
        <Campo id="apellidos" etiqueta="Apellidos" autoComplete="family-name" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Selector id="tipoDocumento" etiqueta="Tipo de documento" required defaultValue="CC">
          {DOCUMENTOS.map((d) => (
            <option key={d.valor} value={d.valor}>
              {d.texto}
            </option>
          ))}
        </Selector>
        <Campo
          id="numeroDocumento"
          etiqueta="Número de documento"
          ayuda="Letras, números y guion."
          pattern="[A-Za-z0-9\-]+"
          required
        />
      </div>

      <Campo
        id="telefono"
        etiqueta="Teléfono"
        type="tel"
        ayuda="De 7 a 15 dígitos; puede empezar con +."
        pattern="\+?[0-9]{7,15}"
        autoComplete="tel"
        required
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="direccion" etiqueta="Dirección" autoComplete="street-address" />
        <Campo id="municipio" etiqueta="Municipio" />
      </div>

      <Campo id="correo" etiqueta="Correo electrónico" type="email" autoComplete="email" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          id="contrasena"
          etiqueta="Contraseña"
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
          error={errorContrasena}
          autoComplete="new-password"
          required
        />
      </div>

      <div className="flex items-start gap-2">
        <input
          id="aceptaPoliticaDatos"
          name="aceptaPoliticaDatos"
          type="checkbox"
          required
          className="mt-1 size-5 shrink-0"
        />
        <label htmlFor="aceptaPoliticaDatos">
          Acepto la política de tratamiento de datos personales de la Institución
          Universitaria del Putumayo.
        </label>
      </div>

      <Boton type="submit" cargando={enviando}>
        {enviando ? "Creando cuenta…" : "Crear cuenta"}
      </Boton>
      <p className="text-base">
        ¿Ya tienes cuenta?{" "}
        <Link href="/ingresar" className="inline-flex min-h-11 items-center font-bold text-azul-oscuro underline underline-offset-4">
          Ingresar
        </Link>
      </p>
    </form>
  );
}
