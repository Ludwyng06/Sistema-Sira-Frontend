import { Ban, TriangleAlert, Users } from "lucide-react";
import clsx from "clsx";
import type { EvaluacionAforo } from "@/lib/tipos";

/** Ícono + número + texto. El nivel nunca se comunica solo con color. */
export function IndicadorAforo({
  capacidad,
  aforo,
  grande = false,
}: {
  capacidad: number;
  aforo?: EvaluacionAforo;
  grande?: boolean;
}) {
  const nivel = aforo?.nivel;
  const Icono =
    nivel === "NO_CABE" ? Ban : nivel === "SOBRA_ESPACIO" ? TriangleAlert : Users;
  const etiqueta =
    nivel === "NO_CABE"
      ? "No caben"
      : nivel === "SOBRA_ESPACIO"
        ? "Sobra espacio"
        : nivel === "ADECUADO"
          ? "Adecuado"
          : null;

  return (
    <div className="flex flex-col gap-1">
      <p
        className={clsx(
          "flex items-center gap-2 font-titulo font-bold",
          grande ? "text-2xl" : "text-lg",
          nivel === "NO_CABE" ? "text-gris" : "text-azul-oscuro",
        )}
      >
        <Icono aria-hidden className={grande ? "size-7" : "size-5"} />
        <span>
          {capacidad} <span className="font-medium">personas</span>
        </span>
      </p>
      {etiqueta && aforo && (
        <p
          className={clsx(
            "w-fit rounded px-2 py-0.5 text-sm font-medium",
            nivel === "NO_CABE" && "border border-dashed border-gris text-gris",
            nivel === "SOBRA_ESPACIO" &&
              "border-l-4 border-naranja bg-fondo-suave text-texto",
            nivel === "ADECUADO" &&
              "border-l-4 border-verde bg-fondo-suave text-texto",
          )}
        >
          {etiqueta}: {aforo.mensaje}
        </p>
      )}
    </div>
  );
}
