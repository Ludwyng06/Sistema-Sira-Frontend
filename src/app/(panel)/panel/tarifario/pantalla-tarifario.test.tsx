import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { PantallaTarifario } from "./pantalla-tarifario";
import { actualizarRecargo, listarRecargos, validarPorcentajeRecargo, type Recargo } from "@/lib/tarifario-admin";
import { avisar } from "@/lib/avisos";

vi.mock("@/lib/tarifario-admin", async (original) => ({
  ...(await original<typeof import("@/lib/tarifario-admin")>()),
  listarRecargos: vi.fn(),
  actualizarRecargo: vi.fn(),
  listarTarifas: vi.fn(() => Promise.resolve({ datos: [], total: 0, pagina: 1, porPagina: 20 })),
  listarFestivos: vi.fn(() => Promise.resolve([])),
}));

vi.mock("@/lib/inventario-admin", () => ({
  listarEspaciosAdmin: vi.fn(() => Promise.resolve({ datos: [], total: 0, pagina: 1, porPagina: 100 })),
}));

vi.mock("@/lib/servicios-admin", () => ({
  listarServiciosAdmin: vi.fn(() => Promise.resolve({ datos: [], total: 0, pagina: 1, porPagina: 100 })),
}));

vi.mock("@/lib/avisos", () => ({
  avisar: { error: vi.fn(), exito: vi.fn() },
}));

const recargo = (tipo: Recargo["tipo"], porcentaje: number, cambios: Partial<Recargo> = {}): Recargo => ({
  id: `id-${tipo}`,
  tipo,
  porcentaje,
  desdeHora: tipo === "NOCTURNO" ? "19:00" : null,
  activo: true,
  ...cambios,
});

const RECARGOS: Recargo[] = [
  recargo("NOCTURNO", 35),
  recargo("DOMINICAL_DIURNO", 75),
  recargo("DOMINICAL_NOCTURNO", 110),
  recargo("FESTIVO_DIURNO", 75, { activo: false }),
  recargo("FESTIVO_NOCTURNO", 110),
];

async function abrirRecargos() {
  render(<PantallaTarifario />);
  fireEvent.click(screen.getByRole("tab", { name: "Recargos" }));
  await screen.findByRole("heading", { name: "Recargos" });
}

const tarjeta = (nombre: string) => screen.getByRole("form", { name: nombre });

describe("Tarifario - pestaña Recargos", () => {
  beforeEach(() => {
    vi.mocked(listarRecargos).mockResolvedValue(structuredClone(RECARGOS));
    vi.mocked(actualizarRecargo).mockImplementation((tipo, datos) =>
      Promise.resolve(recargo(tipo, datos.porcentaje ?? 0)),
    );
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("muestra las cinco tarjetas en orden con sus valores", async () => {
    await abrirRecargos();
    const titulos = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(titulos).toEqual([
      "Nocturno",
      "Dominical diurno",
      "Dominical nocturno",
      "Festivo diurno",
      "Festivo nocturno",
    ]);
    expect(within(tarjeta("Dominical nocturno")).getByLabelText(/Porcentaje/)).toHaveProperty("value", "110");
    expect(within(tarjeta("Festivo diurno")).getByRole("checkbox")).toHaveProperty("checked", false);
  });

  it("solo el nocturno tiene 'Aplica desde'; las nocturnas dominical y festiva indican que usan esa hora", async () => {
    await abrirRecargos();
    expect(within(tarjeta("Nocturno")).getByLabelText(/Aplica desde/)).toBeTruthy();
    for (const nombre of ["Dominical diurno", "Dominical nocturno", "Festivo diurno", "Festivo nocturno"]) {
      expect(within(tarjeta(nombre)).queryByLabelText(/Aplica desde/)).toBeNull();
    }
    for (const nombre of ["Dominical nocturno", "Festivo nocturno"]) {
      const contenido = tarjeta(nombre).textContent ?? "";
      expect(contenido).toContain("19:00");
      expect(contenido).toContain("misma hora del recargo nocturno");
    }
  });

  it("guarda un porcentaje de 300 con el tipo correcto y sin hora", async () => {
    await abrirRecargos();
    const formulario = tarjeta("Festivo nocturno");
    fireEvent.change(within(formulario).getByLabelText(/Porcentaje/), { target: { value: "300" } });
    fireEvent.click(within(formulario).getByRole("button", { name: /Guardar festivo nocturno/ }));
    await waitFor(() =>
      expect(actualizarRecargo).toHaveBeenCalledWith("FESTIVO_NOCTURNO", {
        porcentaje: 300,
        desdeHora: undefined,
        activo: true,
      }),
    );
    expect(avisar.exito).toHaveBeenCalledWith("El recargo festivo nocturno quedó actualizado.");
  });

  it("guarda decimales y la hora del nocturno", async () => {
    await abrirRecargos();
    const formulario = tarjeta("Nocturno");
    fireEvent.change(within(formulario).getByLabelText(/Porcentaje/), { target: { value: "125.5" } });
    fireEvent.click(within(formulario).getByRole("button", { name: /Guardar nocturno/ }));
    await waitFor(() =>
      expect(actualizarRecargo).toHaveBeenCalledWith("NOCTURNO", {
        porcentaje: 125.5,
        desdeHora: "19:00",
        activo: true,
      }),
    );
  });

  it.each(["300.01", "-1", "12.345", ""])("no envía el porcentaje inválido %j y muestra el error", async (valor) => {
    await abrirRecargos();
    const formulario = tarjeta("Dominical diurno");
    const campo = within(formulario).getByLabelText(/Porcentaje/);
    fireEvent.change(campo, { target: { value: valor } });
    fireEvent.click(within(formulario).getByRole("button", { name: /Guardar dominical diurno/ }));
    await waitFor(() => expect(campo.getAttribute("aria-invalid")).toBe("true"));
    expect(actualizarRecargo).not.toHaveBeenCalled();
  });

  it("muestra la tarjeta de un recargo aún no configurado para crearlo", async () => {
    vi.mocked(listarRecargos).mockResolvedValue(RECARGOS.filter((r) => r.tipo !== "DOMINICAL_NOCTURNO"));
    await abrirRecargos();
    const formulario = tarjeta("Dominical nocturno");
    expect(formulario.textContent).toContain("Aún no está configurado");
    fireEvent.change(within(formulario).getByLabelText(/Porcentaje/), { target: { value: "80" } });
    fireEvent.click(within(formulario).getByRole("button", { name: /Guardar dominical nocturno/ }));
    await waitFor(() =>
      expect(actualizarRecargo).toHaveBeenCalledWith("DOMINICAL_NOCTURNO", {
        porcentaje: 80,
        desdeHora: undefined,
        activo: true,
      }),
    );
  });
});

describe("validarPorcentajeRecargo", () => {
  it.each(["0", "20", "125", "125.5", "125,75", "299.99", "300"])("acepta %j", (valor) => {
    expect(validarPorcentajeRecargo(valor)).toBeNull();
  });

  it.each(["300.01", "301", "-0.01", "-5", "1.234", "abc", ""])("rechaza %j", (valor) => {
    expect(validarPorcentajeRecargo(valor)).not.toBeNull();
  });
});
