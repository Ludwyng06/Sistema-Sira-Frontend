import type { Metadata } from "next";
import { Suspense } from "react";
import { DetalleSolicitud } from "@/components/DetalleSolicitud";

export const metadata: Metadata = { title: "Detalle de la solicitud" };

export default function PaginaDetalle(props: PageProps<"/mis-solicitudes/[id]">) {
  return (
    <Suspense>
      <Contenido params={props.params} />
    </Suspense>
  );
}

async function Contenido({ params }: { params: PageProps<"/mis-solicitudes/[id]">["params"] }) {
  const { id } = await params;
  return <DetalleSolicitud id={id} modo="solicitante" rutaVolver="/mis-solicitudes" />;
}
