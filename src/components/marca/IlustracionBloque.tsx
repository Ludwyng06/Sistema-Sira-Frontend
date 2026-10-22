import clsx from "clsx";

type Variante = "aulas" | "auditorio" | "cancha";

/** El bloque A son aulas, el B el auditorio y los laboratorios, el C el escenario deportivo. */
const POR_CODIGO: Record<string, Variante> = { A: "aulas", B: "auditorio", C: "cancha" };
const ORDEN: Variante[] = ["aulas", "auditorio", "cancha"];

export function varianteDeBloque(codigo: string): Variante {
  return POR_CODIGO[codigo.toUpperCase()] ?? ORDEN[codigo.charCodeAt(0) % ORDEN.length]!;
}

/**
 * Ilustración plana y propia de cada bloque, en blanco sobre el fondo de la tarjeta.
 * Reemplaza a la foto mientras el almacenamiento de fotos está en pausa.
 */
export function IlustracionBloque({
  codigo,
  className,
}: {
  codigo: string;
  className?: string;
}) {
  const variante = varianteDeBloque(codigo);
  return (
    <svg
      aria-hidden
      viewBox="0 0 320 190"
      className={clsx("block h-full w-full", className)}
      fill="#fff"
      preserveAspectRatio="xMidYMax slice"
    >
      <rect x="0" y="168" width="320" height="22" fillOpacity=".16" />
      {variante === "aulas" && <Aulas />}
      {variante === "auditorio" && <Auditorio />}
      {variante === "cancha" && <Cancha />}
    </svg>
  );
}

function Aulas() {
  const ventanas: React.ReactNode[] = [];
  for (let fila = 0; fila < 3; fila++) {
    for (let col = 0; col < 6; col++) {
      ventanas.push(
        <rect key={`${fila}-${col}`} x={74 + col * 26} y={84 + fila * 26} width="16" height="14" rx="2" fill="#0f4a69" fillOpacity=".55" />,
      );
    }
  }
  return (
    <g>
      <rect x="62" y="72" width="172" height="96" rx="3" fillOpacity=".95" />
      <rect x="226" y="40" width="46" height="128" rx="3" fillOpacity=".78" />
      <rect x="221" y="34" width="56" height="8" rx="2" />
      <rect x="55" y="66" width="186" height="8" rx="2" />
      {ventanas}
      <rect x="234" y="52" width="30" height="12" rx="2" fill="#0f4a69" fillOpacity=".5" />
      <rect x="236" y="82" width="26" height="14" rx="2" fill="#0f4a69" fillOpacity=".5" />
      <rect x="236" y="110" width="26" height="14" rx="2" fill="#0f4a69" fillOpacity=".5" />
      <rect x="128" y="138" width="34" height="30" rx="2" fill="#0f4a69" fillOpacity=".65" />
      <path d="M40 168 q6-22 12 0 M284 168 q8-30 16 0" fill="none" stroke="#fff" strokeWidth="3" strokeOpacity=".7" strokeLinecap="round" />
    </g>
  );
}

function Auditorio() {
  return (
    <g>
      <path d="M34 112 Q160 4 286 112 Z" fillOpacity=".96" />
      <path d="M62 108 Q160 28 258 108 M92 106 Q160 54 228 106" fill="none" stroke="#0f4a69" strokeOpacity=".4" strokeWidth="3" />
      <rect x="34" y="110" width="252" height="58" rx="3" fillOpacity=".82" />
      {[58, 96, 134, 172, 210, 248].map((x) => (
        <rect key={x} x={x} y="118" width="14" height="50" rx="2" fill="#0f4a69" fillOpacity=".5" />
      ))}
      <rect x="134" y="132" width="52" height="36" rx="3" fill="#0f4a69" fillOpacity=".7" />
      <path d="M118 168 h84" stroke="#fff" strokeWidth="4" />
    </g>
  );
}

function Cancha() {
  return (
    <g>
      <path d="M52 168 L96 100 H244 L288 168 Z" fillOpacity=".92" />
      <path d="M60 156 L102 108 H238 L280 156 Z" fill="#0f4a69" fillOpacity=".25" />
      <path d="M160 108 V156" stroke="#fff" strokeWidth="3" />
      <ellipse cx="160" cy="132" rx="26" ry="12" fill="none" stroke="#fff" strokeWidth="3" />
      <path d="M70 168 V56 M250 168 V56" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeOpacity=".9" />
      <path d="M52 56 H90 M230 56 H268" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      <path d="M52 56 Q70 40 90 56 M230 56 Q250 40 268 56" fill="none" stroke="#fff" strokeWidth="3" strokeOpacity=".7" />
      <rect x="128" y="62" width="64" height="22" rx="3" fillOpacity=".5" />
    </g>
  );
}
