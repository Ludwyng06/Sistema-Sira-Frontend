import clsx from "clsx";

const RAYOS = 20;

/** Rayos con largo y ancho ligeramente distintos, como el sol dibujado a mano del logo. */
const RAYOS_TRAZADOS = Array.from({ length: RAYOS }, (_, i) => {
  const centro = (i / RAYOS) * Math.PI * 2;
  const variacion = ((i * 37) % 11) / 11;
  const interior = 40 + variacion * 3;
  const exterior = 88 + ((i * 53) % 7) * 0.9;
  const medioAncho = 0.062 + ((i * 29) % 5) * 0.004;
  const punto = (radio: number, delta: number) => {
    const ang = centro + delta;
    return `${(Math.cos(ang) * radio).toFixed(2)},${(Math.sin(ang) * radio).toFixed(2)}`;
  };
  return `M${punto(interior, -medioAncho * 0.55)} L${punto(exterior, -medioAncho)} L${punto(exterior, medioAncho)} L${punto(interior, medioAncho * 0.55)} Z`;
});

/**
 * Sol radial inspirado en el logo de la Institución. Es decorativo (aria-hidden)
 * y toma el color de `currentColor`. Con `girar` rota muy despacio.
 */
export function SolRadial({
  girar = true,
  className,
}: {
  girar?: boolean;
  className?: string;
}) {
  return (
    <svg
      aria-hidden
      viewBox="-104 -104 208 208"
      className={clsx("block", className)}
      fill="currentColor"
      stroke="currentColor"
      strokeLinejoin="round"
    >
      <g className={girar ? "anim-girar" : undefined}>
        {RAYOS_TRAZADOS.map((d, i) => (
          <path key={i} d={d} strokeWidth="2.4" />
        ))}
      </g>
      <circle r="31" fill="none" strokeWidth="5" />
      <circle r="16" fill="none" strokeWidth="5" />
      <circle r="5" stroke="none" />
      <path d="M-26,-97 A100,100 0 1,1 55,84" fill="none" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}
