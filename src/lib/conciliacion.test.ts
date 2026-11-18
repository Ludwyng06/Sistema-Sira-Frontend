import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";
import { ayerBogota, compararExtracto, consultarConciliacion, descargarConciliacionPdf, fechaConsulta } from "./conciliacion";

vi.mock("./api", () => ({ api: vi.fn() }));
beforeEach(() => vi.clearAllMocks());

describe("Contrato de conciliación", () => {
  it("usa las tres rutas y envía multipart con campo archivo sin Content-Type manual", async () => {
    await consultarConciliacion("2026-11-12");
    expect(api).toHaveBeenLastCalledWith("/pagos/conciliacion", { query: { fecha: "2026-11-12" } });
    const archivo = new File(["referencia,valor,fecha"], "extracto.csv", { type: "text/csv" });
    await compararExtracto("2026-11-12", archivo);
    const [ruta, opciones] = vi.mocked(api).mock.calls[1];
    expect(ruta).toBe("/pagos/conciliacion/extracto");
    expect(opciones?.query).toEqual({ fecha: "2026-11-12" });
    expect(opciones?.method).toBe("POST");
    expect(opciones?.formData?.get("archivo")).toBe(archivo);
    expect(opciones?.headers).toBeUndefined();
    await descargarConciliacionPdf("2026-11-12");
    expect(api).toHaveBeenLastCalledWith("/pagos/conciliacion/pdf", { query: { fecha: "2026-11-12" }, blob: true });
  });

  it("calcula ayer calendario en Bogotá en cambios de mes y año", () => {
    expect(ayerBogota(new Date("2026-01-01T04:30:00Z"))).toBe("2025-12-30");
    expect(ayerBogota(new Date("2026-01-01T05:30:00Z"))).toBe("2025-12-31");
    expect(ayerBogota(new Date("2024-03-01T14:00:00Z"))).toBe("2024-02-29");
  });

  it("acepta fechas reales dd/mm/aaaa y rechaza fechas normalizadas por JavaScript", () => {
    expect(fechaConsulta("29/02/2024")).toBe("2024-02-29");
    for (const texto of ["29/02/2026", "31/04/2026", "00/01/2026", "01/13/2026", "2026-11-12", "1/1/2026", ""]) {
      expect(fechaConsulta(texto)).toBeNull();
    }
  });
});
