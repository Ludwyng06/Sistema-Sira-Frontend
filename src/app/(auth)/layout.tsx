import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BordeRasgado } from "@/components/marca/BordeRasgado";
import { Marca } from "@/components/marca/Logo";
import { SelloEntrada } from "@/components/marca/SelloEntrada";
import { SolRadial } from "@/components/marca/SolRadial";

/**
 * Pantalla dividida. Firma: el sello de entrada. Lo estándar (campos, botón, enlaces) va a la
 * derecha, centrado y sin adornos.
 */
export default function LayoutAuth({ children }: LayoutProps<"/">) {
  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-campo focus:bg-fondo focus:px-4 focus:py-2 focus:font-bold focus:text-azul-oscuro"
      >
        Saltar al formulario
      </a>
      <div className="grid min-h-dvh flex-1 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        {/* Móvil: franja breve con la marca y el sello */}
        <div className="sobre-azul relative flex items-center justify-between gap-4 bg-gradient-to-r from-azul to-azul-oscuro px-4 pb-9 pt-5 text-white lg:hidden">
          <Link href="/" aria-label="Uniputumayo. Ir al inicio" className="rounded">
            <Marca variante="blanco" detalle="SIRA · Reserva de espacios" />
          </Link>
          <SelloEntrada className="size-16 shrink-0 -rotate-6 text-white/80" />
          <BordeRasgado ocupa="arriba" tamano="fino" semilla={21} className="absolute inset-x-0 bottom-0 text-fondo" />
        </div>

        {/* Escritorio: hoja azul con el sello */}
        <aside className="sobre-azul relative isolate hidden bg-gradient-to-l from-azul to-azul-oscuro text-white lg:flex">
          <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
            <SolRadial className="absolute -left-24 -top-28 size-[30rem] opacity-[0.12]" />
            <SolRadial fase={1} className="absolute -bottom-48 -right-20 size-[24rem] opacity-[0.07]" />
          </div>
          <BordeRasgado
            orientacion="vertical"
            ocupa="izquierda"
            semilla={13}
            className="absolute inset-y-0 -right-[31px] text-azul sm:-right-[47px]"
          />
          <div className="flex w-full flex-col justify-between gap-10 p-10 xl:p-14">
            <Link href="/" aria-label="Uniputumayo. Ir al inicio" className="w-fit rounded">
              <Marca variante="blanco" tamano="grande" detalle="SIRA · Reserva de espacios" />
            </Link>
            <div className="flex flex-col items-center gap-8 text-center">
              <SelloEntrada className="size-64 xl:size-72" />
              <p className="max-w-xs font-titulo text-2xl font-extrabold leading-snug">
                Ingresa para pedir un espacio y ver cómo va tu solicitud.
              </p>
            </div>
            <p className="font-titulo text-lg font-bold italic text-white/90">#Un Sueño hecho Realidad</p>
          </div>
        </aside>

        <main id="contenido" className="flex flex-col justify-center bg-fondo px-4 py-10 sm:px-8 lg:px-16 lg:py-12">
          <div className="mx-auto flex w-full max-w-md flex-col gap-8">
            <Link
              href="/"
              className="hidden min-h-11 w-fit items-center gap-2 font-bold text-azul-oscuro underline-offset-4 hover:underline lg:inline-flex"
            >
              <ArrowLeft aria-hidden className="size-4" />
              Volver al inicio
            </Link>
            {children}
            <p className="text-meta font-bold tracking-widest text-gris">VIGILADA MINEDUCACIÓN</p>
          </div>
        </main>
      </div>
    </>
  );
}
