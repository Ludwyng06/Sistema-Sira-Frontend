import clsx from "clsx";
import { CircleAlert, CircleCheck, Loader2, X } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

const claseControl =
  "min-h-12 w-full rounded-campo border border-gris/70 bg-fondo px-3.5 py-2.5 text-base text-texto transition-colors placeholder:text-gris/70 hover:border-azul focus:border-azul disabled:bg-fondo-suave disabled:text-gris aria-[invalid=true]:border-2 aria-[invalid=true]:border-azul-oscuro";

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
        <p id={`${id}-ayuda`} className="text-meta text-gris">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-base font-bold text-error">
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
        <p id={`${id}-ayuda`} className="text-meta text-gris">
          {ayuda}
        </p>
      )}
    </div>
  );
}

/** Horarios de 6:00 a. m. a 10:00 p. m., cada 15 minutos. Valor "HH:MM" (hora de Bogotá). */
const HORARIOS = Array.from({ length: (22 - 6) * 4 + 1 }, (_, i) => {
  const minutos = 6 * 60 + i * 15;
  return etiquetaHora(`${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`);
});

function etiquetaHora(valor: string): { valor: string; texto: string } {
  const [h, m] = valor.split(":").map(Number) as [number, number];
  return { valor, texto: `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "a. m." : "p. m."}` };
}

/**
 * Selector de hora propio: igual en todos los navegadores y con el formato de la Institución
 * ("8:00 a. m."). Reemplaza al selector nativo, que se ve distinto en cada navegador.
 */
export function CampoHora({
  id,
  etiqueta,
  ayuda,
  ...props
}: Omit<ComponentProps<"select">, "id" | "children"> & { id: string; etiqueta: string; ayuda?: string }) {
  const actual = String(props.value ?? props.defaultValue ?? "");
  const opciones =
    actual && !HORARIOS.some((h) => h.valor === actual) ? [...HORARIOS, etiquetaHora(actual)].sort((x, y) => x.valor.localeCompare(y.valor)) : HORARIOS;
  return (
    <Selector id={id} etiqueta={etiqueta} ayuda={ayuda} {...props}>
      {opciones.map((h) => (
        <option key={h.valor} value={h.valor}>
          {h.texto}
        </option>
      ))}
    </Selector>
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
        <p id={`${id}-ayuda`} className="text-meta text-gris">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-base font-bold text-error">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Mensaje dentro de la página. Con `titulo` y `queHacer` explica qué pasó y qué sigue;
 * con `onCerrar` se puede descartar. Nunca depende solo del color: lleva ícono y texto.
 */
export function Alerta({
  tipo,
  titulo,
  queHacer,
  onCerrar,
  children,
}: {
  tipo: "error" | "exito" | "info";
  titulo?: string;
  queHacer?: string;
  onCerrar?: () => void;
  children: ReactNode;
}) {
  const Icono = tipo === "exito" ? CircleCheck : CircleAlert;
  return (
    <div
      role={tipo === "error" ? "alert" : "status"}
      className={clsx(
        "anim-aparecer relative flex items-start gap-3 overflow-hidden rounded-tarjeta bg-fondo-suave py-3 pl-5 pr-4",
        onCerrar && "pr-11",
      )}
    >
      <span
        aria-hidden
        className={clsx(
          "absolute inset-y-0 left-0 w-1.5",
          tipo === "error" && "bg-error",
          tipo === "exito" && "bg-verde",
          tipo === "info" && "bg-naranja",
        )}
      />
      <Icono
        aria-hidden
        className={clsx("mt-0.5 size-5 shrink-0", tipo === "error" ? "text-error" : "text-azul-oscuro")}
      />
      <div className="flex flex-col gap-1">
        {titulo && <p className="font-titulo font-extrabold text-tinta">{titulo}</p>}
        <div>{children}</div>
        {queHacer && (
          <p>
            <span className="font-bold text-azul-oscuro">Qué hacer: </span>
            {queHacer}
          </p>
        )}
      </div>
      {onCerrar && (
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar mensaje"
          className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full text-gris hover:bg-white hover:text-tinta"
        >
          <X aria-hidden className="size-5" />
        </button>
      )}
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
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-campo px-5 py-2.5 text-base font-bold transition duration-200 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none",
        variante === "primario" &&
          "bg-azul text-white shadow-boton hover:-translate-y-px hover:bg-azul-oscuro active:translate-y-0 motion-reduce:hover:translate-y-0",
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
        <h1 className="text-t1 font-black tracking-tight">{titulo}</h1>
        {descripcion && <p className="text-lg text-gris">{descripcion}</p>}
      </header>
      {children}
    </section>
  );
}
