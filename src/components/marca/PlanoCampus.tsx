import Link from "next/link";
import clsx from "clsx";
import type { BloqueResumen } from "@/lib/tipos";

/** Los tres bloques son edificios separados, de izquierda a derecha: A, B y C. */
const ALAS = [
  { codigo: "A", x: 62, ancho: 142 },
  { codigo: "B", x: 229, ancho: 142 },
  { codigo: "C", x: 396, ancho: 142 },
] as const;

const ANCHO = 600;
const ALTO = 500;
const ALA_Y = 46;
const ALA_ALTO = 138;

const pct = (valor: number, total: number) => `${((valor / total) * 100).toFixed(2)}%`;

/**
 * Esquema del campus en estilo cianotipo (línea blanca sobre azul). No es a escala: orienta.
 * Arriba, el conjunto con los bloques A, B y C; al centro, la zona deportiva; abajo, la entrada
 * por la cafetería. Los bloques son enlaces reales y muestran datos de la API (sin datos quemados).
 * Sin `bloques` (mientras cargan) se dibuja el mismo plano con las alas sin enlace.
 */
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
        aria-label="Esquema del campus, no a escala. Arriba los bloques A, B y C; al centro la zona deportiva; abajo la entrada por la cafetería."
        className="relative aspect-[6/5] w-full"
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

          {/* Curvas de nivel */}
          <g strokeOpacity=".16" strokeWidth="1.4">
            <path d="M-10 214 C 120 190 210 238 335 208 S 520 192 610 218" />
            <path d="M-10 366 C 100 344 224 392 352 362 S 520 358 610 384" />
            <path d="M-10 410 C 60 396 130 424 190 408" />
          </g>

          {/* Los tres edificios, cada uno con su silueta */}
          <g strokeWidth="2.2">
            {ALAS.map((ala, i) => (
              <g key={ala.codigo}>
                <rect
                  className="plano-trazo"
                  pathLength={1}
                  style={{ ["--retardo" as string]: `${0.1 + i * 0.15}s` }}
                  x={ala.x}
                  y={ALA_Y}
                  width={ala.ancho}
                  height={ALA_ALTO}
                  rx="3"
                  fill="#fff"
                  fillOpacity=".07"
                />
                <g strokeOpacity=".3" strokeWidth="1.2">
                  {ala.codigo === "A" && (
                    <path d={`M${ala.x + 8} ${ALA_Y + 46}H${ala.x + ala.ancho - 8}M${ala.x + 8} ${ALA_Y + 92}H${ala.x + ala.ancho - 8}`} />
                  )}
                  {ala.codigo === "B" && (
                    <rect x={ala.x + 40} y={ALA_Y + 34} width={ala.ancho - 80} height={ALA_ALTO - 68} rx="2" />
                  )}
                  {ala.codigo === "C" && (
                    <>
                      <rect x={ala.x + ala.ancho - 40} y={ALA_Y + 8} width="32" height="40" rx="2" />
                      <path d={`M${ala.x + 8} ${ALA_Y + 70}H${ala.x + ala.ancho - 46}`} />
                    </>
                  )}
                </g>
              </g>
            ))}
          </g>

          {/* Zona deportiva: cancha sintética */}
          <g strokeWidth="2">
            <rect
              className="plano-trazo"
              pathLength={1}
              style={{ ["--retardo" as string]: "0.7s" }}
              x="96"
              y="248"
              width="158"
              height="88"
              rx="3"
              fill="#fff"
              fillOpacity=".06"
            />
            <path d="M175 248V336" strokeOpacity=".6" strokeWidth="1.4" />
            <circle cx="175" cy="292" r="15" strokeOpacity=".6" strokeWidth="1.4" />
            <path d="M96 270H118V314H96M254 270H232V314H254" strokeOpacity=".6" strokeWidth="1.4" />
          </g>

          {/* Coliseo (techado) */}
          <g strokeWidth="2">
            <rect
              className="plano-trazo"
              pathLength={1}
              style={{ ["--retardo" as string]: "0.9s" }}
              x="312"
              y="240"
              width="190"
              height="102"
              rx="48"
              fill="#fff"
              fillOpacity=".06"
            />
            <path d="M345 250C375 280 375 302 345 332M407 244C422 275 422 307 407 338M469 250C439 280 439 302 469 332" strokeOpacity=".5" strokeWidth="1.4" />
          </g>

          {/* Cafetería y camino de entrada */}
          <rect x="176" y="404" width="86" height="48" rx="3" strokeWidth="2" fill="#fff" fillOpacity=".06" />
          <path d="M200 428h38M219 416v24" strokeOpacity=".5" strokeWidth="1.4" />
          <path
            className="plano-trazo"
            pathLength={1}
            style={{ ["--retardo" as string]: "1.1s", strokeDasharray: "0.025 0.02" }}
            d="M290 466 C 292 420 280 392 283 352 S 292 226 300 190"
            strokeWidth="2.4"
          />

          {/* Entrada */}
          <circle cx="290" cy="474" r="9" fill="#f5a51d" stroke="none" />
          <circle className="plano-pulso" cx="290" cy="474" r="9" fill="#f5a51d" stroke="none" />

          {/* Rosa de los vientos */}
          <path d="M552 96V54M552 54l-7 13M552 54l7 13" strokeWidth="2" />
        </svg>

        <span aria-hidden className="absolute left-[92%] top-[3%] -translate-x-1/2 text-meta font-extrabold text-white">
          N
        </span>

        {/* Alas: enlaces reales (o rótulos mientras cargan los datos) */}
        {ALAS.map((ala) => {
          const bloque = porCodigo.get(ala.codigo);
          const caja = {
            left: pct(ala.x, ANCHO),
            top: pct(ALA_Y, ALTO),
            width: pct(ala.ancho, ANCHO),
            height: pct(ALA_ALTO, ALTO),
          };
          const contenido = (
            <>
              <span className="font-titulo text-3xl font-black leading-none text-white sm:text-5xl">{ala.codigo}</span>
              <span className="text-meta font-medium leading-tight text-white">
                {bloque ? `${bloque.totalEspacios} espacios` : <span className="sr-only">Cargando</span>}
              </span>
            </>
          );
          const base =
            "absolute flex flex-col items-center justify-center gap-1 rounded-[0.2rem] px-1 text-center";
          if (!bloque) {
            return (
              <div key={ala.codigo} style={caja} className={base}>
                {contenido}
              </div>
            );
          }
          return (
            <Link
              key={ala.codigo}
              style={caja}
              href={`/sedes/${sede}/bloques/${bloque.codigo}${asistentes ? `?asistentes=${asistentes}` : ""}`}
              aria-label={`Bloque ${bloque.codigo}: ${bloque.totalEspacios} espacios, hasta ${bloque.capacidadMaxima} personas`}
              className={clsx(
                base,
                "transition-colors duration-200 hover:bg-white/20 focus-visible:bg-white/20 motion-reduce:transition-none",
              )}
            >
              {contenido}
            </Link>
          );
        })}

        {/* Rótulos del plano (desde tablet; en celular lo explica la leyenda) */}
        <span className="absolute left-[29%] top-[69%] hidden -translate-x-1/2 text-meta font-medium text-white md:block">
          Cancha sintética
        </span>
        <span className="absolute left-[68%] top-[69%] hidden -translate-x-1/2 text-meta font-medium text-white md:block">
          Coliseo
        </span>
        <span className="absolute left-[52%] top-[90%] hidden text-meta font-bold text-white md:block">
          Entrada · por la cafetería
        </span>
      </div>

      {/* Cartela: el recuadro de título de los planos */}
      <figcaption className="flex flex-col gap-1 border-2 border-white/70 px-4 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
          <span className="font-marca text-base font-black tracking-tight text-white">UNIPUTUMAYO · SEDE MOCOA</span>
          <span className="text-meta font-bold text-white">Esquema, no a escala</span>
        </div>
        <span className="font-titulo text-xl font-extrabold italic text-white">#Un Sueño hecho Realidad</span>
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-meta text-white md:hidden">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-full bg-naranja" />
            Entrada por la cafetería
          </span>
          <span>▭ Cancha sintética</span>
          <span>◔ Coliseo</span>
        </span>
      </figcaption>
    </figure>
  );
}
