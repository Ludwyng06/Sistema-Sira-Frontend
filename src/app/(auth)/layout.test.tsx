import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import AuthLayout from "./layout";

afterEach(cleanup);

it("muestra el escudo institucional con texto alternativo en móvil y escritorio", () => {
  render(<AuthLayout params={Promise.resolve({})}><p>Formulario de ingreso</p></AuthLayout>);

  const escudos = screen.getAllByAltText("Escudo de la Institución Universitaria del Putumayo");
  expect(escudos).toHaveLength(2);
  for (const escudo of escudos) {
    expect(escudo.getAttribute("src")).toContain("escudo-uniputumayo.webp");
  }
});
