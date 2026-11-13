import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ErrorApi } from "@/lib/api";
import { crearOrden, iniciarPagoEnLinea, type OrdenPago } from "@/lib/pagos";
import { PanelPago } from "./PanelPago";

vi.mock("@/lib/pagos", async (original) => ({
  ...await original<typeof import("@/lib/pagos")>(),
  crearOrden: vi.fn(), iniciarPagoEnLinea: vi.fn(),
}));
vi.mock("@/lib/avisos", () => ({ avisar: { error: vi.fn(), exito: vi.fn() } }));
vi.mock("@/components/CargadorArchivos", () => ({ CargadorArchivos: () => null }));

const orden: OrdenPago = {
  id: "orden-1", referencia: "OP-2026-001", valor: 350000,
  estado: "PENDIENTE", medio: "CONSIGNACION", venceEn: "2026-11-20T18:00:00Z",
  tieneSoporte: false, observacionTesoreria: null, pagadoEn: null,
  cuentaRecaudo: { banco: "Banco", tipo: "Ahorros", numero: "123", titular: "SIRA", nit: "800" },
};
const props = { solicitudId: "sol-1", consecutivo: "SOL-001", esExenta: false, valorCotizado: 250000, alCambiar: vi.fn() };
const boton = () => screen.queryByRole("button", { name: "Pagar en línea (PSE, tarjeta, Nequi)" });

beforeEach(() => { vi.resetAllMocks(); vi.mocked(crearOrden).mockResolvedValue(orden); });
afterEach(cleanup);

describe("Pago en línea y consignación", () => {
  it("oculta toda la sección en solicitudes exentas, incluso con valor de referencia positivo", () => {
    const { container } = render(<PanelPago {...props} esExenta />);
    expect(container.innerHTML).toBe("");
    expect(crearOrden).not.toHaveBeenCalled();
  });

  it.each([0, null])("oculta la pasarela si el valor cotizado es %s", (valorCotizado) => {
    render(<PanelPago {...props} valorCotizado={valorCotizado} />);
    expect(boton()).toBeNull();
  });

  it("ofrece ambos medios de pago", () => {
    render(<PanelPago {...props} />);
    expect(boton()).not.toBeNull();
    expect(screen.getByRole("button", { name: "Ver datos para consignar" })).toBeDefined();
  });

  it.each(["APROBADA", "ANULADA", "VENCIDA", "EN_VERIFICACION"] as const)("oculta el botón al recuperar una orden %s", async (estado) => {
    vi.mocked(crearOrden).mockResolvedValue({ ...orden, estado });
    render(<PanelPago {...props} />);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Ver datos para consignar" })); });
    expect(boton()).toBeNull();
  });

  it("no crea checkout si el servidor devuelve una orden de valor cero", async () => {
    vi.mocked(crearOrden).mockResolvedValue({ ...orden, valor: 0 });
    render(<PanelPago {...props} />);
    await act(async () => { fireEvent.click(boton()!); });
    expect(iniciarPagoEnLinea).not.toHaveBeenCalled();
    expect(boton()).toBeNull();
    expect(screen.getByRole("alert").textContent).toContain("no está disponible");
  });

  it("usa el id de la orden y muestra el conflicto 409 sin repetir checkout", async () => {
    vi.mocked(iniciarPagoEnLinea).mockRejectedValue(new ErrorApi({ status: 409, codigo: "YA_PAGADA", mensaje: "La orden ya está pagada." }));
    render(<PanelPago {...props} />);
    await act(async () => { fireEvent.click(boton()!); });
    expect(crearOrden).toHaveBeenCalledWith("sol-1");
    expect(iniciarPagoEnLinea).toHaveBeenCalledWith("orden-1");
    expect(screen.getByRole("alert").textContent).toContain("ya está pagada");
    expect(boton()).toBeNull();
  });
});
