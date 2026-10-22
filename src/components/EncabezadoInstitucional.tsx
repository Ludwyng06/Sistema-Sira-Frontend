import Link from "next/link";
import { Suspense } from "react";
import { Marca } from "./marca/Logo";
import { NavegacionPrincipal } from "./NavegacionPrincipal";

export function EncabezadoInstitucional() {
  return (
    <header className="sobre-azul relative z-10 bg-gradient-to-r from-azul to-azul-oscuro text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
        <Link href="/" aria-label="SIRA, Uniputumayo. Ir al inicio" className="order-1 rounded">
          <Marca variante="blanco" detalle="SIRA · Reserva de espacios" />
        </Link>
        {/* usePathname solo existe al atender la petición: va dentro de Suspense para poder prerenderizar. */}
        <Suspense fallback={<div aria-hidden className="order-2 h-9 w-48 animate-pulse rounded-full bg-white/15" />}>
          <NavegacionPrincipal />
        </Suspense>
      </div>
    </header>
  );
}
