import type { Metadata } from "next";
import { Suspense } from "react";
import { DetalleSolicitud } from "@/components/DetalleSolicitud";
import { GuardiaSesion } from "@/components/GuardiaSesion";

export const metadata: Metadata = { title: "Revisar solicitud" };

export default function RevisarSolicitud(props: PageProps<"/panel/aprobaciones/[id]">) {
  return (
    <GuardiaSesion roles={["RESPONSABLE_ESPACIO", "APROBADOR", "ADMINISTRADOR", "AUDITOR"]}>
      <Suspense>
        <Contenido params={props.params} />
      </Suspense>
    </GuardiaSesion>
  );
}

async function Contenido({
  params,
}: {
  params: PageProps<"/panel/aprobaciones/[id]">["params"];
}) {
  const { id } = await params;
  return <DetalleSolicitud id={id} modo="revisor" rutaVolver="/panel/aprobaciones" />;
}
