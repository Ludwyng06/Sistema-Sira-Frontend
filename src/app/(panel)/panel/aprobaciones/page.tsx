import type { Metadata } from "next";
import { GuardiaSesion } from "@/components/GuardiaSesion";
import { ListaSolicitudes } from "@/components/ListaSolicitudes";

export const metadata: Metadata = { title: "Bandeja de solicitudes" };

export default function BandejaSolicitudes() {
  return (
    <GuardiaSesion roles={["RESPONSABLE_ESPACIO", "APROBADOR", "ADMINISTRADOR", "AUDITOR"]}>
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-t1 font-black">Bandeja de solicitudes</h1>
          <p className="text-gris">Todas las solicitudes que te corresponden, en cualquier estado. Las más recientes primero.</p>
        </header>
        <ListaSolicitudes
          ambito="BANDEJA"
          rutaDetalle="/panel/aprobaciones"
          vacio={{
            titulo: "No tienes solicitudes por revisar",
            mensaje: "Cuando llegue una solicitud a tu bandeja aparecerá aquí.",
          }}
        />
      </div>
    </GuardiaSesion>
  );
}
