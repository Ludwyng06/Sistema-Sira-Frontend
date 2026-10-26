"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useSesion } from "./SesionProvider";
import type { Rol } from "@/lib/tipos-auth";

interface Entrada {
  href: string;
  texto: string;
  /** Roles que la ven. Vacío = cualquier rol de panel. */
  roles: Rol[];
}

export const ENTRADAS_PANEL: Entrada[] = [
  { href: "/panel", texto: "Tablero", roles: ["ADMINISTRADOR", "APROBADOR", "TESORERIA", "AUDITOR"] },
  {
    href: "/panel/aprobaciones",
    texto: "Aprobaciones",
    roles: ["RESPONSABLE_ESPACIO", "APROBADOR", "ADMINISTRADOR", "AUDITOR"],
  },
  { href: "/panel/pagos", texto: "Pagos", roles: ["TESORERIA", "AUDITOR"] },
  { href: "/panel/calendario", texto: "Calendario", roles: ["ADMINISTRADOR", "RESPONSABLE_ESPACIO"] },
  { href: "/panel/actas", texto: "Actas", roles: ["RESPONSABLE_ESPACIO"] },
  { href: "/panel/inventario", texto: "Inventario", roles: ["ADMINISTRADOR", "AUDITOR"] },
  { href: "/panel/auditoria", texto: "Bitácora", roles: ["ADMINISTRADOR", "AUDITOR"] },
  { href: "/panel/configuracion", texto: "Configuración", roles: ["ADMINISTRADOR"] },
];

/** Menú lateral armado según los roles de la sesión. */
export function MenuPanel() {
  const { tieneRol } = useSesion();
  const ruta = usePathname();
  const visibles = ENTRADAS_PANEL.filter((e) => e.roles.length === 0 || tieneRol(...e.roles));

  return (
    <nav aria-label="Panel" className="md:w-60 md:shrink-0">
      <ul className="flex flex-wrap gap-1.5 rounded-tarjeta bg-tinta p-2 md:sticky md:top-4 md:flex-col md:gap-1 md:p-3">
        {visibles.map((e) => {
          const activa = e.href === "/panel" ? ruta === "/panel" : ruta.startsWith(e.href);
          return (
            <li key={e.href}>
              <Link
                href={e.href}
                aria-current={activa ? "page" : undefined}
                className={clsx(
                  "block rounded-campo px-3.5 py-2.5 font-bold transition-colors",
                  activa ? "bg-white text-tinta" : "text-white/85 hover:bg-white/10 hover:text-white",
                )}
              >
                {e.texto}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
