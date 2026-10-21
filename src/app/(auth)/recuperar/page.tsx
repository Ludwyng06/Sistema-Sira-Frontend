import type { Metadata } from "next";
import { TarjetaFormulario } from "@/components/formularios";
import { FormularioRecuperar } from "./formulario-recuperar";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function Recuperar() {
  return (
    <TarjetaFormulario
      titulo="Recuperar contraseña"
      descripcion="Escribe tu correo y te enviamos un enlace para crear una contraseña nueva."
    >
      <FormularioRecuperar />
    </TarjetaFormulario>
  );
}
