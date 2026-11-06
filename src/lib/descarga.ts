/**
 * Descarga un archivo que ya llegó como Blob. Se usa un enlace con `download` porque abrir una
 * pestaña después de esperar a la API suele bloquearlo el navegador (ventana emergente).
 */
export function guardarArchivo(archivo: Blob, nombre: string) {
  const url = URL.createObjectURL(archivo);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
