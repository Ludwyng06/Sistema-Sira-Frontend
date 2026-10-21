import type { Metadata } from "next";
import { Suspense } from "react";
import { TarjetaFormulario } from "@/components/formularios";
import { FormularioIngreso } from "./formulario-ingreso";

export const metadata: Metadata = { title: "Ingresar" };

const unico = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default function Ingresar(props: PageProps<"/ingresar">) {
  return (
    <TarjetaFormulario
      titulo="Ingresar"
      descripcion="Entra con tu cuenta para solicitar espacios y seguir tus solicitudes."
    >
      <Suspense>
        <Formulario searchParams={props.searchParams} />
      </Suspense>
    </TarjetaFormulario>
  );
}

async function Formulario({
  searchParams,
}: {
  searchParams: PageProps<"/ingresar">["searchParams"];
}) {
  const consulta = await searchParams;
  const aviso = unico(consulta.verificado)
    ? "Tu correo quedó verificado. Ya puedes ingresar."
    : unico(consulta.restablecido)
      ? "Tu contraseña se cambió. Ingresa con la nueva."
      : undefined;
  return <FormularioIngreso siguiente={unico(consulta.siguiente)} aviso={aviso} />;
}
