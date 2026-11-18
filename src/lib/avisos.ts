import { explicarError, type Explicacion } from "./mensajes";

export type TipoAviso = "error" | "exito" | "info" | "advertencia";

export interface Aviso extends Omit<Explicacion, "porQue"> {
  id: number;
  tipo: TipoAviso;
  porQue?: string;
  /** Milisegundos que se queda en pantalla (se detiene si el cursor está encima). */
  duracion: number;
  saliendo: boolean;
}

const MAXIMO_VISIBLES = 4;

let siguiente = 1;
let lista: Aviso[] = [];
const oyentes = new Set<() => void>();

function emitir(nueva: Aviso[]) {
  lista = nueva;
  oyentes.forEach((o) => o());
}

/** Almacén externo: lo lee el componente <Avisos/> con useSyncExternalStore. */
export const almacenAvisos = {
  suscribir(oyente: () => void) {
    oyentes.add(oyente);
    return () => {
      oyentes.delete(oyente);
    };
  },
  instantanea: () => lista,
};

function agregar(tipo: TipoAviso, contenido: Omit<Explicacion, "porQue"> & { porQue?: string }, duracion: number) {
  // No se repite el mismo aviso mientras siga visible.
  if (lista.some((a) => !a.saliendo && a.tipo === tipo && a.titulo === contenido.titulo && a.porQue === contenido.porQue)) {
    return;
  }
  const visibles = lista.filter((a) => !a.saliendo);
  const sobran = Math.max(0, visibles.length - (MAXIMO_VISIBLES - 1));
  const marcados = new Set(visibles.slice(0, sobran).map((a) => a.id));
  emitir([
    ...lista.map((a) => (marcados.has(a.id) ? { ...a, saliendo: true } : a)),
    { ...contenido, id: siguiente++, tipo, duracion, saliendo: false },
  ]);
}

/** Avisos en pantalla. Se pueden llamar desde cualquier parte, sin hooks. */
export const avisar = {
  exito: (titulo: string, porQue?: string) => agregar("exito", { titulo, porQue }, 5500),
  info: (titulo: string, porQue?: string, queHacer?: string) =>
    agregar("info", { titulo, porQue, queHacer }, 9000),
  advertencia: (titulo: string, porQue?: string, queHacer?: string) =>
    agregar("advertencia", { titulo, porQue, queHacer }, 11000),
  /** Explica un error de la API: qué pasó, por qué y qué hacer. */
  error: (error: unknown, respaldo: string) => {
    const e = explicarError(error, respaldo);
    agregar("error", e, e.queHacer || e.accion ? 15000 : 9000);
  },
  /** Para errores que ya escribiste con sus tres partes. */
  errorManual: (contenido: Explicacion) => agregar("error", contenido, 12000),
  /** Inicia la animación de salida. */
  cerrar(id: number) {
    emitir(lista.map((a) => (a.id === id ? { ...a, saliendo: true } : a)));
    // Respaldo: si el navegador pausa las animaciones, el aviso se quita igual.
    setTimeout(() => avisar.quitar(id), 700);
  },
  /** Quita el aviso cuando terminó de animarse la salida. */
  quitar(id: number) {
    emitir(lista.filter((a) => a.id !== id));
  },
};
