import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { GuardiaSesion } from "./GuardiaSesion";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/pagos/retorno",
}));
vi.mock("./SesionProvider", () => ({
  useSesion: () => ({ estado: "anonimo", tieneRol: () => false, esPersonal: false }),
}));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it("conserva la orden del retorno si es necesario iniciar sesión otra vez", () => {
  window.history.replaceState({}, "", "/pagos/retorno?orden=orden-1");
  render(<GuardiaSesion><p>Pago</p></GuardiaSesion>);
  expect(replace).toHaveBeenCalledWith(`/ingresar?siguiente=${encodeURIComponent("/pagos/retorno?orden=orden-1")}`);
});
