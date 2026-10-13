import { EstadoVacio } from "@/components/EstadoVacio";
import { MarcoInstitucional } from "@/components/MarcoInstitucional";

export default function NoEncontrado() {
  return (
    <MarcoInstitucional>
      <EstadoVacio
        titulo="No encontramos lo que buscas"
        mensaje="El bloque, el espacio o la página que pediste no existe o ya no está disponible."
        accion={{ href: "/", texto: "Volver al inicio" }}
      />
    </MarcoInstitucional>
  );
}
