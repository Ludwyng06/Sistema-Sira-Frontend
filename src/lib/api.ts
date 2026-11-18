/**
 * Cliente único de la API de SIRA. Todo fetch pasa por aquí.
 * - Servidor: usa API_URL_INTERNA. Cliente: NEXT_PUBLIC_API_URL.
 * - Cabecera Authorization si hay token (en memoria, solo cliente).
 * - Ante 401 intenta refrescar la sesión una vez (cookie httpOnly) y reintenta.
 * - Traduce { codigo, mensaje, detalles?, correlacionId } a ErrorApi.
 */

export class ErrorApi extends Error {
  readonly codigo: string;
  readonly status: number;
  readonly detalles?: unknown;
  readonly correlacionId?: string;

  constructor(opts: {
    codigo: string;
    mensaje: string;
    status: number;
    detalles?: unknown;
    correlacionId?: string;
  }) {
    super(opts.mensaje);
    this.name = "ErrorApi";
    this.codigo = opts.codigo;
    this.status = opts.status;
    this.detalles = opts.detalles;
    this.correlacionId = opts.correlacionId;
  }
}

const URL_SERVIDOR = process.env.API_URL_INTERNA ?? "http://localhost:3001/api";
const URL_CLIENTE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

function urlBase(): string {
  return typeof window === "undefined" ? URL_SERVIDOR : URL_CLIENTE;
}

/** Si la API no responde en este tiempo se muestra el estado de error. */
const TIEMPO_MAXIMO_MS = 10_000;

let tokenAcceso: string | null = null;

/** El access token vive solo en memoria del cliente. */
export function fijarToken(token: string | null): void {
  tokenAcceso = token;
}

export type OpcionesApi = Omit<RequestInit, "body"> & {
  /** Parámetros de query; se omiten los undefined/null/''. */
  query?: Record<string, string | number | boolean | null | undefined>;
  /** Cuerpo JSON. */
  json?: unknown;
  /** Cuerpo multipart (subida de archivos). El navegador fija el Content-Type. */
  formData?: FormData;
  /** Devuelve el cuerpo como Blob (descarga de PDF o comprobantes). */
  blob?: boolean;
};

function construirUrl(ruta: string, query?: OpcionesApi["query"]): string {
  const url = `${urlBase()}${ruta.startsWith("/") ? ruta : `/${ruta}`}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [clave, valor] of Object.entries(query)) {
    if (valor === undefined || valor === null || valor === "") continue;
    params.set(clave, String(valor));
  }
  const texto = params.toString();
  return texto ? `${url}?${texto}` : url;
}

let refrescoEnCurso: Promise<boolean> | null = null;

/**
 * Renueva el access token con la cookie httpOnly. Las llamadas simultáneas
 * comparten una sola petición: la API rota el token de refresco y el segundo
 * intento con el token ya revocado cerraría la sesión.
 */
export function restaurarSesion(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  refrescoEnCurso ??= (async () => {
    try {
      const res = await fetch(construirUrl("/auth/refrescar"), {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) return false;
      const cuerpo = (await res.json()) as { accessToken?: string };
      if (!cuerpo.accessToken) return false;
      tokenAcceso = cuerpo.accessToken;
      return true;
    } catch {
      return false;
    } finally {
      refrescoEnCurso = null;
    }
  })();
  return refrescoEnCurso;
}

async function aErrorApi(res: Response): Promise<ErrorApi> {
  let cuerpo: Partial<{
    codigo: string;
    mensaje: string;
    detalles: unknown;
    correlacionId: string;
  }> = {};
  try {
    cuerpo = await res.json();
  } catch {
    // respuesta sin JSON
  }
  return new ErrorApi({
    codigo: cuerpo.codigo ?? "ERROR_DESCONOCIDO",
    mensaje: cuerpo.mensaje ?? "Ocurrió un error inesperado. Intenta de nuevo.",
    status: res.status,
    detalles: cuerpo.detalles,
    correlacionId: cuerpo.correlacionId,
  });
}

export async function api<T>(ruta: string, opciones: OpcionesApi = {}): Promise<T> {
  const { query, json, formData, blob, headers, ...resto } = opciones;

  const ejecutar = () => {
    const cabeceras = new Headers(headers);
    cabeceras.set("Accept", "application/json");
    if (json !== undefined) cabeceras.set("Content-Type", "application/json");
    if (tokenAcceso) cabeceras.set("Authorization", `Bearer ${tokenAcceso}`);
    return fetch(construirUrl(ruta, query), {
      cache: "no-store",
      signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS),
      ...resto,
      headers: cabeceras,
      credentials: typeof window === "undefined" ? undefined : "include",
      body: formData ?? (json !== undefined ? JSON.stringify(json) : undefined),
    });
  };

  let res: Response;
  try {
    res = await ejecutar();
    if (res.status === 401 && (await restaurarSesion())) {
      res = await ejecutar();
    }
  } catch {
    throw new ErrorApi({
      codigo: "API_NO_DISPONIBLE",
      mensaje:
        "No pudimos conectar con el servidor de SIRA. Revisa tu conexión e intenta de nuevo en unos minutos.",
      status: 0,
    });
  }

  if (!res.ok) throw await aErrorApi(res);
  if (res.status === 204) return undefined as T;
  if (blob) return (await res.blob()) as T;
  return (await res.json()) as T;
}
