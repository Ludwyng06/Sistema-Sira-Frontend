import Link from "next/link";
import { Marca } from "./marca/Logo";
import { NavegacionPrincipal } from "./NavegacionPrincipal";

export function EncabezadoInstitucional() {
  return (
    <header className="sobre-azul relative z-10 bg-gradient-to-r from-azul to-azul-oscuro text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
        <Link href="/" aria-label="SIRA, Uniputumayo. Ir al inicio" className="rounded">
          <Marca variante="blanco" detalle="SIRA · Reserva de espacios" />
        </Link>
        <NavegacionPrincipal />
      </div>
    </header>
  );
}
