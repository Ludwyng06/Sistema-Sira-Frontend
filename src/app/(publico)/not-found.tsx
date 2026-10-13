import { EstadoVacio } from "@/components/EstadoVacio";

export default function NoEncontradoPublico() {
  return (
    <EstadoVacio
      titulo="No encontramos lo que buscas"
      mensaje="El bloque o el espacio que pediste no existe o ya no está disponible."
      accion={{ href: "/", texto: "Volver al inicio" }}
    />
  );
}
