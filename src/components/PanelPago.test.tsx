import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { ErrorApi } from "@/lib/api";
import { crearOrden, iniciarPagoEnLinea, obtenerInstruccionesPago, subirSoporte, type InstruccionesPago, type OrdenPago } from "@/lib/pagos";
import { pesos } from "@/lib/formato";
import { PanelPago } from "./PanelPago";

vi.mock("@/lib/pagos", async (original) => ({
  ...await original<typeof import("@/lib/pagos")>(),
  crearOrden: vi.fn(), iniciarPagoEnLinea: vi.fn(), obtenerInstruccionesPago: vi.fn(), subirSoporte: vi.fn(),
}));
vi.mock("@/lib/avisos", () => ({ avisar: { error: vi.fn(), errorManual: vi.fn(), exito: vi.fn() } }));

const orden: OrdenPago = {
  id: "orden-1", referencia: "OP-2026-001", valor: 350000,
  estado: "PENDIENTE", medio: "CONSIGNACION", venceEn: "2026-11-20T18:00:00Z",
  tieneSoporte: false, observacionTesoreria: null, pagadoEn: null,
  cuentaRecaudo: { banco: "Banco", tipo: "Ahorros", numero: "123", titular: "SIRA", nit: "800" },
};
const instrucciones: InstruccionesPago = {
  ordenPagoId: orden.id, referencia: orden.referencia, valor: orden.valor,
  tipo: "TOTAL", estado: "PENDIENTE", venceEn: orden.venceEn,
  enlacePago: "https://recaudos.universidad.edu.co/pagar",
  instrucciones: "Indica la referencia en el portal de recaudo.", pasarelaEnLinea: false,
  whatsapp: { numero: "573001234567", url: "https://wa.me/573001234567?text=Ya%20cargu%C3%A9%20el%20comprobante" },
};
const props = { solicitudId: "sol-1", consecutivo: "SOL-001", esExenta: false, valorCotizado: 250000, alCambiar: vi.fn() };
const botonCheckout = () => screen.queryByRole("button", { name: "Pagar en línea (PSE, tarjeta, Nequi)" });
const enlacePago = () => screen.queryByRole("link", { name: /Ir al enlace de pago/ });
const whatsapp = () => screen.queryByRole("link", { name: /Avisar al área por WhatsApp/ });
const cargador = () => screen.queryByLabelText(/Subir comprobante de SOL-001/);

async function abrirTarjeta() {
  render(<PanelPago {...props} />);
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Ver instrucciones de pago" })); });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(crearOrden).mockResolvedValue(orden);
  vi.mocked(obtenerInstruccionesPago).mockResolvedValue(instrucciones);
  vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: vi.fn(() => "blob:comprobante"), revokeObjectURL: vi.fn() }));
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: vi.fn().mockResolvedValue(undefined) } });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("Pagar tu orden por enlace", () => {
  it("oculta la tarjeta y no llama a la API en solicitudes exentas", () => {
    const { container } = render(<PanelPago {...props} esExenta />);
    expect(container.innerHTML).toBe("");
    expect(crearOrden).not.toHaveBeenCalled();
    expect(obtenerInstruccionesPago).not.toHaveBeenCalled();
  });

  it("consulta las instrucciones de la orden y presenta los tres pasos con los datos del servidor", async () => {
    vi.mocked(obtenerInstruccionesPago).mockResolvedValue({ ...instrucciones, referencia: "OP-REFERENCIA-SERVIDOR", valor: 1234567 });
    await abrirTarjeta();
    expect(crearOrden).toHaveBeenCalledWith("sol-1");
    expect(obtenerInstruccionesPago).toHaveBeenCalledWith("orden-1");
    expect(screen.getByRole("heading", { name: "Pagar tu orden" })).toBeDefined();
    const pasos = within(screen.getByRole("list", { name: "Pasos para pagar tu orden" }));
    expect(pasos.getAllByRole("listitem")).toHaveLength(3);
    expect(pasos.getByRole("heading", { name: "1. Realiza el pago" })).toBeDefined();
    expect(pasos.getByRole("heading", { name: "2. Carga el comprobante" })).toBeDefined();
    expect(pasos.getByRole("heading", { name: "3. Avisa al área" })).toBeDefined();
    expect(screen.getByText("OP-REFERENCIA-SERVIDOR")).toBeDefined();
    expect(screen.getByText(pesos(1234567))).toBeDefined();
    expect(screen.getByText(instrucciones.instrucciones!)).toBeDefined();
    expect(screen.getByText(/hasta el/).getAttribute("datetime")).toBe(orden.venceEn);
  });

  it.each([["TOTAL", "Pago total"], ["ANTICIPO", "Anticipo"], ["SALDO", "Saldo"]] as const)("muestra el tipo %s", async (tipo, etiqueta) => {
    vi.mocked(obtenerInstruccionesPago).mockResolvedValue({ ...instrucciones, tipo });
    await abrirTarjeta();
    expect(screen.getByText(etiqueta)).toBeDefined();
  });

  it("copia la referencia y anuncia el resultado", async () => {
    await abrirTarjeta();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Copiar referencia" })); });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(orden.referencia);
    expect(screen.getByRole("status").textContent).toBe("Referencia copiada");
  });

  it("permite copiar manualmente si el portapapeles falla y enfoca el error", async () => {
    vi.mocked(navigator.clipboard.writeText).mockRejectedValue(new Error("Sin permiso"));
    await abrirTarjeta();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Copiar referencia" })); });
    expect(screen.getByRole("alert").textContent).toContain("copiarla manualmente");
    expect(document.activeElement).toBe(screen.getByRole("alert").parentElement);
  });

  it("abre el enlace de pago configurado en una pestaña nueva segura", async () => {
    await abrirTarjeta();
    expect(enlacePago()?.getAttribute("href")).toBe(instrucciones.enlacePago);
    expect(enlacePago()?.getAttribute("target")).toBe("_blank");
    expect(enlacePago()?.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("muestra el aviso sin enlace de pago y conserva el cargue del comprobante", async () => {
    vi.mocked(obtenerInstruccionesPago).mockResolvedValue({ ...instrucciones, enlacePago: null, instrucciones: null });
    await abrirTarjeta();
    expect(enlacePago()).toBeNull();
    expect(screen.getByText("La universidad aún no publica el enlace de pago")).toBeDefined();
    expect(cargador()).not.toBeNull();
  });

  it("usa la URL prellenada de WhatsApp devuelta por el servidor", async () => {
    await abrirTarjeta();
    expect(whatsapp()?.getAttribute("href")).toBe(instrucciones.whatsapp!.url);
    expect(whatsapp()?.getAttribute("target")).toBe("_blank");
    expect(whatsapp()?.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("oculta el contacto cuando whatsapp es null", async () => {
    vi.mocked(obtenerInstruccionesPago).mockResolvedValue({ ...instrucciones, whatsapp: null });
    await abrirTarjeta();
    expect(whatsapp()).toBeNull();
    expect(screen.queryByRole("heading", { name: "3. Avisa al área" })).toBeNull();
  });

  it.each([false, true])("solo habilita checkout con pasarelaEnLinea=%s según el servidor", async (pasarelaEnLinea) => {
    vi.mocked(obtenerInstruccionesPago).mockResolvedValue({ ...instrucciones, pasarelaEnLinea });
    render(<PanelPago {...props} />);
    expect(botonCheckout()).toBeNull();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Ver instrucciones de pago" })); });
    expect(Boolean(botonCheckout())).toBe(pasarelaEnLinea);
    expect(iniciarPagoEnLinea).not.toHaveBeenCalled();
  });

  it.each([0, null])("oculta checkout con valor cotizado %s aunque haya pasarela", async (valorCotizado) => {
    vi.mocked(obtenerInstruccionesPago).mockResolvedValue({ ...instrucciones, pasarelaEnLinea: true });
    render(<PanelPago {...props} valorCotizado={valorCotizado} />);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Ver instrucciones de pago" })); });
    expect(botonCheckout()).toBeNull();
  });

  it.each(["PENDIENTE", "RECHAZADA"] as const)("permite adjuntar comprobantes en %s", async (estado) => {
    vi.mocked(crearOrden).mockResolvedValue({ ...orden, estado, observacionTesoreria: estado === "RECHAZADA" ? "El valor no coincide." : null });
    vi.mocked(obtenerInstruccionesPago).mockResolvedValue({ ...instrucciones, estado });
    await abrirTarjeta();
    expect(cargador()).not.toBeNull();
    if (estado === "RECHAZADA") expect(screen.getByText("El valor no coincide.")).toBeDefined();
  });

  it("en verificación anuncia la revisión y conserva WhatsApp sin ofrecer otro cargue ni checkout", async () => {
    vi.mocked(crearOrden).mockResolvedValue({ ...orden, estado: "EN_VERIFICACION", tieneSoporte: true });
    vi.mocked(obtenerInstruccionesPago).mockResolvedValue({ ...instrucciones, estado: "EN_VERIFICACION", pasarelaEnLinea: true });
    await abrirTarjeta();
    expect(screen.getByText("Comprobante en revisión por tesorería")).toBeDefined();
    expect(cargador()).toBeNull();
    expect(botonCheckout()).toBeNull();
    expect(whatsapp()).not.toBeNull();
  });

  it("reutiliza el cargador, confirma el envío y pasa a revisión conservando WhatsApp", async () => {
    vi.mocked(subirSoporte).mockResolvedValue({ ...orden, estado: "EN_VERIFICACION", tieneSoporte: true });
    await abrirTarjeta();
    const archivo = new File(["comprobante"], "comprobante.pdf", { type: "application/pdf" });
    await act(async () => { fireEvent.change(cargador()!, { target: { files: [archivo] } }); });
    expect(screen.getByTitle("Vista previa de comprobante.pdf")).toBeDefined();
    expect(subirSoporte).not.toHaveBeenCalled();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Enviar comprobante" })); });
    expect(subirSoporte).toHaveBeenCalledWith("orden-1", archivo);
    expect(props.alCambiar).toHaveBeenCalledOnce();
    expect(screen.getByText("Comprobante en revisión por tesorería")).toBeDefined();
    expect(cargador()).toBeNull();
    expect(whatsapp()).not.toBeNull();
  });

  it.each(["APROBADA", "ANULADA", "VENCIDA"] as const)("no solicita instrucciones ni ofrece checkout para una orden %s", async (estado) => {
    vi.mocked(crearOrden).mockResolvedValue({ ...orden, estado });
    await abrirTarjeta();
    expect(obtenerInstruccionesPago).not.toHaveBeenCalled();
    expect(botonCheckout()).toBeNull();
    expect(cargador()).toBeNull();
  });

  it("no ofrece checkout con una orden de valor cero", async () => {
    vi.mocked(crearOrden).mockResolvedValue({ ...orden, valor: 0 });
    vi.mocked(obtenerInstruccionesPago).mockResolvedValue({ ...instrucciones, valor: 0, pasarelaEnLinea: true });
    await abrirTarjeta();
    expect(botonCheckout()).toBeNull();
    expect(iniciarPagoEnLinea).not.toHaveBeenCalled();
  });

  it.each([403, 404, 409])("muestra el error %s de instrucciones sin activar el checkout", async (status) => {
    vi.mocked(obtenerInstruccionesPago).mockRejectedValue(new ErrorApi({ status, codigo: "NO_DISPONIBLE", mensaje: "No se pueden consultar las instrucciones." }));
    await abrirTarjeta();
    expect(screen.getByRole("alert").textContent).toContain("No se pueden consultar las instrucciones.");
    expect(botonCheckout()).toBeNull();
    expect(enlacePago()).toBeNull();
    expect(screen.getByRole("button", { name: "Ver instrucciones de pago" })).toBeDefined();
  });

  it("permite reintentar la carga de instrucciones tras un fallo de red", async () => {
    vi.mocked(obtenerInstruccionesPago).mockRejectedValueOnce(new Error("Red"));
    await abrirTarjeta();
    expect(screen.getByRole("alert").textContent).toContain("No pudimos cargar");
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Ver instrucciones de pago" })); });
    expect(enlacePago()).not.toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("usa el id de la orden y muestra el conflicto 409 sin repetir checkout", async () => {
    vi.mocked(obtenerInstruccionesPago).mockResolvedValue({ ...instrucciones, pasarelaEnLinea: true });
    vi.mocked(iniciarPagoEnLinea).mockRejectedValue(new ErrorApi({ status: 409, codigo: "YA_PAGADA", mensaje: "La orden ya está pagada." }));
    await abrirTarjeta();
    await act(async () => { fireEvent.click(botonCheckout()!); });
    expect(iniciarPagoEnLinea).toHaveBeenCalledWith("orden-1");
    expect(iniciarPagoEnLinea).toHaveBeenCalledOnce();
    expect(screen.getByRole("alert").textContent).toContain("ya está pagada");
    expect(botonCheckout()).toBeNull();
  });
});
