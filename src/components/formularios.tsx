import clsx from "clsx";
import { CircleAlert, CircleCheck, Loader2 } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

const claseControl =
  "w-full rounded-lg border border-gris/70 bg-fondo px-3.5 py-2.5 text-texto transition-colors placeholder:text-gris/70 hover:border-azul focus:border-azul disabled:bg-fondo-suave disabled:text-gris aria-[invalid=true]:border-2 aria-[invalid=true]:border-azul-oscuro";

/** Campo con etiqueta visible, ayuda y error enlazados por aria. */
export function Campo({
  id,
  etiqueta,
  ayuda,
  error,
  className,
  ...props
}: Omit<ComponentProps<"input">, "id"> & {
  id: string;
  etiqueta: string;
  ayuda?: string;
  error?: string;
}) {
  const descripcion = [ayuda && `${id}-ayuda`, error && `${id}-error`].filter(Boolean).join(" ");
  return (
    <div className={clsx("flex flex-col gap-1", className)}>
      <label htmlFor={id} className="font-bold text-tinta">
        {etiqueta}
        {props.required && <span aria-hidden> *</span>}
      </label>
      <input
        id={id}
        name={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={descripcion || undefined}
        className={claseControl}
        {...props}
      />
      {ayuda && (
        <p id={`${id}-ayuda`} className="text-sm text-gris">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm font-medium text-azul-oscuro">
          {error}
        </p>
      )}
    </div>
  );
}

export function Selector({
  id,
  etiqueta,
  ayuda,
  children,
  className,
  ...props
}: Omit<ComponentProps<"select">, "id"> & { id: string; etiqueta: string; ayuda?: string }) {
  return (
    <div className={clsx("flex flex-col gap-1", className)}>
      <label htmlFor={id} className="font-bold text-tinta">
        {etiqueta}
        {props.required && <span aria-hidden> *</span>}
      </label>
      <select
        id={id}
        name={id}
        aria-describedby={ayuda ? `${id}-ayuda` : undefined}
        className={claseControl}
        {...props}
      >
        {children}
      </select>
      {ayuda && (
        <p id={`${id}-ayuda`} className="text-sm text-gris">
          {ayuda}
        </p>
      )}
    </div>
  );
}

export function AreaTexto({
  id,
  etiqueta,
  ayuda,
  error,
  className,
  ...props
}: Omit<ComponentProps<"textarea">, "id"> & {
  id: string;
  etiqueta: string;
  ayuda?: string;
  error?: string;
}) {
  const descripcion = [ayuda && `${id}-ayuda`, error && `${id}-error`].filter(Boolean).join(" ");
  return (
    <div className={clsx("flex flex-col gap-1", className)}>
      <label htmlFor={id} className="font-bold text-tinta">
        {etiqueta}
        {props.required && <span aria-hidden> *</span>}
      </label>
      <textarea
        id={id}
        name={id}
        rows={4}
        aria-invalid={error ? true : undefined}
        aria-describedby={descripcion || undefined}
        className={claseControl}
        {...props}
      />
      {ayuda && (
        <p id={`${id}-ayuda`} className="text-sm text-gris">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm font-medium text-azul-oscuro">
          {error}
        </p>
      )}
    </div>
  );
}

/** Mensaje de la API o de éxito; nunca solo color: lleva ícono y texto. */
export function Alerta({
  tipo,
  children,
}: {
  tipo: "error" | "exito" | "info";
  children: ReactNode;
}) {
  const Icono = tipo === "exito" ? CircleCheck : CircleAlert;
  return (
    <div
      role={tipo === "error" ? "alert" : "status"}
      className={clsx(
        "flex items-start gap-2 rounded-lg border-l-4 bg-fondo-suave px-4 py-3",
        tipo === "error" && "border-azul-oscuro",
        tipo === "exito" && "border-verde",
        tipo === "info" && "border-naranja",
      )}
    >
      <Icono aria-hidden className="mt-0.5 size-5 shrink-0 text-azul-oscuro" />
      <div>{children}</div>
    </div>
  );
}

export function Boton({
  cargando,
  variante = "primario",
  className,
  children,
  disabled,
  ...props
}: ComponentProps<"button"> & {
  cargando?: boolean;
  variante?: "primario" | "secundario" | "peligro";
}) {
  return (
    <button
      type="button"
      disabled={disabled || cargando}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 font-bold transition duration-200 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none",
        variante === "primario" &&
          "bg-azul text-white shadow-[0_2px_0_0_var(--color-azul-oscuro)] hover:-translate-y-px hover:bg-azul-oscuro active:translate-y-0 motion-reduce:hover:translate-y-0",
        variante === "secundario" &&
          "border-2 border-azul bg-fondo text-azul-oscuro hover:bg-turquesa-suave",
        variante === "peligro" && "bg-tinta text-white hover:bg-texto",
        className,
      )}
      {...props}
    >
      {cargando && <Loader2 aria-hidden className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

/** Encabezado y contenedor de los formularios de acceso (van sobre fondo blanco, sin tarjeta). */
export function TarjetaFormulario({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion?: string;
  children: ReactNode;
}) {
  return (
    <section className="anim-aparecer flex w-full flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{titulo}</h1>
        {descripcion && <p className="text-lg text-gris">{descripcion}</p>}
      </header>
      {children}
    </section>
  );
}
