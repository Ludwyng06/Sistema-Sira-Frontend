/**
 * Tipos de las respuestas del inventario público (09 §4.7).
 * Alineados con los DTO del backend: src/modules/inventario/dto/respuestas.ts
 */

export type NivelAforo = "NO_CABE" | "ADECUADO" | "SOBRA_ESPACIO";

export interface EvaluacionAforo {
  nivel: NivelAforo;
  /** Fracción de ocupación (asistentes / capacidad). */
  ocupacion: number;
  mensaje: string;
}

export interface Pagina<T> {
  datos: T[];
  total: number;
  pagina: number;
  porPagina: number;
}

export interface CodigoNombre {
  codigo: string;
  nombre: string;
}

export interface Foto {
  url: string;
  alt: string;
}

export interface ElementoDotacion {
  nombre: string;
  cantidad: number;
}

/** Tarjeta de espacio: listados de bloque, búsqueda y sugerencias. */
export interface TarjetaEspacio {
  codigo: string;
  nombre: string;
  piso: number;
  capacidadPersonas: number;
  tipo: CodigoNombre;
  bloque: CodigoNombre;
  sede: CodigoNombre;
  portada: Foto | null;
  /** Hasta 4 elementos en servicio. */
  dotacion: ElementoDotacion[];
  /** Menor tarifa externa vigente, en pesos enteros; nunca la interna. */
  tarifaDesde: number | null;
  /** Solo si la consulta incluye `asistentes`. */
  aforo?: EvaluacionAforo;
}

export interface ConteoPorTipo {
  tipo: string;
  nombre: string;
  total: number;
}

export interface SedeResumen {
  codigo: string;
  nombre: string;
  municipio: string;
  direccion: string | null;
  totalBloques: number;
  totalEspacios: number;
}

/** Bloque dentro de la lista de una sede (GET /sedes/:sede/bloques). */
export interface BloqueResumen {
  codigo: string;
  nombre: string;
  descripcion: string | null;
  numeroPisos: number;
  planoUrl: string | null;
  foto: Foto | null;
  totalEspacios: number;
  capacidadMaxima: number;
  conteoPorTipo: ConteoPorTipo[];
}

export interface PisoBloque {
  piso: number;
  espacios: TarjetaEspacio[];
}

/** Detalle de un bloque: plano y espacios agrupados por piso. */
export interface DetalleBloque {
  codigo: string;
  nombre: string;
  descripcion: string | null;
  sede: CodigoNombre;
  numeroPisos: number;
  planoUrl: string | null;
  tipos: ConteoPorTipo[];
  pisos: PisoBloque[];
}

export interface TipoEspacio {
  codigo: string;
  nombre: string;
  anticipacionMinimaDias: number;
  anticipacionEnHabiles: boolean;
  aforoExigePoliza: number | null;
  icono: string | null;
}

export interface FotoDetalle {
  urlDetalle: string;
  urlTarjeta: string;
  urlMiniatura: string;
  alt: string;
  esPortada: boolean;
}

export interface ElementoFicha {
  nombre: string;
  cantidad: number;
  unidad: string;
}

export interface TarifaPublica {
  tipoSolicitante: string;
  unidad: string | null;
  /** Pesos enteros. */
  valor: number;
  ivaAplica: boolean;
}

export interface Horario {
  /** 0 = domingo. */
  diaSemana: number;
  abre: string;
  cierra: string;
}

/** Ficha completa de un espacio (GET /espacios/:codigo). */
export interface FichaEspacio extends TarjetaEspacio {
  descripcion: string | null;
  condicionesUso: string | null;
  areaM2: number | null;
  minutosMontaje: number;
  minutosDesmontaje: number;
  depositoValorFijo: number | null;
  depositoPorcentaje: number | null;
  fotos: FotoDetalle[];
  /** Dotación completa en servicio. */
  elementos: ElementoFicha[];
  /** Tarifas externas vigentes. */
  tarifas: TarifaPublica[];
  horarios: Horario[];
  reglasTipo: TipoEspacio;
}
