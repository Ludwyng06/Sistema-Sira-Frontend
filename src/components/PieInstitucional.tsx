import Link from "next/link";
import { BordeRasgado } from "./marca/BordeRasgado";
import { Marca } from "./marca/Logo";
import { SolRadial } from "./marca/SolRadial";

const enlaces = [
  { href: "/", texto: "Espacios" },
  { href: "/buscar", texto: "Buscar por fecha" },
  { href: "/servicios", texto: "Servicios" },
  { href: "/simulador", texto: "Simulador de tarifa" },
  { href: "/ayuda", texto: "Ayuda" },
];

export function PieInstitucional() {
  return (
    <footer className="sobre-azul mt-16 text-white">
      <BordeRasgado ocupa="abajo" semilla={11} className="text-tinta" />
      <div className="relative overflow-hidden bg-tinta">
        <SolRadial className="pointer-events-none absolute -bottom-24 -right-16 size-72 text-white opacity-[0.07]" />
        <div className="relative mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr]">
          <div className="flex flex-col gap-4">
            <Marca variante="blanco" detalle="Institución Universitaria del Putumayo" />
            <p className="font-titulo text-xl font-extrabold italic text-white/90">
              #Un Sueño hecho Realidad
            </p>
            <p className="max-w-sm text-white/85">
              SIRA es el Sistema de Inventario y Reserva de Activos de la sede Mocoa.
            </p>
          </div>
          <nav aria-label="Información" className="flex flex-col gap-2">
            <h2 className="font-titulo text-meta font-bold uppercase tracking-widest text-white/80">
              En este sitio
            </h2>
            <ul className="grid gap-1 sm:grid-cols-2 md:grid-cols-1">
              {enlaces.map((e) => (
                <li key={e.href}>
                  <Link
                    href={e.href}
                    className="inline-flex min-h-11 items-center text-white/90 underline-offset-4 hover:text-white hover:underline"
                  >
                    {e.texto}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="relative border-t border-white/15">
          <p className="mx-auto w-full max-w-6xl px-4 py-4 text-meta font-bold tracking-widest text-white/90 sm:px-6">
            VIGILADA MINEDUCACIÓN
          </p>
        </div>
      </div>
    </footer>
  );
}
