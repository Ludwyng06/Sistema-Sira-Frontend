import Link from "next/link";
import clsx from "clsx";
import type { BloqueResumen } from "@/lib/tipos";

const ANCHO = 680;
const ALTO = 620;
const pct = (valor: number, total: number) => `${((valor / total) * 100).toFixed(2)}%`;

interface ZonaCampus {
  codigo: string;
  etiqueta: string;
  subtitulo: string;
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

/**
 * Posiciones reales tomadas del levantamiento topográfico TOPOGRAFIA UNIPUTUMAYO.dwg
 * (x = 1047260..1047445, y = 619590..619980).
 * Norte arriba, Sur abajo (Q. La Taruquita).
 */
const ZONAS: ZonaCampus[] = [
  {
    codigo: "D",
    etiqueta: "D · Labs y Auditorio",
    subtitulo: "Auditorio · Labs Ing. · Cafetería",
    x: 42,
    y: 34,
    ancho: 230,
    alto: 126,
  },
  {
    codigo: "E",
    etiqueta: "E · Deportivos",
    subtitulo: "Cancha Sintética · Coliseo",
    x: 292,
    y: 112,
    ancho: 196,
    alto: 112,
  },
  {
    codigo: "C",
    etiqueta: "Bloque C",
    subtitulo: "P1: C101–C104 · P2: C201–C204",
    x: 504,
    y: 118,
    ancho: 138,
    alto: 114,
  },
  {
    codigo: "F",
    etiqueta: "F · Biblioteca y Admón.",
    subtitulo: "Biblioteca · Rectoría · CIECYT",
    x: 416,
    y: 266,
    ancho: 226,
    alto: 126,
  },
  {
    codigo: "A",
    etiqueta: "Bloque A (Zona A)",
    subtitulo: "Aulas 105–125 · Salas info 118–123 · OF 101–104",
    x: 42,
    y: 368,
    ancho: 326,
    alto: 156,
  },
  {
    codigo: "B",
    etiqueta: "Bloque B",
    subtitulo: "P1: B101–B105 · P2: B201–B205",
    x: 444,
    y: 448,
    ancho: 196,
    alto: 118,
  },
];

export function PlanoCampus({
  bloques,
  sede,
  asistentes,
  className,
}: {
  bloques?: BloqueResumen[];
  sede: string;
  asistentes?: number;
  className?: string;
}) {
  const porCodigo = new Map((bloques ?? []).map((b) => [b.codigo.toUpperCase(), b]));

  return (
    <figure className={clsx("flex flex-col gap-4", className)}>
      <div
        role="group"
        aria-label="Plano general del campus Mocoa según levantamiento topográfico TOPOGRAFIA UNIPUTUMAYO.dwg"
        className="relative aspect-[68/62] w-full"
      >
        <svg
          aria-hidden
          viewBox={`0 0 ${ANCHO} ${ALTO}`}
          className="absolute inset-0 h-full w-full"
          fill="none"
          stroke="#fff"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <defs>
            <pattern id="cuadricula" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M30 0H0V30" stroke="#fff" strokeOpacity=".08" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width={ANCHO} height={ALTO} fill="url(#cuadricula)" stroke="none" />

          {/* Curvas de nivel y Quebrada central / Q. La Taruquita al sur */}
          <g strokeOpacity=".18" strokeWidth="1.4">
            <path d="M12 248 C 140 236 260 264 388 250 S 560 238 668 254" strokeDasharray="6 4" />
            <path d="M12 586 C 160 572 310 604 460 584 S 590 576 668 594" stroke="#7dd3fc" strokeOpacity=".45" strokeWidth="2.2" />
          </g>
          <text x="160" y="606" fill="#bae6fd" fontSize="10" fontWeight="700" stroke="none">
            Q. La Taruquita
          </text>
          <text x="210" y="244" fill="#bae6fd" fontSize="9.5" fontWeight="600" stroke="none" opacity=".8">
            Quebrada · Estanque · Casa Vieja
          </text>

          {/* Vía vehicular y senderos internos del DWG */}
          <path
            className="plano-trazo"
            pathLength={1}
            style={{ ["--retardo" as string]: "0.9s", strokeDasharray: "0.02 0.015" }}
            d="M412 420 L 382 420 L 352 340 L 284 220 L 284 60"
            strokeWidth="2.2"
            strokeOpacity=".65"
          />

          {/* Siluetas internas fieles a TOPOGRAFIA UNIPUTUMAYO.dwg */}
          <g strokeWidth="2">
            {/* D: Edificio de Laboratorios, Auditorio y Cafetería */}
            <rect x="42" y="34" width="230" height="126" rx="4" fill="#fff" fillOpacity=".07" />
            <g strokeOpacity=".35" strokeWidth="1.2">
              <rect x="52" y="44" width="102" height="106" rx="2" />
              <rect x="162" y="44" width="100" height="46" rx="2" />
              <rect x="162" y="96" width="100" height="54" rx="2" />
            </g>

            {/* E: Cancha Sintética y Coliseo */}
            <rect x="292" y="112" width="196" height="112" rx="4" fill="#fff" fillOpacity=".06" />
            <g strokeOpacity=".5" strokeWidth="1.3">
              {/* Cancha Sintética */}
              <rect x="302" y="124" width="84" height="88" rx="2" />
              <line x1="302" y1="168" x2="386" y2="168" />
              <circle cx="344" cy="168" r="11" />
              {/* Coliseo */}
              <rect x="396" y="122" width="82" height="92" rx="18" />
              <path d="M408 138 C428 158 428 178 408 198 M437 132 C447 156 447 180 437 204 M466 138 C446 158 446 178 466 198" />
            </g>

            {/* C: Bloque C (C101-C104 / C201-C204 + Baterías Sanitarias) */}
            <rect x="504" y="118" width="138" height="114" rx="4" fill="#fff" fillOpacity=".07" />
            <g strokeOpacity=".35" strokeWidth="1.2">
              <line x1="514" y1="142" x2="632" y2="142" />
              <line x1="514" y1="164" x2="632" y2="164" />
              <line x1="514" y1="186" x2="632" y2="186" />
              <line x1="514" y1="208" x2="632" y2="208" />
            </g>

            {/* F: Biblioteca, Rectoría, Vicerrectorías, Laboratorio y CIECYT */}
            <rect x="416" y="266" width="226" height="126" rx="4" fill="#fff" fillOpacity=".07" />
            <g strokeOpacity=".35" strokeWidth="1.2">
              <rect x="426" y="276" width="96" height="46" rx="2" />
              <rect x="530" y="276" width="102" height="58" rx="2" />
              <rect x="426" y="330" width="96" height="52" rx="2" />
              <rect x="530" y="342" width="102" height="40" rx="2" />
            </g>

            {/* A: Bloque A (Zona A en forma escalonada con Plazoleta y Kiosco) */}
            <rect x="42" y="368" width="326" height="156" rx="4" fill="#fff" fillOpacity=".08" />
            <g strokeOpacity=".35" strokeWidth="1.2">
              <rect x="210" y="376" width="96" height="36" rx="2" />
              <rect x="114" y="418" width="170" height="36" rx="2" />
              <rect x="52" y="458" width="210" height="54" rx="2" />
              <rect x="292" y="418" width="66" height="56" rx="2" strokeDasharray="3 3" />
            </g>

            {/* B: Bloque B (P1. B101-B105 / P2. B201-B205 en diagonal SE) */}
            <rect x="444" y="448" width="196" height="118" rx="4" fill="#fff" fillOpacity=".07" />
            <g strokeOpacity=".35" strokeWidth="1.2">
              <line x1="482" y1="456" x2="482" y2="558" />
              <line x1="518" y1="456" x2="518" y2="558" />
              <line x1="554" y1="456" x2="554" y2="558" />
              <line x1="590" y1="456" x2="590" y2="558" />
            </g>
          </g>

          {/* Portería y Kiosco (x=1047404, y=619669 en el DWG, entre Zona A, Biblioteca y Bloque B) */}
          <circle cx="412" cy="420" r="8" fill="#f5a51d" stroke="none" />
          <circle className="plano-pulso" cx="412" cy="420" r="8" fill="#f5a51d" stroke="none" />
          <text x="426" y="424" fill="#fde68a" fontSize="11" fontWeight="800" stroke="none">
            Portería · Kiosco
          </text>

          {/* Huerta (x=1047332, y=619728) */}
          <rect x="234" y="302" width="76" height="36" rx="3" strokeOpacity=".45" strokeDasharray="4 3" fill="#fff" fillOpacity=".04" />
          <text x="272" y="324" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="600" stroke="none" opacity=".85">
            Huerta
          </text>

          {/* Rosa de los vientos */}
          <path d="M642 68V30M642 30l-6 11M642 30l6 11" strokeWidth="2" />
        </svg>

        <span aria-hidden className="absolute left-[94.4%] top-[1.5%] -translate-x-1/2 text-meta font-extrabold text-white">
          N
        </span>

        {/* Zonas interactivas enlazadas a cada bloque real */}
        {ZONAS.map((z) => {
          const bloque = porCodigo.get(z.codigo);
          const caja = {
            left: pct(z.x, ANCHO),
            top: pct(z.y, ALTO),
            width: pct(z.ancho, ANCHO),
            height: pct(z.alto, ALTO),
          };
          const contenido = (
            <>
              <span className="font-titulo text-base font-black leading-tight text-white sm:text-xl">
                {z.etiqueta}
              </span>
              <span className="text-[11px] font-bold leading-tight text-naranja">
                {bloque
                  ? `${bloque.numeroPisos} ${bloque.numeroPisos === 1 ? "piso" : "pisos"} · ${bloque.totalEspacios} espacios`
                  : "Cargando..."}
              </span>
              <span className="hidden text-[10px] font-medium leading-tight text-white/85 sm:block">
                {z.subtitulo}
              </span>
            </>
          );
          const base =
            "absolute flex flex-col items-center justify-center gap-0.5 rounded-[0.25rem] px-1.5 text-center";
          if (!bloque) {
            return (
              <div key={z.codigo} style={caja} className={base}>
                {contenido}
              </div>
            );
          }
          return (
            <Link
              key={z.codigo}
              style={caja}
              href={`/sedes/${sede}/bloques/${bloque.codigo}${asistentes ? `?asistentes=${asistentes}` : ""}`}
              aria-label={`${bloque.nombre}: ${bloque.numeroPisos} pisos, ${bloque.totalEspacios} espacios, hasta ${bloque.capacidadMaxima} personas`}
              className={clsx(
                base,
                "transition-colors duration-200 hover:bg-white/20 focus-visible:bg-white/20 motion-reduce:transition-none",
              )}
            >
              {contenido}
            </Link>
          );
        })}
      </div>

      {/* Cartela del plano */}
      <figcaption className="flex flex-col gap-1 border-2 border-white/70 px-4 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
          <span className="font-marca text-base font-black tracking-tight text-white">
            UNIPUTUMAYO · SEDE MOCOA (&ldquo;AIRE LIBRE&rdquo;)
          </span>
          <span className="text-meta font-bold text-white">
            Levantamiento TOPOGRAFIA UNIPUTUMAYO.dwg
          </span>
        </div>
        <span className="font-titulo text-xl font-extrabold italic text-white">
          #Un Sueño hecho Realidad
        </span>
      </figcaption>
    </figure>
  );
}
