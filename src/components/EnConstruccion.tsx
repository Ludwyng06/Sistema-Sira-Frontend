import { Construction } from "lucide-react";

export function EnConstruccion({
  titulo,
  responsable,
}: {
  titulo: string;
  responsable: string;
}) {
  return (
    <section className="flex flex-col items-center gap-3 rounded-campo border border-dashed border-gris-claro bg-fondo-suave px-6 py-16 text-center">
      <Construction aria-hidden className="size-10 text-azul-oscuro" />
      <h1 className="text-3xl font-extrabold">{titulo}</h1>
      <p className="text-gris">En construcción · responsable: {responsable}</p>
    </section>
  );
}
