import Image from "next/image";
import clsx from "clsx";

const PROPORCION = 483 / 640;

/** Logo oficial de Uniputumayo (la "U" con el sol), recortado de la imagen institucional. */
export function Logo({
  variante = "azul",
  alto = 48,
  titulo,
  className,
  prioridad = false,
}: {
  variante?: "azul" | "blanco";
  alto?: number;
  /** Texto alternativo. Vacío si al lado ya está el nombre escrito. */
  titulo?: string;
  className?: string;
  prioridad?: boolean;
}) {
  return (
    <Image
      src={`/marca/logo-u-${variante}.png`}
      alt={titulo ?? ""}
      width={Math.round(alto * PROPORCION)}
      height={alto}
      unoptimized
      priority={prioridad}
      loading={prioridad ? undefined : "eager"}
      className={clsx("max-w-none shrink-0", className)}
      style={{ height: alto, width: Math.round(alto * PROPORCION) }}
    />
  );
}

/** Logo + nombre, como en la portada institucional. */
export function Marca({
  variante = "azul",
  tamano = "normal",
  detalle,
  className,
}: {
  variante?: "azul" | "blanco";
  tamano?: "normal" | "grande";
  /** Línea pequeña bajo el nombre (por ejemplo, el nombre del sistema). */
  detalle?: string;
  className?: string;
}) {
  const grande = tamano === "grande";
  return (
    <span className={clsx("flex items-center gap-3", className)}>
      <Logo variante={variante} alto={grande ? 72 : 44} />
      <span
        className={clsx(
          "flex flex-col justify-center border-l-2 pl-3 leading-none",
          variante === "blanco" ? "border-white/70 text-white" : "border-azul text-tinta",
        )}
      >
        <span className={clsx("font-marca font-black tracking-tight", grande ? "text-2xl" : "text-base")}>
          UNI
        </span>
        <span className={clsx("font-marca font-black tracking-tight", grande ? "text-4xl" : "text-xl")}>
          PUTUMAYO
        </span>
        {detalle && (
          <span className={clsx("mt-1 font-texto font-medium", "text-meta")}>{detalle}</span>
        )}
      </span>
    </span>
  );
}
