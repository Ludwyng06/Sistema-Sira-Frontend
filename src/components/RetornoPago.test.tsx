import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { consultarEstadoPago, type EstadoPagoEnLinea } from "@/lib/pagos";
import { RetornoPago } from "./RetornoPago";

vi.mock("@/lib/pagos", () => ({ consultarEstadoPago: vi.fn() }));
const respuesta = (estado: EstadoPagoEnLinea["estado"]): EstadoPagoEnLinea => ({ estado, referencia: "OP-001", valor: 1250000 });

beforeEach(() => { vi.useFakeTimers(); vi.resetAllMocks(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });
const avanzar = async (ms: number) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };
const abrir = async () => { await act(async () => { render(<RetornoPago ordenId="orden-1" />); }); };

describe("Confirmación por el servidor (RN-12)", () => {
  it.each(["APROBADA", "PAGADA", "RECHAZADA", "ANULADA", "ERROR"] as const)("consulta cada 5 segundos y termina en %s", async (estado) => {
    vi.mocked(consultarEstadoPago).mockResolvedValueOnce(respuesta("PENDIENTE")).mockResolvedValue(respuesta(estado));
    await abrir();
    expect(screen.getByRole("status").textContent).toContain("Estamos confirmando tu pago");
    expect(document.activeElement).toBe(screen.getByRole("heading", { level: 1 }));
    await avanzar(4999);
    expect(consultarEstadoPago).toHaveBeenCalledTimes(1);
    await avanzar(1);
    const mensajes = { APROBADA: "Pago aprobado", PAGADA: "Pago aprobado", RECHAZADA: "Pago rechazado", ANULADA: "Pago anulado", ERROR: "El pago no pudo completarse" };
    expect(screen.getByRole("status").textContent).toContain(mensajes[estado]);
    expect(screen.getByText("$1.250.000")).toBeDefined();
    await avanzar(120000);
    expect(consultarEstadoPago).toHaveBeenCalledTimes(2);
  });

  it("termina a los 2 minutos con mensaje PSE pendiente y permite consultar de nuevo", async () => {
    vi.mocked(consultarEstadoPago).mockResolvedValue(respuesta("PENDIENTE"));
    await abrir();
    await avanzar(120000);
    expect(screen.getByRole("status").textContent).toContain("Pago pendiente de confirmación");
    expect(screen.getByRole("status").textContent).toContain("Te notificaremos");
    const consultas = vi.mocked(consultarEstadoPago).mock.calls.length;
    await avanzar(15000);
    expect(consultarEstadoPago).toHaveBeenCalledTimes(consultas);
    vi.mocked(consultarEstadoPago).mockResolvedValue(respuesta("APROBADA"));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Volver a consultar el estado" })); });
    expect(screen.getByRole("status").textContent).toContain("Pago aprobado");
  });

  it("ignora parámetros manipulados de Wompi y muestra solo el estado del servidor", async () => {
    window.history.replaceState({}, "", "/pagos/retorno?orden=orden-1&status=APPROVED&id=falso&valor=1");
    vi.mocked(consultarEstadoPago).mockResolvedValue(respuesta("RECHAZADA"));
    await abrir();
    expect(consultarEstadoPago).toHaveBeenCalledWith("orden-1", expect.any(AbortSignal));
    expect(screen.getByRole("status").textContent).toContain("Pago rechazado");
    expect(screen.getByText("$1.250.000")).toBeDefined();
  });

  it("no consulta si falta la orden", () => {
    render(<RetornoPago ordenId={null} />);
    expect(consultarEstadoPago).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toContain("Falta el identificador");
  });

  it("reintenta errores de conexión sin declarar el pago aprobado", async () => {
    vi.mocked(consultarEstadoPago).mockRejectedValueOnce(new Error("sin red")).mockResolvedValue(respuesta("APROBADA"));
    await abrir();
    expect(screen.getByRole("alert")).toBeDefined();
    await avanzar(5000);
    expect(screen.getByRole("status").textContent).toContain("Pago aprobado");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("cancela la petición y los temporizadores al desmontar", async () => {
    vi.mocked(consultarEstadoPago).mockResolvedValue(respuesta("PENDIENTE"));
    await abrir();
    const signal = vi.mocked(consultarEstadoPago).mock.calls[0][1]!;
    cleanup();
    expect(signal.aborted).toBe(true);
    await avanzar(120000);
    expect(consultarEstadoPago).toHaveBeenCalledTimes(1);
  });
});
