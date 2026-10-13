import Link from "next/link";

const enlaces = [
  { href: "/", texto: "Espacios" },
  { href: "/mis-solicitudes", texto: "Mis solicitudes" },
  { href: "/ingresar", texto: "Ingresar" },
];

export function EncabezadoInstitucional() {
  return (
    <header className="sobre-azul bg-azul text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="flex flex-col leading-tight">
          <span className="font-titulo text-2xl font-extrabold tracking-tight text-white">
            SIRA
          </span>
          <span className="text-sm text-white">
            Uniputumayo · Reserva de espacios
          </span>
        </Link>
        <nav aria-label="Principal">
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            {enlaces.map((e) => (
              <li key={e.href}>
                <Link
                  href={e.href}
                  className="inline-block py-1 font-medium underline-offset-4 hover:underline"
                >
                  {e.texto}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
