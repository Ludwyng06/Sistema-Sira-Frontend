import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { compararExtracto, consultarConciliacion, descargarConciliacionPdf, type InformeConciliacion } from "@/lib/conciliacion";
import { guardarArchivo } from "@/lib/descarga";
import { MenuPanel } from "@/components/MenuPanel";
import Conciliacion from "./page";

const sesion = vi.hoisted(() => ({ rol: "TESORERIA" }));
vi.mock("@/components/SesionProvider", () => ({ useSesion: () => ({ estado: "autenticado", esPersonal: true,
  tieneRol: (...roles: string[]) => roles.includes(sesion.rol) }) }));
vi.mock("next/navigation", () => ({ usePathname: () => "/panel/conciliacion", useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/lib/conciliacion", async (original) => ({
  ...await original<typeof import("@/lib/conciliacion")>(),
  consultarConciliacion: vi.fn(), compararExtracto: vi.fn(), descargarConciliacionPdf: vi.fn(),
}));
vi.mock("@/lib/descarga", () => ({ guardarArchivo: vi.fn() }));
vi.mock("@/lib/avisos", () => ({ avisar: { error: vi.fn(), exito: vi.fn() } }));

const informe: InformeConciliacion = {
  fecha: "2026-11-12", generadoEn: "2026-11-13T05:00:00Z",
  totales: { aprobadas: { cantidad: 2, valor: 1250000 }, rechazadas: { cantidad: 1, valor: 50000 },
    pendientes: { cantidad: 1, valor: 30000 }, anuladas: { cantidad: 1, valor: 40000 } },
  porProveedor: [{ proveedor: "WOMPI", aprobadas: { cantidad: 2, valor: 1250000 }, rechazadas: { cantidad: 1, valor: 50000 }, pendientes: { cantidad: 1, valor: 30000 } }],
  filas: [{ ordenId: "orden-1", referencia: "OP-001", proveedor: "WOMPI", medio: "PASARELA", estado: "APROBADA", valor: 1250000,
    transaccionExternaId: "txn-001", pagadoEn: "2026-11-12T16:00:00Z" },
  { ordenId: "orden-2", referencia: "OP-002", proveedor: null, medio: "CONSIGNACION", estado: "PENDIENTE", valor: 30000,
    transaccionExternaId: null, pagadoEn: null }],
  diferencias: [{ referencia: "OP-001", tipo: "VALOR", valorSistema: 1250000, valorExtracto: 1200000, detalle: "El valor del extracto difiere del pago." },
    { referencia: null, tipo: "SIN_ORDEN", valorSistema: null, valorExtracto: 10000, detalle: "Movimiento sin orden asociada." }],
};

beforeEach(() => {
  vi.clearAllMocks(); sesion.rol = "TESORERIA";
  vi.mocked(consultarConciliacion).mockResolvedValue(structuredClone(informe));
});
afterEach(cleanup);

describe("Conciliación diaria de tesorería", () => {
  it("muestra los totales COP sin decimales y las diferencias del servidor con tablas accesibles", async () => {
    render(<Conciliacion />);
    await screen.findByText("Diferencias frente al extracto");
    const totales = within(screen.getByRole("region", { name: "Totales del día" }));
    expect(totales.getByText("$1.250.000")).toBeDefined();
    expect(totales.getByText("2 órdenes")).toBeDefined();
    expect(totales.getByText("anuladas")).toBeDefined();
    const diferencias = within(screen.getByRole("table", { name: /Diferencias del/ }));
    expect(diferencias.getByText("$1.200.000")).toBeDefined();
    expect(diferencias.getByText("Sin referencia")).toBeDefined();
    expect(diferencias.getByText("No disponible")).toBeDefined();
    expect(diferencias.getByText("El valor del extracto difiere del pago.")).toBeDefined();
    for (const tabla of screen.getAllByRole("table")) {
      expect(tabla.querySelector("caption")).not.toBeNull();
      for (const th of tabla.querySelectorAll("th")) expect(th.getAttribute("scope")).toMatch(/col|row/);
    }
  });

  it("aplica conjuntamente los filtros de estado y medio", async () => {
    render(<Conciliacion />); await screen.findByText("Diferencias frente al extracto");
    fireEvent.change(screen.getByLabelText("Medio"), { target: { value: "CONSIGNACION" } });
    let tabla = within(screen.getByRole("table", { name: /Órdenes del/ }));
    expect(tabla.queryByText("OP-001")).toBeNull(); expect(tabla.getByText("OP-002")).toBeDefined();
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "APROBADA" } });
    expect(screen.getByText("No hay órdenes que coincidan con los filtros.")).toBeDefined();
    fireEvent.change(screen.getByLabelText("Medio"), { target: { value: "" } });
    tabla = within(screen.getByRole("table", { name: /Órdenes del/ }));
    expect(tabla.getByText("OP-001")).toBeDefined(); expect(tabla.queryByText("OP-002")).toBeNull();
  });

  it.each([
    new File(["referencia,valor,fecha"], "extracto.pdf", { type: "application/pdf" }),
    new File(["referencia,valor,fecha"], "extracto.csv", { type: "application/pdf" }),
    new File([new Uint8Array(2 * 1024 * 1024 + 1)], "extracto.csv", { type: "text/csv" }),
    new File([], "extracto.csv", { type: "text/csv" }),
  ])("rechaza CSV inválido sin enviar el archivo ($name)", async (archivo) => {
    render(<Conciliacion />); await screen.findByText("Diferencias frente al extracto");
    fireEvent.change(screen.getByLabelText("Archivo CSV"), { target: { files: [archivo] } });
    expect(screen.getByRole("alert").textContent).toMatch(/CSV/);
    expect((screen.getByRole("button", { name: "Comparar extracto" }) as HTMLButtonElement).disabled).toBe(true);
    expect(compararExtracto).not.toHaveBeenCalled();
  });

  it("envía el CSV y presenta el informe recalculado", async () => {
    vi.mocked(compararExtracto).mockResolvedValue({ ...informe, diferencias: [] });
    render(<Conciliacion />); await screen.findByText("Diferencias frente al extracto");
    const archivo = new File(["referencia,valor,fecha\nOP-001,1250000,2026-11-12"], "extracto.csv", { type: "text/csv" });
    fireEvent.change(screen.getByLabelText("Archivo CSV"), { target: { files: [archivo] } });
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Comparar extracto" })); });
    expect(compararExtracto).toHaveBeenCalledWith(vi.mocked(consultarConciliacion).mock.calls[0][0], archivo);
    expect(screen.getByText("Sin diferencias")).toBeDefined();
    expect(screen.queryByText("El valor del extracto difiere del pago.")).toBeNull();
  });

  it("valida dd/mm/aaaa y consulta el día seleccionado sin desplazarlo por zona horaria", async () => {
    render(<Conciliacion />); await screen.findByText("Diferencias frente al extracto");
    fireEvent.change(screen.getByLabelText(/^Fecha de conciliación/), { target: { value: "31/02/2026" } });
    fireEvent.click(screen.getByRole("button", { name: "Consultar informe" }));
    expect(screen.getByText("Escribe una fecha válida en formato dd/mm/aaaa.")).toBeDefined();
    expect(consultarConciliacion).toHaveBeenCalledTimes(1);
    fireEvent.change(screen.getByLabelText(/^Fecha de conciliación/), { target: { value: "01/01/2026" } });
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Consultar informe" })); });
    expect(consultarConciliacion).toHaveBeenLastCalledWith("2026-01-01");
  });

  it("descarga el PDF mediante la utilidad existente con la fecha consultada", async () => {
    const pdf = new Blob(["pdf"], { type: "application/pdf" });
    vi.mocked(descargarConciliacionPdf).mockResolvedValue(pdf);
    render(<Conciliacion />); await screen.findByText("Diferencias frente al extracto");
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Descargar PDF" })); });
    const dia = vi.mocked(consultarConciliacion).mock.calls[0][0];
    expect(descargarConciliacionPdf).toHaveBeenCalledWith(dia);
    expect(guardarArchivo).toHaveBeenCalledWith(pdf, `Conciliacion-${dia}.pdf`);
  });

  it.each(["AUDITOR", "SOLICITANTE", "APROBADOR"])("deniega pantalla y enlace al rol %s sin consultar datos", (rol) => {
    sesion.rol = rol; render(<><MenuPanel /><Conciliacion /></>);
    expect(screen.getByRole("heading", { name: /No tienes acceso/ })).toBeDefined();
    expect(screen.queryByRole("link", { name: "Conciliación" })).toBeNull();
    expect(consultarConciliacion).not.toHaveBeenCalled();
  });

  it.each(["ADMINISTRADOR", "TESORERIA"])("permite pantalla y enlace al rol %s", async (rol) => {
    sesion.rol = rol; render(<><MenuPanel /><Conciliacion /></>);
    await screen.findByText("Diferencias frente al extracto");
    expect(screen.getByRole("link", { name: "Conciliación" }).getAttribute("href")).toBe("/panel/conciliacion");
  });

  it("muestra carga, error recuperable e informe vacío", async () => {
    vi.mocked(consultarConciliacion).mockRejectedValueOnce(new Error("sin conexión"));
    render(<Conciliacion />);
    expect(screen.getByText("Cargando informe de conciliación…")).toBeDefined();
    await screen.findByRole("alert");
    vi.mocked(consultarConciliacion).mockResolvedValue({ ...informe, filas: [], diferencias: [], porProveedor: [] });
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Reintentar" })); });
    expect(screen.getByText("Sin diferencias")).toBeDefined();
    expect(screen.getByText("No hay órdenes para el día seleccionado.")).toBeDefined();
  });
});
