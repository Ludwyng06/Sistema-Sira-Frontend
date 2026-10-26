import clsx from "clsx";
import { SolRadial } from "./SolRadial";

/**
 * Sello de entrada, como los de un pasaporte: doble anillo, texto sobre el borde y el sol
 * del logo al centro. Es decorativo: se estampa una vez al cargar.
 */
export function SelloEntrada({ className }: { className?: string }) {
  return (
    <div aria-hidden className={clsx("anim-estampa relative aspect-square", className)}>
      <svg viewBox="0 0 240 240" className="absolute inset-0 size-full" fill="none" stroke="currentColor">
        <defs>
          <path id="arco-superior" d="M 36 120 A 84 84 0 0 1 204 120" />
          <path id="arco-inferior" d="M 28 120 A 92 92 0 0 0 212 120" />
        </defs>
        <circle cx="120" cy="120" r="112" strokeWidth="4" />
        <circle cx="120" cy="120" r="104" strokeWidth="1.5" />
        <circle cx="120" cy="120" r="66" strokeWidth="1.5" strokeDasharray="2 5" strokeLinecap="round" />
        <g fill="currentColor" stroke="none" fontFamily="var(--font-montserrat), sans-serif" fontWeight="900" letterSpacing="1.5">
          <text fontSize="14">
            <textPath href="#arco-superior" startOffset="50%" textAnchor="middle">
              UNIPUTUMAYO · MOCOA
            </textPath>
          </text>
          <text fontSize="13">
            <textPath href="#arco-inferior" startOffset="50%" textAnchor="middle" dominantBaseline="hanging">
              ★ ENTRADA ★
            </textPath>
          </text>
        </g>
      </svg>
      <SolRadial className="absolute inset-[30%] text-current" />
    </div>
  );
}
