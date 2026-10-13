import Image from "next/image";
import { ImageOff } from "lucide-react";
import clsx from "clsx";
import type { Foto as TipoFoto } from "@/lib/tipos";

/** Foto con alt obligatorio, o un marcador cuando aún no hay. */
export function Foto({
  foto,
  className,
  marcador = "Foto pendiente",
}: {
  foto: TipoFoto | null | undefined;
  className?: string;
  marcador?: string;
}) {
  if (!foto) {
    return (
      <div
        className={clsx(
          "flex items-center justify-center gap-2 bg-fondo-suave text-sm text-gris",
          className,
        )}
      >
        <ImageOff aria-hidden className="size-5" />
        <span>{marcador}</span>
      </div>
    );
  }
  return (
    <div className={clsx("relative overflow-hidden bg-fondo-suave", className)}>
      <Image
        src={foto.url}
        alt={foto.alt}
        fill
        unoptimized
        sizes="(max-width: 640px) 100vw, 400px"
        className="object-cover"
      />
    </div>
  );
}
