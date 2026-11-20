import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import type { EventInput } from "@fullcalendar/core";
import { CalendarioEspacio } from "./CalendarioEspacio";

interface OpcionesCalendario {
  weekends: boolean;
  hiddenDays?: number[];
  selectable: boolean;
  businessHours: { daysOfWeek: number[]; startTime: string; endTime: string }[] | false;
  selectConstraint?: string;
  selectAllow: (span: { start: Date; end: Date }) => boolean;
  select: (span: { start: Date; end: Date }) => void;
  dayCellClassNames: (arg: { date: Date }) => string[];
  events: (
    rango: { start: Date; end: Date },
    correcto: (eventos: EventInput[]) => void,
    fallo: (error: Error) => void,
  ) => Promise<void>;
}

const { calendario, disponibilidad } = vi.hoisted(() => ({
  calendario: vi.fn<(props: OpcionesCalendario) => null>(() => null),
  disponibilidad: vi.fn(),
}));
vi.mock("next/dynamic", () => ({ default: () => calendario }));
vi.mock("@/lib/disponibilidad", () => ({ obtenerDisponibilidad: disponibilidad }));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-19T15:00:00Z"));
  vi.stubGlobal("matchMedia", vi.fn(() => ({
    matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  })));
  disponibilidad.mockResolvedValue({
    franjas: [],
    horarios: [
      { diaSemana: 6, abre: "08:00", cierra: "12:00" },
      { diaSemana: 0, abre: "09:00", cierra: "13:00" },
    ],
  });
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const opciones = () => calendario.mock.calls.at(-1)![0];

it.each([
  ["sábado", "2026-11-21", "08:00", "12:00", 6],
  ["domingo", "2026-11-22", "09:00", "13:00", 0],
])("ofrece el %s para selección con su horario recibido", async (_nombre, dia, abre, cierra, diaSemana) => {
  const onSeleccion = vi.fn();
  render(<CalendarioEspacio espacioId="espacio-1" restringirAHorario onSeleccion={onSeleccion} />);
  const correcto = vi.fn();
  const fallo = vi.fn();
  await act(async () => {
    await opciones().events({
      start: new Date("2026-11-16T00:00:00Z"),
      end: new Date("2026-11-23T00:00:00Z"),
    }, correcto, fallo);
  });
  const props = opciones();
  expect(fallo).not.toHaveBeenCalled();
  expect(correcto).toHaveBeenCalled();
  expect(props.weekends).toBe(true);
  expect(props.hiddenDays ?? []).not.toContain(diaSemana);
  expect(props.selectable).toBe(true);
  expect(props.businessHours).toContainEqual({ daysOfWeek: [diaSemana], startTime: abre, endTime: cierra });
  expect(props.selectConstraint).toBe("businessHours");
  const span = { start: new Date(`${dia}T${abre}:00Z`), end: new Date(`${dia}T${cierra}:00Z`) };
  expect(props.dayCellClassNames({ date: span.start })).toEqual([]);
  expect(props.selectAllow(span)).toBe(true);
  act(() => props.select(span));
  expect(onSeleccion).toHaveBeenCalledWith({
    inicio: new Date(`${dia}T${abre}:00-05:00`).toISOString(),
    fin: new Date(`${dia}T${cierra}:00-05:00`).toISOString(),
  });
  // Un día ausente de los datos conserva el indicador de cierre.
  expect(props.dayCellClassNames({ date: new Date("2026-11-23T12:00:00Z") })).toEqual(["dia-deshabilitado"]);
});
