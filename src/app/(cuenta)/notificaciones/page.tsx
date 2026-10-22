import type { Metadata } from "next";
import { CentroNotificaciones } from "./centro-notificaciones";

export const metadata: Metadata = { title: "Notificaciones" };

export default function Notificaciones() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-4xl font-black sm:text-5xl">Notificaciones</h1>
      <CentroNotificaciones />
    </div>
  );
}
