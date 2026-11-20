import { describe, expect, it } from "vitest";
import { desgloseReserva } from "./desglose";

const reserva = { unidad: "HORA", cantidad: 2, valorUnitario: 90000, recargos: 0 };

describe("desgloseReserva", () => {
  it("distingue la tarifa por hora del total sin una multiplicación", () => {
    expect(desgloseReserva(reserva)).toBe("2 horas · tarifa $90.000 por hora");
  });

  it("usa hora en singular", () => {
    expect(desgloseReserva({ ...reserva, cantidad: 1 })).toBe("1 hora · tarifa $90.000 por hora");
  });

  it("indica que el recargo del ítem ya está incluido", () => {
    expect(desgloseReserva({ ...reserva, recargos: 63000 })).toBe(
      "2 horas · tarifa $90.000 por hora · incluye recargo $63.000",
    );
  });

  it.each([
    ["DIA", "día", "días"],
    ["JORNADA_MANANA", "jornada de la mañana", "jornadas de la mañana"],
    ["JORNADA_TARDE", "jornada de la tarde", "jornadas de la tarde"],
    ["JORNADA_NOCHE", "jornada de la noche", "jornadas de la noche"],
  ])("respeta la unidad %s y expresa la tarifa en singular", (unidad, singular, plural) => {
    expect(desgloseReserva({ ...reserva, unidad, cantidad: 1 })).toBe(
      `1 ${singular} · tarifa $90.000 por ${singular}`,
    );
    expect(desgloseReserva({ ...reserva, unidad })).toBe(
      `2 ${plural} · tarifa $90.000 por ${singular}`,
    );
  });

  it("conserva cantidades fraccionarias y tarifas gratuitas", () => {
    expect(desgloseReserva({ ...reserva, cantidad: 1.5, valorUnitario: 0 })).toBe(
      "1.5 horas · tarifa $0 por hora",
    );
  });

  it("no inventa una unidad cuando el contrato devuelve null", () => {
    expect(desgloseReserva({ ...reserva, unidad: null })).toBe("2 · tarifa $90.000");
  });

  it("mantiene legible una unidad no conocida", () => {
    expect(desgloseReserva({ ...reserva, unidad: "OTRA_UNIDAD" })).toBe(
      "2 otra unidad · tarifa $90.000 por otra unidad",
    );
  });

  it.each([0, -1])("omite cantidades no positivas (%s)", (cantidad) => {
    expect(desgloseReserva({ ...reserva, cantidad })).toBeNull();
  });
});
