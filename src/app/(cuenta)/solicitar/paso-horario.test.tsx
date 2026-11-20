import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PasoHorario } from "./paso-horario";

const { disponibilidad, agregarReserva, errorManual } = vi.hoisted(() => ({
  disponibilidad: vi.fn(),
  agregarReserva: vi.fn(),
  errorManual: vi.fn(),
}));
vi.mock("@/components/CalendarioEspacio", () => ({ CalendarioEspacio: () => null }));
vi.mock("@/lib/espacio-id", () => ({
  resolverEspacioId: async () => "espacio-1",
  resolverCodigoPorId: async () => "A-101",
}));
vi.mock("@/lib/disponibilidad", () => ({ obtenerDisponibilidad: disponibilidad }));
vi.mock("@/lib/inventario", () => ({
  obtenerEspacio: async () => ({
    capacidadPersonas: 50,
    reglasTipo: { anticipacionMinimaDias: 0, anticipacionEnHabiles: false },
  }),
}));
vi.mock("@/lib/solicitudes", () => ({ agregarReserva, quitarReserva: vi.fn() }));
vi.mock("@/lib/avisos", () => ({
  avisar: { errorManual, error: vi.fn(), exito: vi.fn() },
}));

beforeEach(() => {
  // Solo se fija Date: las esperas de las consultas siguen usando temporizadores reales.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-19T15:00:00Z"));
  disponibilidad.mockResolvedValue({
    franjas: [],
    horarios: [
      { diaSemana: 6, abre: "08:00", cierra: "12:00" },
      { diaSemana: 0, abre: "09:00", cierra: "13:00" },
    ],
  });
  agregarReserva.mockResolvedValue({});
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.useRealTimers();
});

function mostrar() {
  const asegurar = vi.fn().mockResolvedValue("solicitud-1");
  const recargar = vi.fn();
  render(
    <PasoHorario
      contexto={{ borrador: null, asegurar, recargar }}
      espacios={[{ codigo: "A-101", nombre: "Salón", bloque: "A", capacidad: 50 }]}
      asistentesInicial={20}
      alContinuar={vi.fn()}
    />,
  );
  return { asegurar, recargar };
}

it.each([
  ["sábado", "2026-11-21", "08:00", "12:00"],
  ["domingo", "2026-11-22", "09:00", "13:00"],
])("permite seleccionar y agregar un %s con horario del backend", async (nombre, dia, abre, cierra) => {
  const { asegurar, recargar } = mostrar();
  await screen.findByText(/Horario del espacio:/);
  fireEvent.click(screen.getByRole("button", { name: "Día" }));
  const fecha = screen.getByRole("button", { name: new RegExp(`${nombre}.*${Number(dia.slice(8))} de noviembre`) });
  expect(fecha.getAttribute("aria-disabled")).not.toBe("true");
  fireEvent.click(fecha);
  const desde = screen.getByLabelText("Desde") as HTMLSelectElement;
  const hasta = screen.getByLabelText("Hasta") as HTMLSelectElement;
  expect(desde.disabled).toBe(false);
  expect(hasta.disabled).toBe(false);
  expect(desde.value).toBe(abre);
  fireEvent.change(hasta, { target: { value: cierra } });
  fireEvent.click(screen.getByRole("button", { name: "Agregar este horario" }));
  await waitFor(() => expect(agregarReserva).toHaveBeenCalledWith(
    "solicitud-1", "espacio-1",
    new Date(`${dia}T${abre}:00-05:00`).toISOString(),
    new Date(`${dia}T${cierra}:00-05:00`).toISOString(),
  ));
  expect(asegurar).toHaveBeenCalledWith(20);
  await waitFor(() => expect(recargar).toHaveBeenCalledOnce());
  expect(errorManual).not.toHaveBeenCalled();
});

it.each([
  ["sábado", 21, 0],
  ["domingo", 22, 6],
])("mantiene visible y Cerrado un %s sin horario", async (nombre, numero, diaAbierto) => {
  disponibilidad.mockResolvedValue({
    franjas: [], horarios: [{ diaSemana: diaAbierto, abre: "08:00", cierra: "12:00" }],
  });
  mostrar();
  await screen.findByText(/Horario del espacio:/);
  fireEvent.click(screen.getByRole("button", { name: "Día" }));
  const fecha = screen.getByRole("button", { name: new RegExp(`${nombre}.*${numero} de noviembre.*cerrado`) });
  expect(fecha.getAttribute("aria-disabled")).toBe("true");
  expect(fecha.textContent).toContain("Cerrado");
  fireEvent.click(fecha);
  expect(screen.getByRole("dialog")).toBeTruthy();
  expect(agregarReserva).not.toHaveBeenCalled();
});
