import Link from "next/link";

const enlaces = [
  { href: "/servicios", texto: "Servicios" },
  { href: "/simulador", texto: "Simulador de tarifa" },
  { href: "/ayuda", texto: "Ayuda" },
];

export function PieInstitucional() {
  return (
    <footer className="sobre-azul mt-8 bg-azul-oscuro text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-6 text-sm sm:px-6">
        <p className="font-titulo text-base font-bold text-white">
          Institución Universitaria del Putumayo
        </p>
        <p>SIRA · Sistema de Inventario y Reserva de Activos</p>
        <nav aria-label="Información" className="my-1">
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            {enlaces.map((e) => (
              <li key={e.href}>
                <Link href={e.href} className="inline-block py-1 underline underline-offset-4">
                  {e.texto}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="font-bold tracking-wide">VIGILADA MINEDUCACIÓN</p>
      </div>
    </footer>
  );
}
