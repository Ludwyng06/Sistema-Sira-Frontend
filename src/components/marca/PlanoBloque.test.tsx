import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { PisoBloque, TarjetaEspacio } from "@/lib/tipos";
import { PlanoBloque } from "./PlanoBloque";

function espacio(codigo: string, nombre: string): TarjetaEspacio {
  return {
    id: `id-${codigo}`,
    codigo,
    nombre,
    piso: 1,
    capacidadPersonas: 40,
    tipo: { codigo: "AULA", nombre: "Aula" },
    bloque: { codigo: "A", nombre: "Bloque A" },
    sede: { codigo: "MOC", nombre: "Mocoa" },
    portada: null,
    dotacion: [],
  } as unknown as TarjetaEspacio;
}

afterEach(cleanup);

describe("PlanoBloque", () => {
  it("enlaza los espacios reservables a su ficha", () => {
    const pisos: PisoBloque[] = [{ piso: 1, espacios: [espacio("A-105", "Aula 105")] }];
    render(<PlanoBloque codigoBloque="A" numeroPisos={1} pisos={pisos} />);
    const enlace = screen.getByRole("link", { name: /Aula 105 \(A-105\)/ });
    expect(enlace.getAttribute("href")).toBe("/espacios/A-105");
  });

  it("dibuja las oficinas retiradas como zonas no reservables, sin enlace ni estado", () => {
    // Aunque la API devolviera A-101, el plano no debe enlazarlo.
    const pisos: PisoBloque[] = [{ piso: 1, espacios: [espacio("A-101", "OF. 101")] }];
    const { container } = render(<PlanoBloque codigoBloque="A" numeroPisos={1} pisos={pisos} />);
    expect(screen.queryByRole("link", { name: /A-101/ })).toBeNull();
    for (const codigo of ["A-101", "A-102", "A-103", "A-104"]) {
      const zona = container.querySelector(`g[data-codigo="${codigo}"]`);
      expect(zona?.getAttribute("data-no-reservable")).toBe("true");
    }
    expect(screen.getByText("OF. 101")).toBeTruthy();
    expect(screen.queryByText("40 pers.")).toBeNull();
  });

  it.each([
    ["D", ["D-106", "D-107", "D-108"]],
    ["F", ["F-101", "F-102", "F-104"]],
  ])("marca como no reservables los retirados del bloque %s", (bloque, codigos) => {
    const { container } = render(<PlanoBloque codigoBloque={bloque} numeroPisos={1} pisos={[]} />);
    for (const codigo of codigos) {
      const zona = container.querySelector(`g[data-codigo="${codigo}"]`);
      expect(zona?.getAttribute("data-no-reservable")).toBe("true");
    }
  });
});
