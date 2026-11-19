import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import nextConfig from "../../next.config";

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_API_URL", "/api");
  vi.stubEnv("API_URL_INTERNA", "https://backend.example.run.app/api");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("construirUrl", () => {
  it.each(["/auth/refrescar", "auth/refrescar"])(
    "mantiene la base relativa /api con la ruta %s",
    async (ruta) => {
      const { construirUrl } = await import("./api");
      expect(construirUrl(ruta)).toBe("/api/auth/refrescar");
    },
  );

  it("codifica filtros y conserva cero y false, omitiendo valores vacíos", async () => {
    const { construirUrl } = await import("./api");
    expect(construirUrl("/reportes/recaudo.pdf", {
      buscar: "café & té", pagina: 0, activo: false,
      desde: undefined, hasta: null, vacio: "",
    })).toBe("/api/reportes/recaudo.pdf?buscar=caf%C3%A9+%26+t%C3%A9&pagina=0&activo=false");
    expect(construirUrl("/reportes/recaudo.pdf", { desde: undefined }))
      .toBe("/api/reportes/recaudo.pdf");
  });

  it("tolera una barra final en la base relativa", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "/api/");
    const { construirUrl } = await import("./api");
    expect(construirUrl("/auth/yo")).toBe("/api/auth/yo");
  });

  it("conserva el valor local si NEXT_PUBLIC_API_URL no está definida", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", undefined);
    const { construirUrl } = await import("./api");
    expect(construirUrl("/auth/yo")).toBe("http://localhost:3001/api/auth/yo");
  });

  it("usa API_URL_INTERNA en el servidor aunque el cliente use /api", async () => {
    vi.stubGlobal("window", undefined);
    const { construirUrl } = await import("./api");
    expect(construirUrl("/auth/yo")).toBe("https://backend.example.run.app/api/auth/yo");
  });
});

describe("peticiones a través del proxy /api", () => {
  it("descarga un Blob con filtros y credenciales", async () => {
    const archivo = new Blob(["contenido"], { type: "application/pdf" });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, status: 200, blob: vi.fn().mockResolvedValue(archivo),
    });
    vi.stubGlobal("fetch", fetchMock);
    const { api } = await import("./api");
    expect(await api<Blob>("/reportes/recaudo.pdf", {
      blob: true, query: { desde: "2026-11-01" },
    })).toBe(archivo);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/reportes/recaudo.pdf?desde=2026-11-01",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("sube multipart sin fijar Content-Type para conservar el boundary del navegador", async () => {
    const formulario = new FormData();
    formulario.set("archivo", new File(["soporte"], "soporte.pdf"));
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal("fetch", fetchMock);
    const { api } = await import("./api");
    await api("/pagos/ordenes/orden-1/soporte", { method: "POST", formData: formulario });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/pagos/ordenes/orden-1/soporte",
      expect.objectContaining({ method: "POST", body: formulario, credentials: "include" }),
    );
    const opciones = fetchMock.mock.calls[0][1] as RequestInit;
    expect(new Headers(opciones.headers).has("Content-Type")).toBe(false);
  });

  it("refresca con cookie y reintenta la petición con el nuevo token tras un 401", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 401 })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ accessToken: "nuevo-token" }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ id: "usuario-1" }) });
    vi.stubGlobal("fetch", fetchMock);
    const { api } = await import("./api");
    expect(await api("/auth/yo")).toEqual({ id: "usuario-1" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/auth/refrescar", {
      method: "POST", credentials: "include",
    });
    expect(fetchMock).toHaveBeenNthCalledWith(3, "/api/auth/yo",
      expect.objectContaining({ credentials: "include" }));
    const opciones = fetchMock.mock.calls[2][1] as RequestInit;
    expect(new Headers(opciones.headers).get("Authorization")).toBe("Bearer nuevo-token");
  });
});

describe("rewrites del backend", () => {
  it.each([undefined, ""])("no configura proxy con BACKEND_URL=%s", async (backend) => {
    vi.stubEnv("BACKEND_URL", backend);
    expect(await nextConfig.rewrites!()).toEqual([]);
  });

  it.each(["https://backend.example.run.app", "https://backend.example.run.app/"])(
    "envía /api/:path* al backend %s sin duplicar barras",
    async (backend) => {
      vi.stubEnv("BACKEND_URL", backend);
      expect(await nextConfig.rewrites!()).toEqual([{
        source: "/api/:path*",
        destination: "https://backend.example.run.app/api/:path*",
      }]);
    },
  );
});
