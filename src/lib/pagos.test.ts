import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";
import { obtenerInstruccionesPago } from "./pagos";

vi.mock("./api", () => ({ api: vi.fn() }));
beforeEach(() => vi.clearAllMocks());

describe("Instrucciones de pago", () => {
  it("consulta por GET la ruta de instrucciones usando el cliente autenticado", async () => {
    const respuesta = { ordenPagoId: "orden-1", pasarelaEnLinea: false, enlacePago: null, whatsapp: null };
    vi.mocked(api).mockResolvedValue(respuesta);
    expect(await obtenerInstruccionesPago("orden-1")).toBe(respuesta);
    expect(api).toHaveBeenCalledWith("/pagos/ordenes/orden-1/instrucciones");
  });

  it("codifica el identificador de la orden como un segmento de la ruta", async () => {
    await obtenerInstruccionesPago("orden/con espacio");
    expect(api).toHaveBeenCalledWith("/pagos/ordenes/orden%2Fcon%20espacio/instrucciones");
  });
});
