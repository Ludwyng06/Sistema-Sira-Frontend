import type { Metadata } from "next";
import { TarjetaFormulario } from "@/components/formularios";
import { FormularioRegistro } from "./formulario-registro";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function Registro() {
  return (
    <TarjetaFormulario
      titulo="Crear cuenta"
      descripcion="Si usas tu correo institucional, el sistema lo reconoce y te registra como usuario interno."
    >
      <FormularioRegistro />
    </TarjetaFormulario>
  );
}
