"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, type ReactNode } from "react";
import { Lock } from "lucide-react";
import type { Rol } from "@/lib/tipos-auth";
import { Esqueleto, RegionCargando } from "./Esqueleto";
import { useSesion } from "./SesionProvider";

/**
 * Protege una zona. Sin sesión lleva a /ingresar; con sesión pero sin el rol pedido
 * muestra "No tienes acceso". La autorización real la hace siempre la API.
 * `roles` vacío = cualquier usuario autenticado; `soloPersonal` = cualquier rol de panel.
 */
export function GuardiaSesion(props: {
  roles?: Rol[];
  soloPersonal?: boolean;
  children: ReactNode;
}) {
  // usePathname solo existe al responder la petición: va dentro de Suspense para poder prerenderizar.
  return (
    <Suspense fallback={<CargandoSesion />}>
      <Guardia {...props} />
    </Suspense>
  );
}

function CargandoSesion() {
  return (
    <RegionCargando etiqueta="Verificando tu sesión">
      <Esqueleto className="h-8 w-64" />
      <Esqueleto className="mt-4 h-40 w-full" />
    </RegionCargando>
  );
}

function Guardia({
  roles = [],
  soloPersonal = false,
  children,
}: {
  roles?: Rol[];
  soloPersonal?: boolean;
  children: ReactNode;
}) {
  const { estado, tieneRol, esPersonal } = useSesion();
  const router = useRouter();
  const ruta = usePathname();

  useEffect(() => {
    if (estado === "anonimo") {
      router.replace(`/ingresar?siguiente=${encodeURIComponent(ruta)}`);
    }
  }, [estado, router, ruta]);

  if (estado !== "autenticado") return <CargandoSesion />;

  const permitido =
    (roles.length === 0 || tieneRol(...roles)) && (!soloPersonal || esPersonal);
  if (!permitido) {
    return (
      <section className="flex flex-col items-center gap-3 rounded-lg border border-gris-claro bg-fondo-suave px-6 py-12 text-center">
        <Lock aria-hidden className="size-10 text-azul-oscuro" />
        <h1 className="text-2xl font-bold">No tienes acceso a esta sección</h1>
        <p className="max-w-prose text-gris">
          Tu cuenta no tiene el rol necesario para ver esta página.
        </p>
        <Link
          href="/"
          className="rounded bg-azul px-4 py-2 font-medium text-white hover:bg-azul-oscuro"
        >
          Ir al inicio
        </Link>
      </section>
    );
  }
  return <>{children}</>;
}
