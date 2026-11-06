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
 * BLOQUE A (Zona A en TOPOGRAFIA UNIPUTUMAYO.dwg — 1 piso):
 * Coordenadas reales: x=1048164..1048272, y=619851..619900
 * - Norte-Este (y≈619889..619900): Aula 125, Aula 124, Hall, Baños, Aula 122, Sala de info. 123
 * - Franja Media-Norte (y≈619880..619884): Hall, Sala de info. 118, 119, 120, 121, Plazoleta, Kiosco
 * - Franja Central (y≈619864..619873):
 *   - Oeste: Aula 116, Aula 117
 *   - Centro: Aula 111, Aula 110, Aula 109, Aula 108, Aula 107
 *   - Este: Aula 106, Aula 105, OF. 104, OF. 103, OF. 102, OF. 101
 * - Franja Sur (y≈619851..619859):
 *   - Oeste: Aula 115, Aula 114
 *   - Centro-Sur: Aula 113, Aula 112, Baños, GRADAS
 */
const CELDAS_BLOQUE_A: CeldaPlano[] = [
  // Franja Superior (y=619889..619900)
  { codigo: "A-125", etiqueta: "Aula 125", x: 342, y: 26, w: 68, h: 46, piso: 1 },
  { codigo: "A-124", etiqueta: "Aula 124", x: 414, y: 26, w: 68, h: 46, piso: 1 },
  { codigo: "HALL-NE", etiqueta: "Hall", x: 486, y: 26, w: 58, h: 46, piso: 1, esServicio: true },

  { codigo: "HALL-N", etiqueta: "Hall", x: 146, y: 78, w: 72, h: 44, piso: 1, esServicio: true },
  { codigo: "BANOS-N", etiqueta: "Baños", x: 222, y: 78, w: 64, h: 44, piso: 1, esServicio: true },
  { codigo: "A-122", etiqueta: "Aula 122", x: 342, y: 78, w: 68, h: 44, piso: 1 },
  { codigo: "A-123", etiqueta: "Sala info. 123", x: 414, y: 78, w: 78, h: 44, piso: 1 },

  // Franja de Salas de Informática (y=619880..619884)
  { codigo: "HALL-W", etiqueta: "Hall", x: 84, y: 128, w: 58, h: 48, piso: 1, esServicio: true },
  { codigo: "A-118", etiqueta: "Sala info. 118", x: 146, y: 128, w: 64, h: 48, piso: 1 },
  { codigo: "A-119", etiqueta: "Sala info. 119", x: 214, y: 128, w: 64, h: 48, piso: 1 },
  { codigo: "A-120", etiqueta: "Sala info. 120", x: 282, y: 128, w: 64, h: 48, piso: 1 },
  { codigo: "A-121", etiqueta: "Sala info. 121", x: 350, y: 128, w: 64, h: 48, piso: 1 },
  { codigo: "PLAZOLETA", etiqueta: "Plazoleta", x: 496, y: 96, w: 120, h: 80, piso: 1, esServicio: true },
  { codigo: "KIOSCO", etiqueta: "Kiosco", x: 622, y: 108, w: 68, h: 60, piso: 1, esServicio: true },

  // Franja Intermedia Este: Aula 106 y Aula 105 (y=619871)
  { codigo: "A-116", etiqueta: "Aula 116", x: 26, y: 184, w: 56, h: 48, piso: 1 },
  { codigo: "A-117", etiqueta: "Aula 117", x: 86, y: 184, w: 56, h: 48, piso: 1 },
  { codigo: "A-106", etiqueta: "Aula 106", x: 350, y: 182, w: 66, h: 44, piso: 1 },
  { codigo: "A-105", etiqueta: "Aula 105", x: 420, y: 182, w: 66, h: 44, piso: 1 },

  // Franja Central: Aulas 111–107 y Oficinas OF. 104–101 (y=619864..619866)
  { codigo: "A-111", etiqueta: "Aula 111", x: 146, y: 232, w: 58, h: 48, piso: 1 },
  { codigo: "A-110", etiqueta: "Aula 110", x: 208, y: 232, w: 58, h: 48, piso: 1 },
  { codigo: "A-109", etiqueta: "Aula 109", x: 270, y: 232, w: 56, h: 48, piso: 1 },
  { codigo: "A-108", etiqueta: "Aula 108", x: 330, y: 232, w: 54, h: 48, piso: 1 },
  { codigo: "A-107", etiqueta: "Aula 107", x: 388, y: 232, w: 56, h: 48, piso: 1 },
  { codigo: "A-104", etiqueta: "OF. 104", x: 492, y: 232, w: 46, h: 48, piso: 1 },
  { codigo: "A-103", etiqueta: "OF. 103", x: 542, y: 232, w: 46, h: 48, piso: 1 },
  { codigo: "A-102", etiqueta: "OF. 102", x: 592, y: 232, w: 46, h: 48, piso: 1 },
  { codigo: "A-101", etiqueta: "OF. 101", x: 642, y: 232, w: 48, h: 48, piso: 1 },

  // Franja Sur: Aulas 115, 114, 113, 112, Baños y GRADAS (y=619851..619859)
  { codigo: "A-115", etiqueta: "Aula 115", x: 26, y: 240, w: 56, h: 48, piso: 1 },
  { codigo: "A-114", etiqueta: "Aula 114", x: 86, y: 240, w: 56, h: 48, piso: 1 },
  { codigo: "GRADAS-OESTE", etiqueta: "GRADAS", x: 46, y: 294, w: 80, h: 40, piso: 1, esServicio: true },
  { codigo: "A-113", etiqueta: "Aula 113", x: 146, y: 286, w: 62, h: 48, piso: 1 },
  { codigo: "A-112", etiqueta: "Aula 112", x: 212, y: 286, w: 62, h: 48, piso: 1 },
  { codigo: "BANOS-S", etiqueta: "Baños", x: 278, y: 286, w: 56, h: 48, piso: 1, esServicio: true },
  { codigo: "GRADAS-SUR", etiqueta: "GRADAS", x: 342, y: 286, w: 84, h: 48, piso: 1, esServicio: true },
];

/**
 * BLOQUE B (2 pisos en TOPOGRAFIA UNIPUTUMAYO.dwg):
 * Piso 1: Baterías Sanitarias + P1. B101, P1. B102, P1. B103, P1. B104, P1. B105
 * Piso 2: P2. B201, P2. B202, P2. B203, P2. B204, P2. B205
 */
const CELDAS_BLOQUE_B: CeldaPlano[] = [
  // Piso 1
  { codigo: "SANIT-B1", etiqueta: "BATERÍAS SANITARIAS", x: 36, y: 74, w: 102, h: 184, piso: 1, esServicio: true },
  { codigo: "B-101", etiqueta: "P1. B101", subtitulo: "Aula B101", x: 146, y: 74, w: 102, h: 184, piso: 1 },
  { codigo: "B-102", etiqueta: "P1. B102", subtitulo: "Aula B102", x: 256, y: 74, w: 102, h: 184, piso: 1 },
  { codigo: "B-103", etiqueta: "P1. B103", subtitulo: "Aula B103", x: 366, y: 74, w: 102, h: 184, piso: 1 },
  { codigo: "B-104", etiqueta: "P1. B104", subtitulo: "Aula B104", x: 476, y: 74, w: 102, h: 184, piso: 1 },
  { codigo: "B-105", etiqueta: "P1. B105", subtitulo: "Aula B105", x: 586, y: 74, w: 102, h: 184, piso: 1 },
  { codigo: "ANDEN-B1", etiqueta: "Corredor · BLOQUE B (Piso 1)", x: 36, y: 268, w: 652, h: 52, piso: 1, esServicio: true },

  // Piso 2
  { codigo: "ESCAL-B2", etiqueta: "Escaleras / Vacío", x: 36, y: 74, w: 102, h: 184, piso: 2, esServicio: true },
  { codigo: "B-201", etiqueta: "P2. B201", subtitulo: "Aula B201", x: 146, y: 74, w: 102, h: 184, piso: 2 },
  { codigo: "B-202", etiqueta: "P2. B202", subtitulo: "Aula B202", x: 256, y: 74, w: 102, h: 184, piso: 2 },
  { codigo: "B-203", etiqueta: "P2. B203", subtitulo: "Aula B203", x: 366, y: 74, w: 102, h: 184, piso: 2 },
  { codigo: "B-204", etiqueta: "P2. B204", subtitulo: "Aula B204", x: 476, y: 74, w: 102, h: 184, piso: 2 },
  { codigo: "B-205", etiqueta: "P2. B205", subtitulo: "Aula B205", x: 586, y: 74, w: 102, h: 184, piso: 2 },
  { codigo: "ANDEN-B2", etiqueta: "Corredor · BLOQUE B (Piso 2)", x: 36, y: 268, w: 652, h: 52, piso: 2, esServicio: true },
];

/**
 * BLOQUE C (2 pisos en TOPOGRAFIA UNIPUTUMAYO.dwg):
 * De norte a sur en el DWG:
 * - P1. C104 / P2. C204 (y=619857.3)
 * - P1. C103 / P2. C203 (y=619849.5)
 * - BATERIAS SANITARIAS (y=619843.0)
 * - P1. C102 / P2. C202 (y=619836.4)
 * - P1. C101 / P2. C201 (y=619829.2)
 */
const CELDAS_BLOQUE_C: CeldaPlano[] = [
  // Piso 1
  { codigo: "C-104", etiqueta: "P1. C104", subtitulo: "Aula C104", x: 180, y: 40, w: 280, h: 52, piso: 1 },
  { codigo: "C-103", etiqueta: "P1. C103", subtitulo: "Aula C103", x: 180, y: 98, w: 280, h: 52, piso: 1 },
  { codigo: "SANIT-C1", etiqueta: "BATERÍAS SANITARIAS", x: 180, y: 156, w: 280, h: 48, piso: 1, esServicio: true },
  { codigo: "C-102", etiqueta: "P1. C102", subtitulo: "Aula C102", x: 180, y: 210, w: 280, h: 52, piso: 1 },
  { codigo: "C-101", etiqueta: "P1. C101", subtitulo: "Aula C101", x: 180, y: 268, w: 280, h: 52, piso: 1 },
  { codigo: "ANDEN-C1", etiqueta: "Corredor · BLOQUE C (Piso 1)", x: 468, y: 40, w: 96, h: 280, piso: 1, esServicio: true },

  // Piso 2
  { codigo: "C-204", etiqueta: "P2. C204", subtitulo: "Aula C204", x: 180, y: 40, w: 280, h: 52, piso: 2 },
  { codigo: "C-203", etiqueta: "P2. C203", subtitulo: "Aula C203", x: 180, y: 98, w: 280, h: 52, piso: 2 },
  { codigo: "ESCAL-C2", etiqueta: "Escaleras · Piso 2", x: 180, y: 156, w: 280, h: 48, piso: 2, esServicio: true },
  { codigo: "C-202", etiqueta: "P2. C202", subtitulo: "Aula C202", x: 180, y: 210, w: 280, h: 52, piso: 2 },
  { codigo: "C-201", etiqueta: "P2. C201", subtitulo: "Aula C201", x: 180, y: 268, w: 280, h: 52, piso: 2 },
  { codigo: "ANDEN-C2", etiqueta: "Corredor · BLOQUE C (Piso 2)", x: 468, y: 40, w: 96, h: 280, piso: 2, esServicio: true },
];

/**
 * BLOQUE D (Edificio de Laboratorios, Auditorio y Cafetería — 2 niveles: N 0.00m y Nivel +4.70m):
 * Coordenadas DWG: x=1047266..1047338, y=619890..619978
 */
const CELDAS_BLOQUE_D: CeldaPlano[] = [
  // Piso 1 (N 0.00m)
  { codigo: "D-107", etiqueta: "Hemeroteca", x: 34, y: 38, w: 96, h: 48, piso: 1 },
  { codigo: "D-108", etiqueta: "Xiloteca", x: 136, y: 38, w: 96, h: 48, piso: 1 },
  { codigo: "D-105", etiqueta: "Lab. Ing. Forestal", subtitulo: "126.24 m² · 30 pers.", x: 34, y: 92, w: 126, h: 64, piso: 1 },
  { codigo: "D-106", etiqueta: "Herbario", x: 166, y: 92, w: 66, h: 64, piso: 1 },
  { codigo: "D-104", etiqueta: "Lab. Ing. Civil", subtitulo: "172.90 m² · 30 pers.", x: 34, y: 164, w: 198, h: 72, piso: 1 },
  { codigo: "D-102", etiqueta: "Lab. Ing. Ambiental", subtitulo: "85.62 m² · 30 pers.", x: 34, y: 244, w: 112, h: 82, piso: 1 },
  { codigo: "D-103", etiqueta: "Lab. Mec. Fluidos", subtitulo: "38.03 m² · 10 pers.", x: 152, y: 244, w: 80, h: 82, piso: 1 },

  { codigo: "PATIO-VERDE", etiqueta: "Patio Zona Verde", x: 244, y: 38, w: 124, h: 288, piso: 1, esServicio: true },

  { codigo: "D-109", etiqueta: "Cafetería · Cocina · Patio de mesas", subtitulo: "324 m² · 112 pers.", x: 380, y: 38, w: 306, h: 108, piso: 1 },
  { codigo: "ESCENARIO-D", etiqueta: "Escenario · Camerinos H/M", x: 380, y: 154, w: 306, h: 44, piso: 1, esServicio: true },
  { codigo: "D-101", etiqueta: "Auditorio Aula Múltiple (Aula 1 + Aula 2)", subtitulo: "303.70 m² · 216 pers.", x: 380, y: 204, w: 306, h: 122, piso: 1 },

  // Piso 2 (Nivel +4.70m)
  { codigo: "D-204", etiqueta: "Espacio Multifuncional · Cubierta de trabajo", x: 34, y: 38, w: 334, h: 82, piso: 2 },
  { codigo: "D-202", etiqueta: "Aula Informática 1", subtitulo: "60.90 m² · 24 pers.", x: 34, y: 132, w: 162, h: 86, piso: 2 },
  { codigo: "D-203", etiqueta: "Aula Informática 2", subtitulo: "60.90 m² · 24 pers.", x: 206, y: 132, w: 162, h: 86, piso: 2 },
  { codigo: "D-201", etiqueta: "Laboratorios Ingeniería de Sistemas", subtitulo: "30 pers.", x: 34, y: 228, w: 334, h: 98, piso: 2 },
  { codigo: "VOLADIZO-D2", etiqueta: "Proyección Voladizo Nivel +4.70 · Doble altura Auditorio", x: 380, y: 38, w: 306, h: 288, piso: 2, esServicio: true },
];

/**
 * BLOQUE E (Escenarios Deportivos en TOPOGRAFIA UNIPUTUMAYO.dwg):
 * Cancha Sintética (x=1047357, y=619859) y Coliseo (x=1047399, y=619850)
 */
const CELDAS_BLOQUE_E: CeldaPlano[] = [
  { codigo: "E-101", etiqueta: "CANCHA SINTÉTICA", subtitulo: "200 personas", x: 56, y: 48, w: 280, h: 264, piso: 1 },
  { codigo: "E-102", etiqueta: "COLISEO", subtitulo: "500 personas", x: 376, y: 48, w: 288, h: 264, piso: 1 },
];

/**
 * BLOQUE F (Biblioteca, Administración, CIECYT, Laboratorio y Meteorología en TOPOGRAFIA UNIPUTUMAYO.dwg):
 * x=1047374..1047443, y=619704..619763
 */
const CELDAS_BLOQUE_F: CeldaPlano[] = [
  { codigo: "F-104", etiqueta: "Meteorología y Huerta", x: 32, y: 44, w: 136, h: 96, piso: 1 },
  { codigo: "PARQ-MOTOS", etiqueta: "Parqueadero Motos", x: 178, y: 44, w: 118, h: 96, piso: 1, esServicio: true },
  { codigo: "F-103", etiqueta: "Laboratorio Central", x: 306, y: 44, w: 184, h: 96, piso: 1 },

  { codigo: "F-101", etiqueta: "Biblioteca", x: 178, y: 152, w: 154, h: 168, piso: 1 },
  { codigo: "RECTORIA", etiqueta: "Rectoría · Tesorería · Presupuesto · Talento Humano", x: 342, y: 152, w: 196, h: 80, piso: 1, esServicio: true },
  { codigo: "VICERRECTORIAS", etiqueta: "Vicerrectoría Académica y Administrativa · Jurídica · Archivo", x: 342, y: 240, w: 196, h: 80, piso: 1, esServicio: true },
  { codigo: "F-102", etiqueta: "CIECYT · Área de Trabajo", x: 548, y: 152, w: 140, h: 168, piso: 1 },
];

const CELDAS_POR_BLOQUE: Record<string, CeldaPlano[]> = {
  A: CELDAS_BLOQUE_A,
  B: CELDAS_BLOQUE_B,
  C: CELDAS_BLOQUE_C,
  D: CELDAS_BLOQUE_D,
  E: CELDAS_BLOQUE_E,
  F: CELDAS_BLOQUE_F,
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
  const totalPisos = Math.max(1, Math.min(2, numeroPisos || 1));
  const pisoMostrado = totalPisos === 1 ? 1 : pisoActivo;
  const celdas = (CELDAS_POR_BLOQUE[codigo] ?? CELDAS_BLOQUE_A).filter(
    (c) => c.piso === pisoMostrado,
  );

  const espaciosPorCodigo = new Map<string, TarjetaEspacio>();
  for (const p of pisos) {
    for (const e of p.espacios) {
      espaciosPorCodigo.set(e.codigo.toUpperCase(), e);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-tarjeta border border-gris-claro bg-gradient-to-b from-azul to-azul-oscuro p-4 text-white shadow-tarjeta sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-meta font-bold uppercase tracking-wider text-white/80">
            Plano arquitectónico · TOPOGRAFIA UNIPUTUMAYO.dwg
          </p>
          <h3 className="text-xl font-extrabold text-white">
            Bloque {codigo} · Planta {totalPisos === 1 ? "Única (1 piso)" : `Piso ${pisoMostrado} (de ${totalPisos} pisos)`}
          </h3>
        </div>

        {totalPisos > 1 && (
          <div
            role="group"
            aria-label="Seleccionar piso del plano"
            className="inline-flex rounded-full border border-white/30 bg-azul-oscuro/60 p-1"
          >
            {[1, 2].slice(0, totalPisos).map((num) => {
              const activo = pisoMostrado === num;
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
        )}
      </div>

      <div className="relative w-full overflow-x-auto rounded-campo border border-white/25 bg-[#0b354d]/90 p-2">
        <svg
          viewBox="0 0 720 360"
          role="img"
          aria-label={`Plano del Bloque ${codigo}, Piso ${pisoMostrado}, con distribución exacta según TOPOGRAFIA UNIPUTUMAYO.dwg`}
          className="h-auto min-w-[600px] w-full"
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

          <rect
            x="16"
            y="18"
            width="688"
            height="324"
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
                  y={celda.subtitulo || espacio ? cy - 4 : cy + 4}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize={celda.w < 58 ? "9.5" : "11"}
                  fontWeight="800"
                >
                  {celda.etiqueta}
                </text>
                {(celda.subtitulo || espacio) && (
                  <text
                    x={cx}
                    y={cy + 10}
                    textAnchor="middle"
                    fill="#dbeafe"
                    fontSize="9"
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
            Espacio reservable (clic para abrir ficha)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded-sm border border-white/40 bg-white/5" />
            Zona común / baños / gradas / oficinas administrativas
          </span>
        </div>
        <span className="font-semibold">
          Distribución fiel a TOPOGRAFIA UNIPUTUMAYO.dwg
        </span>
      </div>
    </div>
  );
}
