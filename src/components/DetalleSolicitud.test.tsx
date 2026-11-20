import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { obtenerSolicitud, type ReservaItem, type SolicitudDetalle } from "@/lib/solicitudes";
import { DetalleSolicitud } from "./DetalleSolicitud";

vi.mock("@/lib/solicitudes", async (original) => ({
  ...await original<typeof import("@/lib/solicitudes")>(),
  obtenerSolicitud: vi.fn(),
}));
vi.mock("@/components/SesionProvider", () => ({ useSesion: () => ({ tieneRol: () => false }) }));
vi.mock("@/components/CalendarioEspacio", () => ({ CalendarioEspacio: () => null }));
vi.mock("@/components/DocumentosSolicitud", () => ({ DocumentosSolicitud: () => null }));

const reserva: ReservaItem = {
  id: "reserva-1", espacioId: "espacio-1", tipoEspacioId: "tipo-1",
  espacioCodigo: "B-101", espacioNombre: "Auditorio",
  inicio: "2026-12-01T13:00:00Z", fin: "2026-12-01T15:00:00Z",
  unidad: "HORA", cantidad: 2, valorUnitario: 90000, recargos: 0, subtotal: 180000,
};

function solicitud(item: ReservaItem, esExenta = false): SolicitudDetalle {
  return {
    id: "solicitud-1", consecutivo: "SOL-001", estado: "ENVIADA", objetoEvento: "Conferencia",
    descripcion: null, asistentesEstimados: 20, responsableEnSitio: null, telefonoContacto: null,
    eventoPublico: false, declaraUsoInstitucional: esExenta, esExenta, tipoTarifa: "PERSONA_NATURAL",
    dependenciaId: null, enviadaEn: "2026-11-19T13:00:00Z", venceEn: null,
    creadoEn: "2026-11-19T12:00:00Z", actualizadoEn: "2026-11-19T13:00:00Z",
    actas: [], reservas: [item], servicios: [], decisiones: [], cotizacion: null, reembolso: null,
    estimado: {
      base: item.cantidad * item.valorUnitario, recargos: item.recargos,
      subtotal: item.subtotal, iva: 0, deposito: 0, total: item.subtotal,
    },
  };
}

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe.each(["solicitante", "revisor"] as const)("Desglose de horarios para %s", (modo) => {
  async function abrir(item: ReservaItem, esExenta = false) {
    vi.mocked(obtenerSolicitud).mockResolvedValue(solicitud(item, esExenta));
    render(<DetalleSolicitud id="solicitud-1" modo={modo} rutaVolver="/" />);
    return within(await screen.findByRole("region", { name: "Horarios solicitados" }));
  }

  it.each([
    { item: reserva, total: "$180.000", detalle: "2 horas · tarifa $90.000 por hora" },
    {
      item: { ...reserva, cantidad: 1, fin: "2026-12-01T14:00:00Z", subtotal: 90000 },
      total: "$90.000", detalle: "1 hora · tarifa $90.000 por hora",
    },
    {
      item: { ...reserva, recargos: 63000, subtotal: 243000 },
      total: "$243.000", detalle: "2 horas · tarifa $90.000 por hora · incluye recargo $63.000",
    },
  ])("presenta $detalle debajo del total $total", async ({ item, total, detalle }) => {
    const horarios = await abrir(item);
    const valor = horarios.getByText(total);
    const aclaracion = horarios.getByText(detalle);
    expect(valor.classList.contains("font-medium")).toBe(true);
    expect(aclaracion.classList.contains("block")).toBe(true);
    expect(valor.nextElementSibling).toBe(aclaracion);
    expect(horarios.getByRole("listitem").textContent).not.toContain("×");
  });

  it("conserva el subtotal recibido aunque difiera del cálculo local", async () => {
    const horarios = await abrir({ ...reserva, subtotal: 175000 });
    expect(horarios.getByText("$175.000")).toBeDefined();
    expect(horarios.getByText("2 horas · tarifa $90.000 por hora")).toBeDefined();
  });

  it("conserva ocultos los valores de las franjas en solicitudes exentas", async () => {
    const horarios = await abrir(reserva, true);
    expect(horarios.queryByText("$180.000")).toBeNull();
    expect(horarios.queryByText(/tarifa/)).toBeNull();
    expect(horarios.getByText(/B-101 · Auditorio/)).toBeDefined();
  });
});
