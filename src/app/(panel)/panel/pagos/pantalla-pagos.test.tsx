import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { PantallaPagos, obtenerEtiquetaTipoOrden } from "./pantalla-pagos";
import { descargarSoporte, listarOrdenes, type PaginaOrdenes } from "@/lib/pagos";

const sesion = vi.hoisted(() => ({ rol: "TESORERIA" }));
vi.mock("@/components/SesionProvider", () => ({
  useSesion: () => ({
    estado: "autenticado",
    esPersonal: true,
    tieneRol: (...roles: string[]) => roles.includes(sesion.rol),
  }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/panel/pagos",
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/lib/pagos", async (original) => ({
  ...(await original<typeof import("@/lib/pagos")>()),
  listarOrdenes: vi.fn(),
  descargarSoporte: vi.fn(),
  verificarPago: vi.fn(),
}));

vi.mock("@/lib/avisos", () => ({
  avisar: { error: vi.fn(), exito: vi.fn() },
}));

vi.mock("@/lib/descarga", () => ({
  guardarArchivo: vi.fn(),
}));

// Mock de URL.createObjectURL y revokeObjectURL para jsdom
if (typeof URL.createObjectURL === "undefined") {
  URL.createObjectURL = vi.fn(() => "blob:mock-url");
}
if (typeof URL.revokeObjectURL === "undefined") {
  URL.revokeObjectURL = vi.fn();
}

describe("PantallaPagos - Visualización del tipo de orden", () => {
  const ordenesMock: PaginaOrdenes = {
    total: 3,
    pagina: 1,
    porPagina: 20,
    datos: [
      {
        id: "orden-1",
        referencia: "OP-2026-000001",
        solicitudId: "sol-1",
        consecutivoSolicitud: "SOL-2026-0001",
        valor: 500000,
        estado: "EN_VERIFICACION",
        tieneSoporte: true,
        venceEn: "2026-12-01T15:00:00.000Z",
        pagadoEn: "2026-11-18T10:00:00.000Z",
        // Tipo devuelto por el backend
        ...({ tipo: "TOTAL" } as unknown as object),
      },
      {
        id: "orden-2",
        referencia: "OP-2026-000002",
        solicitudId: "sol-2",
        consecutivoSolicitud: "SOL-2026-0002",
        valor: 200000,
        estado: "EN_VERIFICACION",
        tieneSoporte: true,
        venceEn: "2026-12-01T15:00:00.000Z",
        pagadoEn: null,
        ...({ tipo: "ANTICIPO" } as unknown as object),
      },
      {
        id: "orden-3",
        referencia: "OP-2026-000003",
        solicitudId: "sol-3",
        consecutivoSolicitud: "SOL-2026-0003",
        valor: 300000,
        estado: "EN_VERIFICACION",
        tieneSoporte: false,
        venceEn: "2026-12-01T15:00:00.000Z",
        pagadoEn: null,
        ...({ tipo: "SALDO" } as unknown as object),
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    sesion.rol = "TESORERIA";
    vi.mocked(listarOrdenes).mockResolvedValue(structuredClone(ordenesMock));
  });

  afterEach(cleanup);

  it("función obtenerEtiquetaTipoOrden mapea correctamente TOTAL, ANTICIPO y SALDO", () => {
    expect(obtenerEtiquetaTipoOrden("TOTAL")).toBe("Total");
    expect(obtenerEtiquetaTipoOrden("ANTICIPO")).toBe("Anticipo");
    expect(obtenerEtiquetaTipoOrden("SALDO")).toBe("Saldo");
    expect(obtenerEtiquetaTipoOrden("total")).toBe("Total");
    expect(obtenerEtiquetaTipoOrden("anticipo")).toBe("Anticipo");
    expect(obtenerEtiquetaTipoOrden("saldo")).toBe("Saldo");
    expect(obtenerEtiquetaTipoOrden(null)).toBe("");
    expect(obtenerEtiquetaTipoOrden(undefined)).toBe("");
  });

  it("muestra el tipo de orden (Total, Anticipo, Saldo) en la lista de órdenes", async () => {
    render(<PantallaPagos />);

    // Esperar a que carguen los resultados usando matcher por función
    await screen.findByText((_, element) => {
      return element?.tagName.toLowerCase() === "p" && Boolean(element.textContent?.includes("OP-2026-000001"));
    });

    const items = screen.getAllByRole("listitem");
    const item1 = items.find((li) => li.textContent?.includes("OP-2026-000001"));
    expect(item1).toBeDefined();
    if (item1) {
      expect(within(item1).getAllByText("Total").length).toBeGreaterThan(0);
    }

    const item2 = items.find((li) => li.textContent?.includes("OP-2026-000002"));
    expect(item2).toBeDefined();
    if (item2) {
      expect(within(item2).getAllByText("Anticipo").length).toBeGreaterThan(0);
    }

    const item3 = items.find((li) => li.textContent?.includes("OP-2026-000003"));
    expect(item3).toBeDefined();
    if (item3) {
      expect(within(item3).getAllByText("Saldo").length).toBeGreaterThan(0);
    }
  });

  it("muestra el tipo de orden en el detalle al abrir el comprobante", async () => {
    const blobSoporte = new Blob(["soporte-test"], { type: "image/png" });
    vi.mocked(descargarSoporte).mockResolvedValue(blobSoporte);

    render(<PantallaPagos />);

    await screen.findByText((_, element) => {
      return element?.tagName.toLowerCase() === "p" && Boolean(element.textContent?.includes("OP-2026-000001"));
    });

    const items = screen.getAllByRole("listitem");
    const item1 = items.find((li) => li.textContent?.includes("OP-2026-000001"));
    expect(item1).toBeDefined();

    const botonVer = within(item1!).getByRole("button", { name: /Ver comprobante junto a la orden/i });

    // Clic en ver comprobante de la primera orden (tipo TOTAL)
    await act(async () => {
      fireEvent.click(botonVer);
    });

    expect(descargarSoporte).toHaveBeenCalledWith("orden-1");

    // En el detalle <dl>, debe aparecer el término "Tipo de orden" y su definición "Total"
    const terminoTipo = await screen.findByText("Tipo de orden");
    expect(terminoTipo).toBeDefined();

    const dl = terminoTipo.closest("dl");
    expect(dl).not.toBeNull();
    if (dl) {
      expect(within(dl).getByText("Total")).toBeDefined();
      expect(within(dl).getByText("OP-2026-000001")).toBeDefined();
      expect(within(dl).getByText(/\$\s?500\.000/)).toBeDefined();
    }
  });
});
