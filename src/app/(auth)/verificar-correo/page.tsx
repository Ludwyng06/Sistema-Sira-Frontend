import type { Metadata } from "next";
import { Suspense } from "react";
import { TarjetaFormulario } from "@/components/formularios";
import { FormularioVerificacion } from "./formulario-verificacion";

export const metadata: Metadata = { title: "Verificar correo" };

const unico = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default function VerificarCorreo(props: PageProps<"/verificar-correo">) {
  return (
    <TarjetaFormulario
      titulo="Verifica tu correo"
      descripcion="Escribe el código de 6 dígitos que te enviamos para activar tu cuenta."
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
  searchParams: PageProps<"/verificar-correo">["searchParams"];
}) {
  const consulta = await searchParams;
  return (
    <FormularioVerificacion
      correoInicial={unico(consulta.correo)}
      recienEnviado={unico(consulta.enviado) === "1"}
    />
  );
}
