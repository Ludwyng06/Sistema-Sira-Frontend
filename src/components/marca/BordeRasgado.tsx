import clsx from "clsx";

/** Generador pseudoaleatorio con semilla: el borde es siempre el mismo (no cambia entre cargas). */
function azar(semilla: number) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Puntos de un corte de papel rasgado a lo largo de 1000 unidades. */
function puntos(cantidad: number, amplitud: number, semilla: number): [number, number][] {
  const r = azar(semilla);
  const lista: [number, number][] = [];
  for (let i = 0; i <= cantidad; i++) {
    const ondulacion = Math.sin((i / cantidad) * Math.PI * 3.1 + semilla) * 0.18;
    lista.push([(i / cantidad) * 1000, amplitud * (0.5 + ondulacion + (r() - 0.5) * 0.85)]);
  }
  return lista;
}

/**
 * Borde de papel rasgado, la firma visual de la portada institucional.
 * - horizontal: la forma ocupa `ocupa` ("abajo" o "arriba") del corte.
 * - vertical: la forma ocupa el lado `ocupa` ("derecha" o "izquierda").
 * Toma el color de `currentColor`: se pinta con una clase `text-...`.
 */
export function BordeRasgado({
  orientacion = "horizontal",
  ocupa = "abajo",
  semilla = 7,
  tamano = "normal",
  className,
}: {
  orientacion?: "horizontal" | "vertical";
  ocupa?: "abajo" | "arriba" | "izquierda" | "derecha";
  semilla?: number;
  /** "fino" para bordes pequeños, como el de las tarjetas. */
  tamano?: "normal" | "fino";
  className?: string;
}) {
  const ALTO = 40;
  const pts = puntos(46, ALTO * 0.95, semilla);

  if (orientacion === "horizontal") {
    const lineas = pts.map(([x, y]) => `L${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
    const base = ocupa === "abajo" ? ALTO : 0;
    const d = `M0,${base} ${lineas} L1000,${base} Z`;
    return (
      <svg
        aria-hidden
        viewBox={`0 0 1000 ${ALTO}`}
        preserveAspectRatio="none"
        className={clsx("block w-full", tamano === "fino" ? "h-4 sm:h-5" : "h-8 sm:h-12", className)}
        fill="currentColor"
      >
        <path d={d} />
      </svg>
    );
  }

  const lineas = pts.map(([x, y]) => `L${y.toFixed(1)},${x.toFixed(1)}`).join(" ");
  const base = ocupa === "derecha" ? ALTO : 0;
  const d = `M${base},0 ${lineas} L${base},1000 Z`;
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${ALTO} 1000`}
      preserveAspectRatio="none"
      className={clsx("block h-full", tamano === "fino" ? "w-4 sm:w-5" : "w-8 sm:w-12", className)}
      fill="currentColor"
    >
      <path d={d} />
    </svg>
  );
}
