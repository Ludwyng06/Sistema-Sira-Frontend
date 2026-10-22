import { CalendarCheck, Users } from "lucide-react";
import { SolRadial } from "./SolRadial";

/** Color de cada aleta de la fachada: blanco, gris y el naranja de la Facultad de Ingenierías. */
const ALETAS_ALTAS = ["#e4e8ea", "#f5a51d", "#f6f8f9", "#f5a51d", "#e4e8ea", "#f6f8f9", "#e4e8ea", "#f5a51d", "#f6f8f9", "#e4e8ea"];
const ALETAS_BAJAS = ["#f6f8f9", "#e4e8ea", "#f5a51d", "#f6f8f9", "#e4e8ea", "#f5a51d", "#f6f8f9", "#e4e8ea", "#f5a51d", "#f6f8f9"];

const VENTANAS_ENCENDIDAS = [
  { x: 72, y: 534, d: "5.2s", r: "0s" },
  { x: 122, y: 534, d: "6.4s", r: "1.6s" },
  { x: 214, y: 534, d: "4.8s", r: "0.8s" },
  { x: 262, y: 534, d: "7s", r: "2.4s" },
  { x: 98, y: 372, d: "6s", r: "3.1s" },
  { x: 232, y: 372, d: "5.6s", r: "1.1s" },
  { x: 170, y: 462, d: "6.8s", r: "2s" },
  { x: 288, y: 462, d: "5s", r: "3.6s" },
];

/**
 * Escena del campus para el espacio libre a la izquierda de la portada. Se inspira en la
 * Facultad de Ingenierías (aletas naranjas), las nubes y las colinas del Putumayo.
 * Es decorativa: se arma sola al cargar y luego solo hay nubes, luces y aves a la deriva.
 * Con "reducir movimiento" queda quieta y completa.
 */
export function EscenaCampus() {
  return (
    <div
      aria-hidden
      className="relative h-full min-h-[34rem] overflow-hidden bg-gradient-to-b from-[#cdeaf3] via-[#e6f4f8] to-papel [mask-image:linear-gradient(to_right,black_86%,transparent)]"
    >
      <SolRadial className="absolute -left-20 -top-16 size-[24rem] text-white opacity-60" />
      <SolRadial fase={1} className="absolute -right-24 top-24 size-60 text-turquesa opacity-[0.14]" />

      <svg viewBox="-30 80 460 560" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full">
        <defs>
          <g id="forma-nube">
            <ellipse cx="42" cy="30" rx="42" ry="15" />
            <ellipse cx="72" cy="21" rx="30" ry="18" />
            <ellipse cx="26" cy="24" rx="22" ry="13" />
            <ellipse cx="104" cy="31" rx="32" ry="12" />
          </g>
          <linearGradient id="cesped" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8fc82f" />
            <stop offset="1" stopColor="#4f8a12" />
          </linearGradient>
        </defs>

        {/* Nubes: tres capas a velocidades distintas */}
        <g fill="#fff" fillOpacity=".9">
          <g className="escena-nube" style={{ animationDuration: "95s", animationDelay: "-30s" }}>
            <use href="#forma-nube" x="0" y="104" />
          </g>
          <g className="escena-nube" style={{ animationDuration: "70s", animationDelay: "-52s" }}>
            <use href="#forma-nube" x="0" y="150" transform="scale(1.25)" />
          </g>
          <g className="escena-nube" style={{ animationDuration: "120s", animationDelay: "-8s" }} fillOpacity=".7">
            <use href="#forma-nube" x="0" y="262" transform="scale(.8)" />
          </g>
          <g className="escena-nube" style={{ animationDuration: "84s", animationDelay: "-66s" }} fillOpacity=".8">
            <use href="#forma-nube" x="0" y="330" transform="scale(1.1)" />
          </g>
        </g>

        {/* Aves */}
        <g fill="none" stroke="#0b2e40" strokeOpacity=".45" strokeWidth="1.8" strokeLinecap="round">
          <g className="escena-ave" style={{ animationDuration: "46s", animationDelay: "-12s" }}>
            <path d="M0 150 q6 -7 12 0 q6 -7 12 0" />
            <path d="M-26 164 q5 -6 10 0 q5 -6 10 0" />
          </g>
          <g className="escena-ave" style={{ animationDuration: "58s", animationDelay: "-40s" }}>
            <path d="M0 214 q5 -6 10 0 q5 -6 10 0" />
          </g>
        </g>

        {/* Colinas */}
        <path d="M-80 436 C 80 384 168 424 256 398 S 374 380 480 402 L480 640 L-80 640 Z" fill="#18668f" fillOpacity=".2" />
        <path d="M-80 478 C 70 446 150 478 236 456 S 360 446 480 466 L480 640 L-80 640 Z" fill="#80bf1f" fillOpacity=".5" />

        {/* Edificio: losas y fondo de vidrio */}
        <rect x="34" y="322" width="304" height="14" rx="2" fill="#cfd5d9" />
        <rect x="44" y="336" width="284" height="84" fill="#2b3f50" />
        <rect x="34" y="420" width="304" height="12" rx="2" fill="#bcc3c8" />
        <rect x="44" y="432" width="284" height="80" fill="#2b3f50" />
        <rect x="34" y="512" width="304" height="12" rx="2" fill="#aeb6bc" />
        <rect x="46" y="524" width="280" height="46" fill="#243645" />

        {/* Aletas: suben una a una al cargar */}
        {ALETAS_ALTAS.map((color, i) => (
          <rect
            key={`a${i}`}
            className="escena-aleta"
            x={46 + i * 28.4}
            y="338"
            width="23"
            height="80"
            fill={color}
            style={{ animationDelay: `${0.15 + i * 0.07}s` }}
          />
        ))}
        {ALETAS_BAJAS.map((color, i) => (
          <rect
            key={`b${i}`}
            className="escena-aleta"
            x={46 + i * 28.4}
            y="434"
            width="23"
            height="76"
            fill={color}
            style={{ animationDelay: `${0.85 + i * 0.07}s` }}
          />
        ))}

        {/* Pilares de la planta baja y letrero liso */}
        {[46, 120, 200, 280, 318].map((x) => (
          <rect key={x} x={x} y="524" width="8" height="46" fill="#e4e8ea" />
        ))}
        <rect x="64" y="526" width="240" height="8" rx="2" fill="#3a4c5b" />

        {/* Luces que se encienden despacio */}
        {VENTANAS_ENCENDIDAS.map((v) => (
          <rect
            key={`${v.x}-${v.y}`}
            className="escena-luz"
            x={v.x}
            y={v.y}
            width="22"
            height="16"
            rx="2"
            fill="#ffd98a"
            style={{ animationDuration: v.d, animationDelay: v.r }}
          />
        ))}

        {/* Postes de luz */}
        <path d="M22 572 V470 M352 572 V470" stroke="#6d7a84" strokeWidth="3" strokeLinecap="round" />
        <circle cx="22" cy="468" r="5" fill="#ffd98a" />
        <circle cx="352" cy="468" r="5" fill="#ffd98a" />

        {/* Césped con brizna que se mece */}
        <path d="M-80 566 C 60 556 140 570 220 560 S 350 556 480 566 L480 640 L-80 640 Z" fill="url(#cesped)" />
        {[18, 52, 96, 150, 204, 262, 318, 372].map((x, i) => (
          <path
            key={x}
            className="escena-brizna"
            d={`M${x} 600 q${i % 2 ? 4 : -4} -22 ${i % 2 ? 2 : -2} -40`}
            fill="none"
            stroke="#a7d84a"
            strokeWidth="3"
            strokeLinecap="round"
            style={{ animationDelay: `${i * 0.5}s` }}
          />
        ))}
      </svg>

      {/* Tarjetas que cuentan para qué sirve SIRA */}
      <div className="anim-flotar absolute left-[8%] top-[17%] flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-tinta shadow-tarjeta">
        <span className="size-2.5 rounded-full bg-verde" />
        Aula 201 · libre ahora
      </div>
      <div
        className="anim-flotar absolute left-[24%] top-[40%] flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-tinta shadow-tarjeta"
        style={{ animationDelay: "-2.6s", animationDuration: "9s" }}
      >
        <Users className="size-3.5 text-azul" />
        Auditorio · 300 personas
      </div>
      <div
        className="anim-flotar absolute bottom-[30%] left-[6%] flex items-center gap-2 rounded-xl bg-tinta px-3 py-2 text-xs font-bold text-white shadow-tarjeta"
        style={{ animationDelay: "-4.5s", animationDuration: "8s" }}
      >
        <CalendarCheck className="size-3.5 text-naranja" />
        Hoy · 2:00 p. m. reservado
      </div>
    </div>
  );
}
