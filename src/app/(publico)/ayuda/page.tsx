import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Ayuda" };

const PASOS = [
  {
    titulo: "Busca el espacio",
    texto:
      "Entra por el bloque o dinos para cuántas personas es tu evento. Verás el aforo de cada espacio y cuáles están libres.",
  },
  {
    titulo: "Crea tu cuenta y verifica tu correo",
    texto:
      "Con el correo institucional el sistema te reconoce como usuario interno. El correo se verifica con un código de 6 dígitos.",
  },
  {
    titulo: "Haz tu solicitud",
    texto:
      "Eliges franjas, servicios y datos del evento. Tu borrador se guarda solo y el horario se retiene cuando envías la solicitud.",
  },
  {
    titulo: "Espera la aprobación",
    texto:
      "El responsable del espacio y el aprobador revisan tu solicitud. Si te la devuelven, verás el motivo y puedes corregirla.",
  },
  {
    titulo: "Paga si eres externo",
    texto:
      "Las personas y entidades externas reciben una cotización y pagan por consignación. El uso institucional aprobado no genera pago.",
  },
];

const PREGUNTAS = [
  {
    pregunta: "¿Cuánto cuesta reservar un espacio?",
    respuesta:
      "El uso institucional no tiene costo. Para externos, el valor depende del espacio y del tipo de solicitante; puedes estimarlo en el simulador y se confirma en la cotización.",
  },
  {
    pregunta: "¿Con cuánta anticipación debo pedirlo?",
    respuesta:
      "Cada tipo de espacio tiene su anticipación mínima y el sistema te avisa en el momento si tu fecha no la cumple.",
  },
  {
    pregunta: "¿Puedo cancelar mi solicitud?",
    respuesta:
      "Sí, desde el detalle de tu solicitud en “Mis solicitudes”. Si ya pagaste, el valor a reembolsar depende de la política de cancelación y se te muestra antes de confirmar.",
  },
  {
    pregunta: "¿Qué pasa si el horario que quiero ya está ocupado?",
    respuesta:
      "El sistema no deja reservar dos eventos al tiempo. Te muestra qué franja choca y te sugiere otros espacios u horarios.",
  },
];

export default function Ayuda() {
  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-t1 font-black">Ayuda</h1>
        <p className="max-w-prose text-gris">
          Cómo reservar un espacio de la sede Mocoa, paso a paso.
        </p>
      </header>

      <section aria-labelledby="titulo-pasos" className="flex flex-col gap-4">
        <h2 id="titulo-pasos" className="text-2xl font-bold">
          Cómo funciona
        </h2>
        <ol className="grid gap-4 sm:grid-cols-2">
          {PASOS.map((p, i) => (
            <li key={p.titulo} className="flex gap-3 rounded-campo border border-gris-claro p-4">
              <span
                aria-hidden
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-azul font-bold text-white"
              >
                {i + 1}
              </span>
              <div>
                <h3 className="font-bold">{p.titulo}</h3>
                <p className="text-gris">{p.texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="titulo-preguntas" className="flex flex-col gap-4">
        <h2 id="titulo-preguntas" className="text-2xl font-bold">
          Preguntas frecuentes
        </h2>
        <div className="flex flex-col gap-3">
          {PREGUNTAS.map((p) => (
            <details key={p.pregunta} className="rounded-campo border border-gris-claro p-4">
              <summary className="cursor-pointer py-1 font-medium">{p.pregunta}</summary>
              <p className="mt-2 max-w-prose text-gris">{p.respuesta}</p>
            </details>
          ))}
        </div>
      </section>

      <section aria-labelledby="titulo-contacto" className="flex flex-col gap-2">
        <h2 id="titulo-contacto" className="text-2xl font-bold">
          Contacto
        </h2>
        <p className="max-w-prose text-gris">
          Los datos de contacto de la Vicerrectoría se publicarán aquí cuando la Institución los
          confirme.
        </p>
        <p>
          <Link href="/" className="text-azul-oscuro underline underline-offset-4">
            Volver a los espacios
          </Link>
        </p>
      </section>
    </div>
  );
}
