import Link from "next/link";
import { NavegacionPrincipal } from "./NavegacionPrincipal";

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
        <NavegacionPrincipal />
      </div>
    </header>
  );
}
