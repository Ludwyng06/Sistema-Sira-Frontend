"use client";

import { useState } from "react";
import clsx from "clsx";
import type { BloqueResumen } from "@/lib/tipos";

/**
 * Maqueta isométrica del campus para el panel. Es un esquema dibujado a mano (no sale de
 * ningún plano y no es a escala): tres bloques, la cancha, el coliseo y la entrada. Los datos
 * de cada bloque (pisos, espacios, aforo) vienen de la API. Al elegir un bloque, sus pisos se
 * separan; con "reducir movimiento" todo queda quieto y completo.
 */

const K = 26;
const OX = 236;
const OY = 96;
const iso = (x: number, y: number, z = 0) => ({
  x: OX + (x - y) * 0.866 * K,
  y: OY + (x + y) * 0.5 * K - z * K * 0.62,
});
const pts = (lista: Array<[number, number, number]>) =>
  lista
    .map(([x, y, z]) => {
      const p = iso(x, y, z);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join(" ");

interface Pieza {
  id: string;
  nombre: string;
  x: number;
  y: number;
  ancho: number;
  fondo: number;
}

const BLOQUES: Pieza[] = [
  { id: "A", nombre: "Bloque A", x: 0, y: 0, ancho: 3.6, fondo: 2.8 },
  { id: "B", nombre: "Bloque B", x: 4.6, y: 0, ancho: 3.6, fondo: 2.8 },
  { id: "C", nombre: "Bloque C", x: 9.2, y: 0, ancho: 3.6, fondo: 2.8 },
];
const CANCHA: Pieza = { id: "cancha", nombre: "Cancha sintética", x: 0.4, y: 4.6, ancho: 4.8, fondo: 3 };
const COLISEO: Pieza = { id: "coliseo", nombre: "Coliseo", x: 6.4, y: 5.4, ancho: 6.2, fondo: 3.4 };
const ENTRADA = { x: 6.2, y: 10 };
const PISOS = 3;

/** Una caja con tapa, cara izquierda y cara derecha. */
function Caja({ x, y, ancho, fondo, z0, alto }: { x: number; y: number; ancho: number; fondo: number; z0: number; alto: number }) {
  const z1 = z0 + alto;
  return (
    <g strokeLinejoin="round" strokeWidth="1.2" stroke="#0b2e40">
      <polygon points={pts([[x, y + fondo, z0], [x + ancho, y + fondo, z0], [x + ancho, y + fondo, z1], [x, y + fondo, z1]])} className="fill-turquesa-suave" />
      <polygon points={pts([[x + ancho, y, z0], [x + ancho, y + fondo, z0], [x + ancho, y + fondo, z1], [x + ancho, y, z1]])} className="fill-azul" />
      <polygon points={pts([[x, y, z1], [x + ancho, y, z1], [x + ancho, y + fondo, z1], [x, y + fondo, z1]])} className="fill-fondo" />
    </g>
  );
}

const rect = (p: Pieza, m = 0): Array<[number, number, number]> => [
  [p.x - m, p.y - m, 0],
  [p.x + p.ancho + m, p.y - m, 0],
  [p.x + p.ancho + m, p.y + p.fondo + m, 0],
  [p.x - m, p.y + p.fondo + m, 0],
];

export function CampusIsometrico({ bloques, className }: { bloques: BloqueResumen[]; className?: string }) {
  const [elegido, setElegido] = useState<string>("A");
  const porCodigo = new Map(bloques.map((b) => [b.codigo.toUpperCase(), b]));
  const datos = porCodigo.get(elegido);
  const piezas = [...BLOQUES, CANCHA, COLISEO];
  const nombre = piezas.find((p) => p.id === elegido)?.nombre ?? "";
  const centroCancha = iso(CANCHA.x + 2.4, CANCHA.y + 1.5, 0);
  const entrada = iso(ENTRADA.x, ENTRADA.y, 0);

  return (
    <section aria-labelledby="titulo-campus" className={clsx("flex flex-col gap-4", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="titulo-campus" className="text-2xl font-extrabold">
          Campus Mocoa
        </h2>
        <p className="text-meta font-bold text-gris">Esquema, no a escala</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] lg:items-center">
        <div className="overflow-hidden rounded-tarjeta bg-gradient-to-b from-azul to-azul-oscuro p-2 shadow-tarjeta">
          <svg
            viewBox="0 0 560 430"
            role="img"
            aria-label="Maqueta del campus: tres bloques arriba, la cancha y el coliseo en el centro y la entrada abajo. Usa la lista para elegir una parte."
            className="h-auto w-full"
          >
            <polygon points={pts([[-1, -1, 0], [14, -1, 0], [14, 11.2, 0], [-1, 11.2, 0]])} className="fill-white/10" stroke="#fff" strokeOpacity=".35" strokeWidth="1.2" />
            <polyline points={pts([[ENTRADA.x, ENTRADA.y, 0], [ENTRADA.x, 8.9, 0]])} fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="2" strokeDasharray="5 5" />

            {BLOQUES.map((b, i) => {
              const pisos = PISOS;
              const activo = elegido === b.id;
              const base = iso(b.x + b.ancho / 2, b.y + b.fondo, 0);
              return (
                <g key={b.id} className="iso-aparece" style={{ ["--retardo" as string]: `${i * 0.15}s` }}>
                 <g className="iso-flota" style={{ ["--flota" as string]: `${i * 0.9}s` }}>
                  {activo && <polygon points={pts(rect(b, 0.25))} fill="none" stroke="#f5a51d" strokeWidth="3" />}
                  {Array.from({ length: pisos }, (_, p) => (
                    <g key={p} className="iso-piso" style={{ transform: activo ? `translateY(${-p * 9}px)` : undefined }}>
                      <Caja x={b.x} y={b.y} ancho={b.ancho} fondo={b.fondo} z0={p * 1.1} alto={1} />
                    </g>
                  ))}
                  <text x={base.x} y={base.y + 24} textAnchor="middle" className="fill-white font-titulo text-xl font-black">
                    {b.id}
                  </text>
                 </g>
                </g>
              );
            })}

            <g className="iso-aparece" style={{ ["--retardo" as string]: ".5s" }}>
              <polygon points={pts(rect(CANCHA))} className="fill-verde" stroke={elegido === "cancha" ? "#f5a51d" : "#fff"} strokeWidth={elegido === "cancha" ? 3 : 1.5} />
              <polyline points={pts([[CANCHA.x + 2.4, CANCHA.y, 0], [CANCHA.x + 2.4, CANCHA.y + 3, 0]])} fill="none" stroke="#fff" strokeWidth="1.5" />
              <ellipse cx={centroCancha.x} cy={centroCancha.y} rx="14" ry="8" fill="none" stroke="#fff" strokeWidth="1.5" />
            </g>

            <g className="iso-aparece" style={{ ["--retardo" as string]: ".65s" }}>
             <g className="iso-flota" style={{ ["--flota" as string]: "2.4s" }}>
              <Caja x={COLISEO.x} y={COLISEO.y} ancho={COLISEO.ancho} fondo={COLISEO.fondo} z0={0} alto={1.1} />
              {[0, 1, 2, 3, 4].map((n) => {
                const xx = COLISEO.x + 0.6 + n * 1.25;
                const a = iso(xx, COLISEO.y, 1.1);
                const c = iso(xx, COLISEO.y + COLISEO.fondo / 2, 2.8);
                const b = iso(xx, COLISEO.y + COLISEO.fondo, 1.1);
                return (
                  <path
                    key={n}
                    d={`M ${a.x} ${a.y} Q ${c.x} ${c.y} ${b.x} ${b.y}`}
                    fill="none"
                    stroke={elegido === "coliseo" ? "#f5a51d" : "#0b2e40"}
                    strokeWidth={elegido === "coliseo" ? 3.5 : 2.5}
                  />
                );
              })}
             </g>
            </g>

            <circle cx={entrada.x} cy={entrada.y} r="8" className="fill-naranja" />
            <text x={entrada.x + 16} y={entrada.y + 5} className="fill-white text-[14px] font-bold">
              Entrada
            </text>
          </svg>
        </div>

        <div className="flex flex-col gap-4">
          <div role="group" aria-label="Elegir una parte del campus" className="flex flex-wrap gap-2">
            {piezas.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={elegido === p.id}
                onClick={() => setElegido(p.id)}
                className={clsx(
                  "min-h-11 rounded-full border-2 px-4 text-base font-bold transition-colors motion-reduce:transition-none",
                  elegido === p.id ? "border-azul-oscuro bg-azul-oscuro text-white" : "border-azul text-azul-oscuro hover:bg-turquesa-suave",
                )}
              >
                {p.nombre}
              </button>
            ))}
          </div>
          <div aria-live="polite" className="flex flex-col gap-1 rounded-tarjeta border border-gris-claro p-4">
            <h3 className="text-xl font-extrabold">{nombre}</h3>
            {datos ? (
              <ul className="text-base text-texto">
                <li>{PISOS} pisos</li>
                <li>{datos.totalEspacios} espacios</li>
                <li>Hasta {datos.capacidadMaxima} personas</li>
              </ul>
            ) : (
              <p className="text-base text-gris">
                {BLOQUES.some((b) => b.id === elegido) ? "Sin datos de este bloque todavía." : "Escenario deportivo del campus."}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
