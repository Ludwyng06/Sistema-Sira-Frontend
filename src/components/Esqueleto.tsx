import clsx from "clsx";

/** Bloque gris pulsante: los esqueletos imitan la forma del contenido. */
export function Esqueleto({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={clsx("animate-pulse rounded-campo bg-gris-claro/50", className)}
    />
  );
}

/** Región con aria-busy para lectores de pantalla. */
export function RegionCargando({
  etiqueta,
  children,
}: {
  etiqueta: string;
  children: React.ReactNode;
}) {
  return (
    <div role="status" aria-busy="true" aria-label={etiqueta}>
      {children}
    </div>
  );
}
