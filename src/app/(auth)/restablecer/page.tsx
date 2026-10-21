import type { Metadata } from "next";
import { Suspense } from "react";
import { TarjetaFormulario } from "@/components/formularios";
import { FormularioRestablecer } from "./formulario-restablecer";

export const metadata: Metadata = { title: "Nueva contraseña" };

export default function Restablecer(props: PageProps<"/restablecer">) {
  return (
    <TarjetaFormulario titulo="Crea tu nueva contraseña">
      <Suspense>
        <Formulario searchParams={props.searchParams} />
      </Suspense>
    </TarjetaFormulario>
  );
}

async function Formulario({
  searchParams,
}: {
  searchParams: PageProps<"/restablecer">["searchParams"];
}) {
  const consulta = await searchParams;
  const token = Array.isArray(consulta.token) ? consulta.token[0] : consulta.token;
  return <FormularioRestablecer token={token} />;
}
