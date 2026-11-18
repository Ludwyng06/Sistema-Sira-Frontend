import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import {
  ParametrosSistema,
  METADATOS_PARAMETROS,
  validarUrlHttps,
  validarWhatsapp,
  validarCorreo,
} from "./parametros";
import {
  actualizarParametro,
  listarParametros,
  listarSmmlv,
  type Parametro,
} from "@/lib/administracion";

vi.mock("@/lib/administracion", () => ({
  actualizarParametro: vi.fn(),
  listarParametros: vi.fn(),
  listarSmmlv: vi.fn(),
  guardarSmmlv: vi.fn(),
}));

vi.mock("@/lib/avisos", () => ({
  avisar: { error: vi.fn(), exito: vi.fn() },
}));

describe("Configuración - Parámetros de Pago por enlace", () => {
  const parametrosMock: Parametro[] = [
    {
      clave: "PAGO_ENLACE_URL",
      valor: "https://pagos.itp.edu.co/portal" as unknown as Record<string, never>,
      descripcion: null,
      actualizadoEn: "2026-11-18T10:00:00.000Z",
    },
    {
      clave: "PAGO_INSTRUCCIONES",
      valor: "Paga en el portal institucional y adjunta el soporte PDF." as unknown as Record<string, never>,
      descripcion: null,
      actualizadoEn: "2026-11-18T10:00:00.000Z",
    },
    {
      clave: "PAGO_WHATSAPP_AREA",
      valor: "573001234567" as unknown as Record<string, never>,
      descripcion: null,
      actualizadoEn: "2026-11-18T10:00:00.000Z",
    },
    {
      clave: "PAGO_CORREO_AREA",
      valor: "tesoreria@itp.edu.co" as unknown as Record<string, never>,
      descripcion: null,
      actualizadoEn: "2026-11-18T10:00:00.000Z",
    },
    {
      clave: "dias_anticipacion_reserva",
      valor: 5 as unknown as Record<string, never>,
      descripcion: "Días mínimos de anticipación",
      actualizadoEn: "2026-11-18T10:00:00.000Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listarParametros).mockResolvedValue(structuredClone(parametrosMock));
    vi.mocked(listarSmmlv).mockResolvedValue([]);
    vi.mocked(actualizarParametro).mockResolvedValue({
      clave: "PAGO_ENLACE_URL",
      valor: "https://nuevo.url.edu.co" as unknown as Record<string, never>,
      descripcion: null,
      actualizadoEn: "2026-11-18T12:00:00.000Z",
    });
  });

  afterEach(cleanup);

  describe("Funciones de validación en el cliente", () => {
    it("validarUrlHttps acepta vacío o URLs con https:// y rechaza http:// u otras cadenas", () => {
      expect(validarUrlHttps("")).toBeNull();
      expect(validarUrlHttps("   ")).toBeNull();
      expect(validarUrlHttps("https://portal.recaudo.edu.co/pse")).toBeNull();
      expect(validarUrlHttps("https://example.com/pago?ref=123")).toBeNull();

      expect(validarUrlHttps("http://inseguro.com")).toMatch(/https:\/\//);
      expect(validarUrlHttps("no-es-url")).toMatch(/URL válida/);
      expect(validarUrlHttps("ftp://recurso")).toMatch(/https:\/\//);
    });

    it("validarWhatsapp acepta vacío o números de 10 a 15 dígitos y rechaza otros", () => {
      expect(validarWhatsapp("")).toBeNull();
      expect(validarWhatsapp("   ")).toBeNull();
      expect(validarWhatsapp("573001234567")).toBeNull(); // 12 dígitos
      expect(validarWhatsapp("1234567890")).toBeNull(); // 10 dígitos
      expect(validarWhatsapp("123456789012345")).toBeNull(); // 15 dígitos

      expect(validarWhatsapp("123456789")).toMatch(/10 a 15 digitos/); // 9 dígitos
      expect(validarWhatsapp("1234567890123456")).toMatch(/10 a 15 digitos/); // 16 dígitos
      expect(validarWhatsapp("57300abc4567")).toMatch(/10 a 15 digitos/);
      expect(validarWhatsapp("+573001234567")).toMatch(/10 a 15 digitos/);
    });

    it("validarCorreo acepta vacío o correo válido y rechaza formatos incorrectos", () => {
      expect(validarCorreo("")).toBeNull();
      expect(validarCorreo("   ")).toBeNull();
      expect(validarCorreo("tesoreria@itp.edu.co")).toBeNull();
      expect(validarCorreo("admin.sira@universidad.edu.co")).toBeNull();

      expect(validarCorreo("no-es-correo")).toMatch(/correo electrónico válido/);
      expect(validarCorreo("tesoreria@")).toMatch(/correo electrónico válido/);
      expect(validarCorreo("@itp.edu.co")).toMatch(/correo electrónico válido/);
    });
  });

  describe("Metadatos de presentación y agrupación", () => {
    it("los metadatos de los 4 parámetros tienen grupo 'Pago por enlace', etiquetas humanas y ayuda corta", () => {
      const claves = ["PAGO_ENLACE_URL", "PAGO_INSTRUCCIONES", "PAGO_WHATSAPP_AREA", "PAGO_CORREO_AREA"];
      for (const clave of claves) {
        const meta = METADATOS_PARAMETROS[clave];
        expect(meta).toBeDefined();
        expect(meta.grupo).toBe("Pago por enlace");
        expect(meta.etiqueta.length).toBeGreaterThan(0);
        expect(meta.ayuda).toBeDefined();
        expect((meta.ayuda ?? "").length).toBeGreaterThan(0);
      }
    });

    it("muestra los 4 parámetros agrupados bajo la sección 'Pago por enlace'", async () => {
      render(<ParametrosSistema />);

      // Debe aparecer el encabezado de grupo "Pago por enlace"
      const encabezadoPago = await screen.findByRole("heading", { name: "Pago por enlace" });
      expect(encabezadoPago).toBeDefined();

      const seccionPago = encabezadoPago.closest("section");
      expect(seccionPago).not.toBeNull();

      if (seccionPago) {
        // Dentro del grupo Pago por enlace deben estar los 4 parámetros con sus etiquetas humanas
        expect(within(seccionPago).getByRole("heading", { name: "URL del enlace de pago" })).toBeDefined();
        expect(within(seccionPago).getByRole("heading", { name: "Instrucciones de pago" })).toBeDefined();
        expect(within(seccionPago).getByRole("heading", { name: "WhatsApp del área de tesorería" })).toBeDefined();
        expect(within(seccionPago).getByRole("heading", { name: "Correo del área de tesorería" })).toBeDefined();

        expect(within(seccionPago).getAllByText("URL del enlace de pago").length).toBeGreaterThan(0);
        expect(within(seccionPago).getAllByText("Instrucciones de pago").length).toBeGreaterThan(0);
        expect(within(seccionPago).getAllByText("WhatsApp del área de tesorería").length).toBeGreaterThan(0);
        expect(within(seccionPago).getAllByText("Correo del área de tesorería").length).toBeGreaterThan(0);

        // También se deben mostrar las claves técnicas
        expect(within(seccionPago).getByText("(PAGO_ENLACE_URL)")).toBeDefined();
        expect(within(seccionPago).getByText("(PAGO_INSTRUCCIONES)")).toBeDefined();
        expect(within(seccionPago).getByText("(PAGO_WHATSAPP_AREA)")).toBeDefined();
        expect(within(seccionPago).getByText("(PAGO_CORREO_AREA)")).toBeDefined();
      }

      // El parámetro fuera del grupo debe aparecer en "Otros parámetros"
      expect(screen.getByText("dias_anticipacion_reserva")).toBeDefined();
    });
  });

  describe("Validación en el cliente al intentar guardar", () => {
    it("impide guardar una URL http:// no segura y muestra el mensaje de error", async () => {
      render(<ParametrosSistema />);
      await screen.findByRole("heading", { name: "Pago por enlace" });

      const formUrl = screen.getByRole("form", { name: "URL del enlace de pago" });
      const inputUrl = within(formUrl).getByLabelText(/URL del enlace de pago/i);
      const botonGuardar = within(formUrl).getByRole("button", { name: "Guardar parámetro" });

      fireEvent.change(inputUrl, { target: { value: "http://sitio-inseguro.com/pago" } });
      await act(async () => {
        fireEvent.click(botonGuardar);
      });

      expect(actualizarParametro).not.toHaveBeenCalled();
      const alerta = await within(formUrl).findByRole("alert");
      expect(alerta.textContent).toMatch(/https:\/\//);
    });

    it("impide guardar un número de WhatsApp inválido y muestra el mensaje de error", async () => {
      render(<ParametrosSistema />);
      await screen.findByRole("heading", { name: "Pago por enlace" });

      const formWp = screen.getByRole("form", { name: "WhatsApp del área de tesorería" });
      const inputWp = within(formWp).getByLabelText(/WhatsApp del área de tesorería/i);
      const botonGuardar = within(formWp).getByRole("button", { name: "Guardar parámetro" });

      fireEvent.change(inputWp, { target: { value: "12345" } }); // Solo 5 dígitos
      await act(async () => {
        fireEvent.click(botonGuardar);
      });

      expect(actualizarParametro).not.toHaveBeenCalled();
      const alerta = await within(formWp).findByRole("alert");
      expect(alerta.textContent).toMatch(/10 a 15 digitos/);
    });

    it("impide guardar un correo inválido y muestra el mensaje de error", async () => {
      render(<ParametrosSistema />);
      await screen.findByRole("heading", { name: "Pago por enlace" });

      const formCorreo = screen.getByRole("form", { name: "Correo del área de tesorería" });
      const inputCorreo = within(formCorreo).getByLabelText(/Correo del área de tesorería/i);
      const botonGuardar = within(formCorreo).getByRole("button", { name: "Guardar parámetro" });

      fireEvent.change(inputCorreo, { target: { value: "correo-invalido-sin-arroba" } });
      await act(async () => {
        fireEvent.click(botonGuardar);
      });

      expect(actualizarParametro).not.toHaveBeenCalled();
      const alerta = await within(formCorreo).findByRole("alert");
      expect(alerta.textContent).toMatch(/correo electrónico válido/);
    });

    it("permite guardar una URL https válida o vacía llamando a actualizarParametro", async () => {
      render(<ParametrosSistema />);
      await screen.findByRole("heading", { name: "Pago por enlace" });

      const formUrl = screen.getByRole("form", { name: "URL del enlace de pago" });
      const inputUrl = within(formUrl).getByLabelText(/URL del enlace de pago/i);
      const botonGuardar = within(formUrl).getByRole("button", { name: "Guardar parámetro" });

      fireEvent.change(inputUrl, { target: { value: "https://portal.recaudo.edu.co/pse" } });
      await act(async () => {
        fireEvent.click(botonGuardar);
      });

      expect(actualizarParametro).toHaveBeenCalledWith("PAGO_ENLACE_URL", "https://portal.recaudo.edu.co/pse");
    });
  });
});
