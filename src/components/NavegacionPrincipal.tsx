"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { listarNotificaciones } from "@/lib/notificaciones";
import { useConsulta } from "@/lib/useConsulta";
import { useSesion } from "./SesionProvider";

const claseEnlace =
  "relative inline-block py-1 font-medium text-white/90 hover:text-white after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-white after:transition-transform after:duration-300 hover:after:scale-x-100 motion-reduce:after:transition-none";
const clasePildora =
  "inline-flex items-center rounded-full bg-white px-4 py-1.5 font-bold text-azul-oscuro transition-colors hover:bg-turquesa-suave";

/** Se monta solo con sesión: pide el conteo de no leídas. */
function EnlaceNotificaciones() {
  const { resultado } = useConsulta(
    () => listarNotificaciones({ soloNoLeidas: true, porPagina: 1 }),
    [],
  );
  const noLeidas = resultado.estado === "listo" ? resultado.datos.noLeidas : 0;
  return (
    <Link href="/notificaciones" className={claseEnlace}>
      Notificaciones
      {noLeidas > 0 && (
        <span className="ml-1 rounded-full bg-fondo px-2 text-sm font-bold text-azul-oscuro">
          {noLeidas}
          <span className="sr-only"> sin leer</span>
        </span>
      )}
    </Link>
  );
}

export function NavegacionPrincipal() {
  const { estado, usuario, esPersonal, salir } = useSesion();
  const router = useRouter();

  async function cerrarSesion() {
    await salir();
    router.push("/");
  }

  return (
    <nav aria-label="Principal">
      <ul className="flex flex-wrap items-center gap-x-5 gap-y-1">
        <li>
          <Link href="/" className={claseEnlace}>
            Espacios
          </Link>
        </li>
        <li>
          <Link href="/buscar" className={claseEnlace}>
            Buscar por fecha
          </Link>
        </li>
        <li>
          <Link href="/mis-solicitudes" className={claseEnlace}>
            Mis solicitudes
          </Link>
        </li>
        {esPersonal && (
          <li>
            <Link href="/panel" className={claseEnlace}>
              Panel
            </Link>
          </li>
        )}
        {estado === "autenticado" && usuario ? (
          <>
            <li>
              <EnlaceNotificaciones />
            </li>
            <li className="hidden max-w-[14rem] truncate text-sm text-white/80 lg:block" title={usuario.correo}>
              {usuario.correo}
            </li>
            <li>
              <button type="button" onClick={cerrarSesion} className={clasePildora}>
                Salir
              </button>
            </li>
          </>
        ) : (
          <li>
            <Link href="/ingresar" className={clasePildora}>
              Ingresar
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
