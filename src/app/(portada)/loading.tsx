import { Contenedor } from "@/components/MarcoInstitucional";
import { Esqueleto } from "@/components/Esqueleto";
import { EsqueletoInicio } from "./esqueleto-inicio";

export default function Cargando() {
  return (
    <>
      <Esqueleto className="h-[28rem] w-full rounded-none" />
      <Contenedor className="py-14">
        <EsqueletoInicio />
      </Contenedor>
    </>
  );
}
