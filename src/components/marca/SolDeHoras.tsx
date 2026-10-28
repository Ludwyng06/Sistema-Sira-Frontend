import type { Horario } from "@/lib/tipos";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const ORDEN = [1, 2, 3, 4, 5, 6, 0];

const aMinutos = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
};
const punto = (minutos: number, r: number) => {
  const ang = (minutos / 1440) * Math.PI * 2 - Math.PI / 2;
  return `${(50 + r * Math.cos(ang)).toFixed(2)} ${(50 + r * Math.sin(ang)).toFixed(2)}`;
};
const legible = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  const sufijo = h < 12 ? "a. m." : "p. m.";
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m || 0).padStart(2, "0")} ${sufijo}`;
};

/**
 * El "sol de horas": cada día es un reloj de 24 horas (medianoche arriba) y el arco naranja
 * marca cuándo está abierto el espacio. Los horarios vienen de la API; el texto repite lo que
 * dibuja el arco para que no dependa de verlo.
 */
export function SolDeHoras({ horarios }: { horarios: Horario[] }) {
  const porDia = new Map(horarios.map((h) => [h.diaSemana, h]));
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
      {ORDEN.map((d) => {
        const h = porDia.get(d);
        const ini = h ? aMinutos(h.abre) : 0;
        const fin = h ? aMinutos(h.cierra) : 0;
        const grande = h ? (fin - ini > 720 ? 1 : 0) : 0;
        return (
          <li key={d} className="flex flex-col items-center gap-2 rounded-tarjeta bg-fondo p-3 text-center shadow-tarjeta">
            <svg viewBox="0 0 100 100" aria-hidden className="size-20">
              <circle cx="50" cy="50" r="40" fill="none" className="stroke-gris-claro/60" strokeWidth="10" />
              {h && (
                <path
                  d={`M ${punto(ini, 40)} A 40 40 0 ${grande} 1 ${punto(fin, 40)}`}
                  fill="none"
                  className="stroke-naranja"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
              )}
              <circle cx="50" cy="50" r="4" className="fill-azul" />
            </svg>
            <p className="font-bold text-tinta">{DIAS[d]}</p>
            <p className="text-meta text-texto">{h ? `${legible(h.abre)} a ${legible(h.cierra)}` : "Cerrado"}</p>
          </li>
        );
      })}
    </ul>
  );
}
