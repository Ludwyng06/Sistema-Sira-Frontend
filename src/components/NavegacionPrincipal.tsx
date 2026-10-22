"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import clsx from "clsx";
import {
  Bell,
  CalendarSearch,
  ClipboardList,
  LayoutDashboard,
  LayoutGrid,
  LogIn,
  LogOut,
  Menu,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import { listarNotificaciones } from "@/lib/notificaciones";
import { ETIQUETAS_ROL, type Rol } from "@/lib/tipos-auth";
import { useConsulta } from "@/lib/useConsulta";
import { useSesion } from "./SesionProvider";

interface Entrada {
  href: string;
  texto: string;
  icono: LucideIcon;
  /** Rutas que también la dejan marcada como activa. */
  activaEn: string[];
}

const ENTRADAS = {
  panel: { href: "/panel", texto: "Panel", icono: LayoutDashboard, activaEn: ["/panel"] },
  solicitudes: {
    href: "/mis-solicitudes",
    texto: "Mis solicitudes",
    icono: ClipboardList,
    activaEn: ["/mis-solicitudes", "/solicitar"],
  },
  espacios: {
    href: "/",
    texto: "Espacios",
    icono: LayoutGrid,
    activaEn: ["/espacios", "/sedes"],
  },
  buscar: { href: "/buscar", texto: "Buscar por fecha", icono: CalendarSearch, activaEn: ["/buscar"] },
  servicios: { href: "/servicios", texto: "Servicios", icono: Sparkles, activaEn: ["/servicios"] },
} satisfies Record<string, Entrada>;

/** El rol que se muestra en el chip: el de mayor responsabilidad. */
const PRIORIDAD_ROL: Rol[] = [
  "ADMINISTRADOR",
  "APROBADOR",
  "TESORERIA",
  "AUDITOR",
  "RESPONSABLE_ESPACIO",
  "SOLICITANTE",
];

const baseBoton =
  "group relative inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-bold ring-1 ring-inset transition duration-200 hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0";
const botonSuave = "bg-white/10 text-white ring-white/20 hover:bg-white/20 hover:ring-white/40";
const botonActivo = "bg-white text-azul-oscuro ring-white shadow-[0_6px_18px_-8px_rgb(0_0_0/0.5)]";

function nombreVisible(correo: string): string {
  return correo
    .split("@")[0]!
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function iniciales(nombre: string): string {
  const partes = nombre.split(" ").filter(Boolean);
  return ((partes[0]?.[0] ?? "?") + (partes[1]?.[0] ?? "")).toUpperCase();
}

function esActiva(ruta: string, entrada: Entrada): boolean {
  if (entrada.href === "/") return ruta === "/" || entrada.activaEn.some((p) => ruta.startsWith(p));
  return entrada.activaEn.some((p) => ruta.startsWith(p));
}

function Boton({
  entrada,
  activa,
  orden,
  alElegir,
  insignia,
}: {
  entrada: Entrada;
  activa: boolean;
  orden: number;
  alElegir: () => void;
  insignia?: ReactNode;
}) {
  const Icono = entrada.icono;
  return (
    <li className="anim-aparecer" style={{ animationDelay: `${orden * 45}ms` }}>
      <Link
        href={entrada.href}
        onClick={alElegir}
        aria-current={activa ? "page" : undefined}
        className={clsx(baseBoton, activa ? botonActivo : botonSuave)}
      >
        <Icono
          aria-hidden
          className="size-4 transition-transform duration-200 group-hover:scale-110 motion-reduce:transition-none"
        />
        {entrada.texto}
        {insignia}
      </Link>
    </li>
  );
}

/** Se monta solo con sesión: pide el conteo de no leídas. */
function BotonNotificaciones({
  activa,
  orden,
  alElegir,
}: {
  activa: boolean;
  orden: number;
  alElegir: () => void;
}) {
  const { resultado } = useConsulta(() => listarNotificaciones({ soloNoLeidas: true, porPagina: 1 }), []);
  const noLeidas = resultado.estado === "listo" ? resultado.datos.noLeidas : 0;
  return (
    <li className="anim-aparecer" style={{ animationDelay: `${orden * 45}ms` }}>
      <Link
        href="/notificaciones"
        onClick={alElegir}
        aria-current={activa ? "page" : undefined}
        aria-label={noLeidas > 0 ? `Notificaciones, ${noLeidas} sin leer` : "Notificaciones"}
        title="Notificaciones"
        className={clsx(baseBoton, "size-9 justify-center !px-0", activa ? botonActivo : botonSuave)}
      >
        <Bell
          aria-hidden
          className="size-[1.1rem] origin-top transition-transform duration-300 group-hover:rotate-12 motion-reduce:transition-none"
        />
        {noLeidas > 0 && (
          <span
            aria-hidden
            className="absolute -right-1.5 -top-1.5 flex min-w-5 items-center justify-center rounded-full bg-naranja px-1 text-xs font-extrabold text-tinta ring-2 ring-azul"
          >
            {noLeidas}
          </span>
        )}
      </Link>
    </li>
  );
}

export function NavegacionPrincipal() {
  const { estado, usuario, esPersonal, tieneRol, salir } = useSesion();
  const ruta = usePathname();
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);

  async function cerrarSesion() {
    setAbierto(false);
    await salir();
    router.push("/");
  }

  const cerrar = () => setAbierto(false);
  const autenticado = estado === "autenticado" && usuario !== null;

  // Orden por prioridad según quién eres: lo tuyo primero, la exploración después.
  const entradas: Entrada[] = [];
  if (esPersonal) entradas.push(ENTRADAS.panel);
  // "Mis solicitudes" solo tiene sentido para quien puede solicitar (tiene perfil de solicitante).
  if (autenticado && tieneRol("SOLICITANTE")) entradas.push(ENTRADAS.solicitudes);
  entradas.push(ENTRADAS.espacios, ENTRADAS.buscar);
  if (!autenticado) entradas.push(ENTRADAS.servicios);

  const rolPrincipal = usuario ? PRIORIDAD_ROL.find((r) => tieneRol(r)) : undefined;
  const nombre = usuario ? nombreVisible(usuario.correo) : "";
  const totalAntes = entradas.length + (autenticado ? 1 : 0);

  return (
    <>
      <button
        type="button"
        aria-expanded={abierto}
        aria-controls="menu-principal"
        onClick={() => setAbierto(!abierto)}
        className={clsx(baseBoton, botonSuave, "md:hidden")}
      >
        {abierto ? <X aria-hidden className="size-4" /> : <Menu aria-hidden className="size-4" />}
        Menú
      </button>

      <nav
        id="menu-principal"
        aria-label="Principal"
        className={clsx("order-3 w-full md:order-2 md:block md:w-auto", abierto ? "block" : "hidden")}
      >
        <ul className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:justify-end">
          {entradas.map((e, i) => (
            <Boton key={e.href} entrada={e} activa={esActiva(ruta, e)} orden={i} alElegir={cerrar} />
          ))}

          {autenticado && (
            <BotonNotificaciones
              activa={ruta.startsWith("/notificaciones")}
              orden={entradas.length}
              alElegir={cerrar}
            />
          )}

          {estado === "cargando" && (
            <li aria-hidden className="h-9 w-28 animate-pulse rounded-full bg-white/15" />
          )}

          {autenticado && (
            <li
              className="anim-aparecer flex items-center gap-2.5 rounded-full bg-black/15 py-1 pl-1 pr-1 ring-1 ring-inset ring-white/15 lg:pr-4"
              style={{ animationDelay: `${totalAntes * 45}ms` }}
              title={`${nombre} · ${usuario.correo}`}
            >
              <span
                aria-hidden
                className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-turquesa to-azul font-titulo text-xs font-black text-white ring-2 ring-white/70"
              >
                {iniciales(nombre)}
              </span>
              <span className="hidden min-w-0 flex-col leading-tight lg:flex">
                <span className="max-w-[10rem] truncate text-sm font-bold text-white">{nombre}</span>
                {rolPrincipal && (
                  <span className="text-xs font-medium text-white/80">{ETIQUETAS_ROL[rolPrincipal]}</span>
                )}
              </span>
            </li>
          )}

          {estado !== "cargando" && (
            <li className="anim-aparecer" style={{ animationDelay: `${(totalAntes + 1) * 45}ms` }}>
              {autenticado ? (
                <button
                  type="button"
                  onClick={cerrarSesion}
                  className={clsx(
                    baseBoton,
                    "bg-white text-azul-oscuro ring-white hover:bg-turquesa-suave",
                  )}
                >
                  <LogOut
                    aria-hidden
                    className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
                  />
                  Salir
                </button>
              ) : (
                <Link
                  href="/ingresar"
                  onClick={cerrar}
                  className={clsx(
                    baseBoton,
                    "bg-white text-azul-oscuro ring-white hover:bg-turquesa-suave",
                  )}
                >
                  <LogIn
                    aria-hidden
                    className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
                  />
                  Ingresar
                </Link>
              )}
            </li>
          )}
        </ul>
      </nav>
    </>
  );
}
