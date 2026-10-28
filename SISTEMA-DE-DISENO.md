# Sistema de diseño del frontend de SIRA

Para el equipo (Kevin, Isa, Jenser). Está en la rama `feature/kevin` del frontend. No cambia lógica, rutas, roles ni el backend: solo forma.

Regla de oro: **lo raro va en la forma, lo estándar va en la función.** Máximo una "firma" por pantalla.

## 1. Colores (solo desde `src/app/globals.css`, nunca hex en los componentes)

| Token | Uso |
|---|---|
| `azul` #18668F / `azul-oscuro` #0F4A69 | Marca, botones, enlaces |
| `turquesa` #2299B9 | Decoración y texto grande (no texto pequeño) |
| `tinta` #0B2E40 | Títulos y texto fuerte |
| `naranja` #F5A51D / `verde` #80BF1F | Acentos. Nunca como texto sobre blanco |
| `fondo` / `fondo-suave` | Fondos de página y tarjetas |
| `exito-suave` / `exito-texto`, `aviso-suave` / `aviso-texto`, `error` / `error-suave` | Estados |

El estado nunca depende solo del color: siempre lleva ícono y texto.

## 2. Tipografía

Raleway (títulos), Roboto (texto), Montserrat 800/900 (nombre "Uniputumayo").

| Token | Tamaño | Uso |
|---|---|---|
| `text-meta` | 14 px | Solo datos secundarios |
| `text-base` | 16 px | Todo el texto normal (mínimo) |
| `text-lg` / `text-xl` / `text-2xl` | 18 / 20 / 24 px | Énfasis y subtítulos |
| `text-t2` | 32 px | Títulos de sección grandes |
| `text-t1` | 36 → 48 px | Título de cada pantalla (h1) |
| `text-display` | 48 → 72 px | Solo portada |

## 3. Formas y elevación

- Bordes: `rounded-campo` (0.5 rem, campos y botones), `rounded-tarjeta` (1 rem), píldora (`rounded-full`).
- Sombras: `shadow-tarjeta`, `shadow-elevada`, `shadow-boton`. Nada más.
- Áreas táctiles: mínimo 44 px (`min-h-11`); campos y botones principales 48 px (`min-h-12`).

## 4. Componentes de marca (`src/components/marca/`)

| Componente | Para qué |
|---|---|
| `Logo`, `Marca` | Logo y nombre |
| `PlanoCampus` | Firma de la portada: plano estilo cianotipo con los bloques A, B y C como enlaces |
| `SelloEntrada` | Firma de ingresar y registro: sello de pasaporte |
| `CampusIsometrico` | Firma del tablero: maqueta isométrica (solo perfiles de administración) |
| `SolDeHoras` | Firma de la ficha del espacio: reloj de 24 horas por día |
| `SolRadial`, `BordeRasgado` | Decoración |

Otros: `InsigniaEstado` (sello de estado), `LineaEstaciones` / `LineaMetro` (firma del asistente y del seguimiento), `BotonImprimir` y `EncabezadoImpresion` (imprimir o guardar en PDF).

## 5. Movimiento

- Una animación protagonista por pantalla; solo `transform` y `opacity`.
- Los estilos base son el estado final. Con "reducir movimiento" todo se ve completo y quieto (regla global en `globals.css`).
- Animaciones actuales: dibujo del plano, sello que se estampa, línea que se llena, edificios que suben y flotan.

## 6. Reglas de contenido

- Español de Colombia, tono cercano y directo. Sin palabras de marketing.
- Los errores explican qué pasó, por qué y qué hacer (ver `src/lib/mensajes.ts`).
- Nada de datos inventados en pantalla: todo viene de la API.
- La maqueta del campus es un esquema (no a escala) y **no usa ningún dato del plano topográfico**, que es privado.

## 7. Accesibilidad

WCAG 2.1 AA. Verificado con axe y a 360 px sin desborde horizontal en las pantallas públicas, de ingreso, de solicitante y de panel. Cada pantalla tiene sus 5 estados (cargando, vacío, error, parcial, listo).

## 8. Impresión

`BotonImprimir` abre el diálogo del navegador (ahí se elige "Guardar como PDF"). Solo está en el detalle de la solicitud (recibo con cotización y pago) y en las actas. Las reglas de impresión (`@media print` en `globals.css`) ocultan menú, pie y botones. Los PDF del servidor (cotización, acta, comprobante) se descargan con `guardarArchivo` (`src/lib/descarga.ts`).

## 9. Lo que se le pide al backend (Isa y Jenser)

Ver `ISSUE-CONTRATO-espacio-id.md`, sobre todo: responsable obligatorio por espacio, que la ficha de administración lo devuelva, y que el enlace de las notificaciones sea una ruta del sitio.

## 10. Pendiente de verificar a mano

Flujo completo de pago con comprobante real, descarga de los PDF y la hoja impresa, porque requieren archivos reales y la impresora del navegador.
