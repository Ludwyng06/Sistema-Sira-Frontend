import type { Metadata } from "next";
import { Suspense } from "react";
import { GuardiaSesion } from "@/components/GuardiaSesion";
import { FormularioActa } from "./formulario-acta";

export const metadata: Metadata = { title: "Acta" };

export default function PaginaActa(props: PageProps<"/panel/actas/[solicitudId]">) {
  return (
    <GuardiaSesion roles={["RESPONSABLE_ESPACIO"]}>
      <Suspense>
        <Contenido params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </GuardiaSesion>
  );
}

async function Contenido({
  params,
  searchParams,
}: {
  params: PageProps<"/panel/actas/[solicitudId]">["params"];
  searchParams: PageProps<"/panel/actas/[solicitudId]">["searchParams"];
}) {
  const { solicitudId } = await params;
  const consulta = await searchParams;
  const tipo = (Array.isArray(consulta.tipo) ? consulta.tipo[0] : consulta.tipo) === "DEVOLUCION"
    ? "DEVOLUCION"
    : "ENTREGA";
  return <FormularioActa solicitudId={solicitudId} tipo={tipo} />;
}
