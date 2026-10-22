import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BordeRasgado } from "@/components/marca/BordeRasgado";
import { Logo, Marca } from "@/components/marca/Logo";
import { SolRadial } from "@/components/marca/SolRadial";

/** Pantalla dividida: a la izquierda la identidad de la U, a la derecha el formulario. */
export default function LayoutAuth({ children }: LayoutProps<"/">) {
  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-fondo focus:px-4 focus:py-2 focus:font-medium focus:text-azul-oscuro"
      >
        Saltar al formulario
      </a>
      <div className="grid min-h-dvh flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* Móvil: franja de marca con borde rasgado */}
        <div className="sobre-azul relative bg-gradient-to-r from-azul to-azul-oscuro px-4 pb-10 pt-5 text-white lg:hidden">
          <Link href="/" aria-label="Uniputumayo. Ir al inicio" className="inline-block rounded">
            <Marca variante="blanco" detalle="SIRA · Reserva de espacios" />
          </Link>
          <BordeRasgado
            ocupa="arriba"
            tamano="fino"
            semilla={21}
            className="absolute inset-x-0 bottom-0 text-fondo"
          />
        </div>

        {/* Escritorio: panel de identidad */}
        <aside className="sobre-azul relative isolate hidden bg-gradient-to-l from-turquesa via-azul to-azul-oscuro text-white lg:flex">
          <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
            <SolRadial className="absolute -left-28 -top-32 size-[34rem] opacity-[0.14]" />
            <SolRadial girar={false} className="absolute -bottom-52 -right-24 size-[26rem] opacity-[0.08]" />
          </div>
          <BordeRasgado
            orientacion="vertical"
            ocupa="izquierda"
            semilla={13}
            className="absolute inset-y-0 -right-[31px] text-turquesa sm:-right-[47px]"
          />
          <div className="flex w-full flex-col justify-between gap-10 p-12">
            <Link href="/" aria-label="Uniputumayo. Ir al inicio" className="w-fit rounded">
              <Marca variante="blanco" tamano="grande" detalle="SIRA · Reserva de espacios" />
            </Link>
            <div className="flex flex-col gap-6">
              <Logo variante="blanco" alto={110} className="anim-flotar opacity-95" />
              <p className="max-w-sm font-titulo text-4xl font-black leading-[1.05] tracking-tight">
                Pide tu espacio y sigue el trámite desde aquí.
              </p>
              <p className="max-w-sm text-lg text-white/90">
                Sin correos de ida y vuelta. Ves qué está libre, lo pides y te avisamos qué pasó.
              </p>
            </div>
            <p className="font-titulo text-lg font-bold italic text-white/90">#Un Sueño hecho Realidad</p>
          </div>
        </aside>

        <main id="contenido" className="flex flex-col justify-center bg-fondo px-4 py-10 sm:px-8 lg:px-16 lg:py-12">
          <div className="mx-auto flex w-full max-w-lg flex-col gap-8">
            <Link
              href="/"
              className="hidden w-fit items-center gap-2 font-medium text-azul-oscuro underline-offset-4 hover:underline lg:inline-flex"
            >
              <ArrowLeft aria-hidden className="size-4" />
              Volver al inicio
            </Link>
            {children}
            <p className="text-xs font-bold tracking-widest text-gris">VIGILADA MINEDUCACIÓN</p>
          </div>
        </main>
      </div>
    </>
  );
}
