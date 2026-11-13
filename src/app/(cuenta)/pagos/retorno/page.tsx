import type { Metadata } from "next";
import { Suspense } from "react";
import { RetornoPago } from "@/components/RetornoPago";
import CargandoRetornoPago from "./loading";

export const metadata: Metadata = { title: "Estado del pago" };

export default function PaginaRetornoPago({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <Suspense fallback={<CargandoRetornoPago />}><Contenido searchParams={searchParams} /></Suspense>;
}

async function Contenido({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Ignora id/status/referencia/valor de Wompi: no son prueba del resultado.
  const { orden } = await searchParams;
  const ordenId = typeof orden === "string" && orden.trim() ? orden.trim() : null;
  return <RetornoPago key={ordenId} ordenId={ordenId} />;
}
