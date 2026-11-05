"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import type { PisoBloque, TarjetaEspacio } from "@/lib/tipos";

interface CeldaPlano {
  codigo: string;
  etiqueta: string;
  subtitulo?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  piso: 1 | 2;
  esServicio?: boolean;
}

/**
 * Distribución arquitectónica extraída de TOPOGRAFIA UNIPUTUMAYO.dwg
 * Bloque A: x=1048164..1048272, y=619851..619900 (Piso 1) y y=619728..619776 (Piso 2)
 */
const CELDAS_BLOQUE_A: CeldaPlano[] = [
  // --- PISO 1: Oficinas 101-104 y Aulas 105-113 ---
  { codigo: "A-106", etiqueta: "Aula 106", x: 356, y: 120, w: 68, h: 52, piso: 1 },
  { codigo: "A-105", etiqueta: "Aula 105", x: 428, y: 120, w: 68, h: 52, piso: 1 },
  { codigo: "A-104", etiqueta: "OF. 104", subtitulo: "Oficina", x: 504, y: 128, w: 44, h: 44, piso: 1 },
  { codigo: "A-103", etiqueta: "OF. 103", subtitulo: "Oficina", x: 552, y: 128, w: 44, h: 44, piso: 1 },
  { codigo: "A-102", etiqueta: "OF. 102", subtitulo: "Oficina", x: 600, y: 128, w: 44, h: 44, piso: 1 },
  { codigo: "A-101", etiqueta: "OF. 101", subtitulo: "Oficina", x: 648, y: 128, w: 44, h: 44, piso: 1 },

  { codigo: "A-111", etiqueta: "Aula 111", x: 148, y: 196, w: 68, h: 54, piso: 1 },
  { codigo: "A-110", etiqueta: "Aula 110", x: 220, y: 196, w: 68, h: 54, piso: 1 },
  { codigo: "A-109", etiqueta: "Aula 109", x: 292, y: 196, w: 64, h: 54, piso: 1 },
  { codigo: "A-108", etiqueta: "Aula 108", x: 360, y: 196, w: 60, h: 54, piso: 1 },
  { codigo: "A-107", etiqueta: "Aula 107", x: 424, y: 196, w: 64, h: 54, piso: 1 },

  { codigo: "A-113", etiqueta: "Aula 113", x: 148, y: 274, w: 72, h: 54, piso: 1 },
  { codigo: "A-112", etiqueta: "Aula 112", x: 224, y: 274, w: 72, h: 54, piso: 1 },
  { codigo: "BANOS-P1", etiqueta: "Baños", x: 300, y: 274, w: 56, h: 54, piso: 1, esServicio: true },
  { codigo: "GRADAS-P1", etiqueta: "Gradas", x: 364, y: 274, w: 76, h: 54, piso: 1, esServicio: true },
  { codigo: "PLAZOLETA-P1", etiqueta: "Plazoleta", x: 504, y: 196, w: 124, h: 86, piso: 1, esServicio: true },
  { codigo: "KIOSCO-P1", etiqueta: "Kiosco", x: 636, y: 208, w: 56, h: 62, piso: 1, esServicio: true },
  { codigo: "HALL-P1", etiqueta: "Hall Principal", x: 32, y: 120, w: 108, h: 208, piso: 1, esServicio: true },

  // --- PISO 2: Aulas 114-117, 122, 124, 125 y Salas de Informática 118-121, 123 ---
  { codigo: "A-125", etiqueta: "Aula 125", x: 356, y: 42, w: 74, h: 52, piso: 2 },
  { codigo: "A-124", etiqueta: "Aula 124", x: 434, y: 42, w: 78, h: 52, piso: 2 },
  { codigo: "HALL-SUP-P2", etiqueta: "Hall", x: 516, y: 42, w: 70, h: 52, piso: 2, esServicio: true },

  { codigo: "BANOS-P2", etiqueta: "Baños", x: 280, y: 102, w: 68, h: 48, piso: 2, esServicio: true },
  { codigo: "A-122", etiqueta: "Aula 122", x: 356, y: 102, w: 74, h: 48, piso: 2 },
  { codigo: "A-123", etiqueta: "Sala info. 123", subtitulo: "Informática", x: 434, y: 102, w: 88, h: 48, piso: 2 },

  { codigo: "HALL-P2", etiqueta: "Hall", x: 84, y: 162, w: 60, h: 52, piso: 2, esServicio: true },
  { codigo: "A-118", etiqueta: "Sala info. 118", subtitulo: "Informática", x: 148, y: 162, w: 78, h: 52, piso: 2 },
  { codigo: "A-119", etiqueta: "Sala info. 119", subtitulo: "Informática", x: 230, y: 162, w: 78, h: 52, piso: 2 },
  { codigo: "A-120", etiqueta: "Sala info. 120", subtitulo: "Informática", x: 312, y: 162, w: 78, h: 52, piso: 2 },
  { codigo: "A-121", etiqueta: "Sala info. 121", subtitulo: "Informática", x: 394, y: 162, w: 78, h: 52, piso: 2 },

  { codigo: "A-116", etiqueta: "Aula 116", x: 28, y: 226, w: 68, h: 50, piso: 2 },
  { codigo: "A-117", etiqueta: "Aula 117", x: 100, y: 226, w: 68, h: 50, piso: 2 },
  { codigo: "A-115", etiqueta: "Aula 115", x: 28, y: 282, w: 68, h: 50, piso: 2 },
  { codigo: "A-114", etiqueta: "Aula 114", x: 100, y: 282, w: 68, h: 50, piso: 2 },
  { codigo: "GRADAS-P2", etiqueta: "Gradas Piso 2", x: 356, y: 226, w: 96, h: 50, piso: 2, esServicio: true },
];

/**
 * Bloque B según TOPOGRAFIA UNIPUTUMAYO.dwg:
 * P1. B101 a B105 + Baterías Sanitarias | P2. B201 a B205
 */
const CELDAS_BLOQUE_B: CeldaPlano[] = [
  // Piso 1
  { codigo: "SANIT-B1", etiqueta: "Baterías Sanitarias", x: 36, y: 92, w: 92, h: 176, piso: 1, esServicio: true },
  { codigo: "B-101", etiqueta: "P1 · B101", subtitulo: "Auditorio / Aula", x: 138, y: 92, w: 106, h: 176, piso: 1 },
  { codigo: "B-102", etiqueta: "P1 · B102", subtitulo: "Lab. Sistemas", x: 252, y: 92, w: 102, h: 176, piso: 1 },
  { codigo: "B-103", etiqueta: "P1 · B103", subtitulo: "Lab. Ambiental", x: 362, y: 92, w: 102, h: 176, piso: 1 },
  { codigo: "B-104", etiqueta: "P1 · B104", subtitulo: "Lab. Civil", x: 472, y: 92, w: 102, h: 176, piso: 1 },
  { codigo: "B-105", etiqueta: "P1 · B105", subtitulo: "Lab. Forestal", x: 582, y: 92, w: 102, h: 176, piso: 1 },
  { codigo: "PASILLO-B1", etiqueta: "Corredor de acceso · Nivel 1", x: 36, y: 278, w: 648, h: 46, piso: 1, esServicio: true },

  // Piso 2
  { codigo: "GRADAS-B2", etiqueta: "Escaleras / Vacío", x: 36, y: 92, w: 92, h: 176, piso: 2, esServicio: true },
  { codigo: "B-201", etiqueta: "P2 · B201", subtitulo: "Lab. Fluidos", x: 138, y: 92, w: 106, h: 176, piso: 2 },
  { codigo: "B-202", etiqueta: "P2 · B202", subtitulo: "Audiovisual", x: 252, y: 92, w: 102, h: 176, piso: 2 },
  { codigo: "B-203", etiqueta: "P2 · B203", subtitulo: "Aula B-203", x: 362, y: 92, w: 102, h: 176, piso: 2 },
  { codigo: "B-204", etiqueta: "P2 · B204", subtitulo: "Aula B-204", x: 472, y: 92, w: 102, h: 176, piso: 2 },
  { codigo: "B-205", etiqueta: "P2 · B205", subtitulo: "Aula Informática", x: 582, y: 92, w: 102, h: 176, piso: 2 },
  { codigo: "PASILLO-B2", etiqueta: "Corredor de circulación · Nivel 2", x: 36, y: 278, w: 648, h: 46, piso: 2, esServicio: true },
];

/**
 * Bloque C según TOPOGRAFIA UNIPUTUMAYO.dwg:
 * P1. C101, C102, Baterías Sanitarias, C103, C104 + Cancha Sintética y Coliseo
 * P2. C201, C202, C203, C204
 */
const CELDAS_BLOQUE_C: CeldaPlano[] = [
  // Piso 1
  { codigo: "C-105", etiqueta: "Cancha Sintética", subtitulo: "Escenario deportivo", x: 32, y: 54, w: 200, h: 126, piso: 1 },
  { codigo: "C-106", etiqueta: "Coliseo Cubierto", subtitulo: "Escenario deportivo", x: 32, y: 196, w: 200, h: 134, piso: 1 },
  { codigo: "C-104", etiqueta: "P1 · C104", subtitulo: "Aula C-104", x: 268, y: 54, w: 204, h: 50, piso: 1 },
  { codigo: "C-103", etiqueta: "P1 · C103", subtitulo: "Aula C-103", x: 268, y: 110, w: 204, h: 50, piso: 1 },
  { codigo: "SANIT-C1", etiqueta: "Baterías Sanitarias", x: 268, y: 166, w: 204, h: 46, piso: 1, esServicio: true },
  { codigo: "C-102", etiqueta: "P1 · C102", subtitulo: "Sala de informática", x: 268, y: 218, w: 204, h: 52, piso: 1 },
  { codigo: "C-101", etiqueta: "P1 · C101", subtitulo: "Aula C-101", x: 268, y: 276, w: 204, h: 54, piso: 1 },
  { codigo: "PASILLO-C1", etiqueta: "Andén · Bloque C", x: 480, y: 54, w: 54, h: 276, piso: 1, esServicio: true },

  // Piso 2
  { codigo: "VACIO-DEP", etiqueta: "Vista a Cancha Sintética y Coliseo (Nivel 1)", x: 32, y: 54, w: 200, h: 276, piso: 2, esServicio: true },
  { codigo: "C-204", etiqueta: "P2 · C204", subtitulo: "Aula C-204", x: 268, y: 54, w: 204, h: 56, piso: 2 },
  { codigo: "C-203", etiqueta: "P2 · C203", subtitulo: "Aula C-203", x: 268, y: 116, w: 204, h: 56, piso: 2 },
  { codigo: "GRADAS-C2", etiqueta: "Escaleras · Nivel 2", x: 268, y: 178, w: 204, h: 36, piso: 2, esServicio: true },
  { codigo: "C-202", etiqueta: "P2 · C202", subtitulo: "Aula C-202", x: 268, y: 220, w: 204, h: 52, piso: 2 },
  { codigo: "C-201", etiqueta: "P2 · C201", subtitulo: "Aula C-201", x: 268, y: 278, w: 204, h: 52, piso: 2 },
  { codigo: "PASILLO-C2", etiqueta: "Corredor · Piso 2", x: 480, y: 54, w: 54, h: 276, piso: 2, esServicio: true },
];

const CELDAS_POR_BLOQUE: Record<string, CeldaPlano[]> = {
  A: CELDAS_BLOQUE_A,
  B: CELDAS_BLOQUE_B,
  C: CELDAS_BLOQUE_C,
};

export function PlanoBloque({
  codigoBloque,
  numeroPisos,
  pisos,
}: {
  codigoBloque: string;
  numeroPisos: number;
  pisos: PisoBloque[];
}) {
  const [pisoActivo, setPisoActivo] = useState<1 | 2>(1);
  const codigo = codigoBloque.toUpperCase();
  const celdas = (CELDAS_POR_BLOQUE[codigo] ?? CELDAS_BLOQUE_A).filter(
    (c) => c.piso === pisoActivo,
  );

  const espaciosPorCodigo = new Map<string, TarjetaEspacio>();
  for (const p of pisos) {
    for (const e of p.espacios) {
      espaciosPorCodigo.set(e.codigo.toUpperCase(), e);
    }
  }

  const totalPisos = Math.max(1, Math.min(2, numeroPisos || 2));

  return (
    <div className="flex flex-col gap-4 rounded-tarjeta border border-gris-claro bg-gradient-to-b from-azul to-azul-oscuro p-4 text-white shadow-tarjeta sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-meta font-bold uppercase tracking-wider text-white/80">
            Plano arquitectónico · TOPOGRAFIA UNIPUTUMAYO.dwg
          </p>
          <h3 className="text-xl font-extrabold text-white">
            Bloque {codigo} · Planta Piso {pisoActivo} (de {totalPisos} pisos)
          </h3>
        </div>

        <div
          role="group"
          aria-label="Seleccionar piso del plano"
          className="inline-flex rounded-full border border-white/30 bg-azul-oscuro/60 p-1"
        >
          {[1, 2].slice(0, totalPisos).map((num) => {
            const activo = pisoActivo === num;
            return (
              <button
                key={num}
                type="button"
                aria-pressed={activo}
                onClick={() => setPisoActivo(num as 1 | 2)}
                className={clsx(
                  "min-h-10 rounded-full px-4 text-sm font-extrabold transition-colors",
                  activo
                    ? "bg-naranja text-azul-oscuro shadow-sm"
                    : "text-white hover:bg-white/15",
                )}
              >
                Piso {num}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative w-full overflow-x-auto rounded-campo border border-white/25 bg-[#0b354d]/90 p-2">
        <svg
          viewBox="0 0 720 360"
          role="img"
          aria-label={`Plano del Bloque ${codigo}, Piso ${pisoActivo}, con distribución de salones según levantamiento topográfico`}
          className="h-auto min-w-[580px] w-full"
        >
          <defs>
            <pattern
              id={`cuadricula-bloque-${codigo}`}
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M24 0H0V24"
                fill="none"
                stroke="#fff"
                strokeOpacity=".07"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect
            width="720"
            height="360"
            fill={`url(#cuadricula-bloque-${codigo})`}
          />

          {/* Contorno exterior del bloque */}
          <rect
            x="18"
            y="26"
            width="684"
            height="312"
            rx="6"
            fill="#fff"
            fillOpacity=".03"
            stroke="#fff"
            strokeOpacity=".35"
            strokeWidth="2"
            strokeDasharray="6 4"
          />

          {celdas.map((celda) => {
            const espacio = espaciosPorCodigo.get(celda.codigo);
            const disponible = Boolean(espacio);
            const cx = celda.x + celda.w / 2;
            const cy = celda.y + celda.h / 2;

            const contenido = (
              <g className="group cursor-pointer">
                <rect
                  x={celda.x}
                  y={celda.y}
                  width={celda.w}
                  height={celda.h}
                  rx="4"
                  fill={
                    celda.esServicio
                      ? "rgba(255,255,255,0.05)"
                      : disponible
                        ? "rgba(255,255,255,0.14)"
                        : "rgba(255,255,255,0.08)"
                  }
                  stroke={
                    celda.esServicio
                      ? "rgba(255,255,255,0.35)"
                      : disponible
                        ? "#f5a51d"
                        : "rgba(255,255,255,0.65)"
                  }
                  strokeWidth={disponible ? "2" : "1.3"}
                  className={
                    celda.esServicio
                      ? ""
                      : "transition-all duration-150 group-hover:fill-naranja/30"
                  }
                />
                <text
                  x={cx}
                  y={celda.subtitulo || espacio ? cy - 5 : cy + 4}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize={celda.w < 55 ? "10" : "11.5"}
                  fontWeight="800"
                >
                  {celda.etiqueta}
                </text>
                {(celda.subtitulo || espacio) && (
                  <text
                    x={cx}
                    y={cy + 11}
                    textAnchor="middle"
                    fill="#dbeafe"
                    fontSize="9.5"
                    fontWeight="600"
                  >
                    {espacio
                      ? `${espacio.capacidadPersonas} pers.`
                      : celda.subtitulo}
                  </text>
                )}
              </g>
            );

            if (!celda.esServicio && espacio) {
              return (
                <Link
                  key={celda.codigo}
                  href={`/espacios/${espacio.codigo}`}
                  aria-label={`${espacio.nombre} (${espacio.codigo}), capacidad ${espacio.capacidadPersonas} personas`}
                >
                  {contenido}
                </Link>
              );
            }

            return <g key={celda.codigo}>{contenido}</g>;
          })}
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/90">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded-sm border-2 border-naranja bg-white/20" />
            Salón reservable (clic para abrir ficha)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded-sm border border-white/40 bg-white/5" />
            Zona común / circulación / baños
          </span>
        </div>
        <span className="font-semibold">
           Haz clic sobre cualquier salón del plano para ver su dotación y reservar
        </span>
      </div>
    </div>
  );
}
