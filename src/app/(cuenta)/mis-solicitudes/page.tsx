import type { Metadata } from "next";
import { ListaSolicitudes } from "@/components/ListaSolicitudes";

export const metadata: Metadata = { title: "Mis solicitudes" };

export default function MisSolicitudes() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-extrabold sm:text-4xl">Mis solicitudes</h1>
      <ListaSolicitudes
        ambito="PROPIAS"
        rutaDetalle="/mis-solicitudes"
        vacio={{
          titulo: "Todavía no has hecho ninguna solicitud",
          mensaje: "Busca un espacio y pídelo desde su ficha.",
          accion: { href: "/", texto: "Buscar un espacio" },
        }}
      />
    </div>
  );
}
