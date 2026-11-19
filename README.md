# SIRA · Frontend

**SIRA (Sistema de Inventario y Reserva de Activos)** es la plataforma web con la que la Institución Universitaria del Putumayo administra sus espacios físicos por **sede → bloque → espacio**, publica su disponibilidad y tramita reservas (sin costo para uso institucional y con cotización y pago para externos). Este repositorio contiene la aplicación cliente del **frontend** desarrollada con Next.js 16, React 19 y Tailwind CSS 4.

- Repositorio del backend: <https://github.com/Ludwyng06/Sistema-Sira-Backend>

## Requisitos

- **Node.js 22.22.3 o superior** (rama 22 LTS, `.nvmrc`; el mismo mínimo del backend) y npm.
- Git.
- Backend de SIRA ejecutándose en el puerto **3001** (ver repositorio del backend).

## Instalación y arranque

```bash
npm install
cp .env.example .env.local
npm run start
```

`npm run start` levanta el servidor de desarrollo en <http://localhost:3000>. Para producción: `npm run build` y luego `npm run start:prod` (mismo puerto).

## Variables de entorno

Copia el archivo de plantilla `.env.example` a `.env.local` y configura los valores requeridos:
- `NEXT_PUBLIC_API_URL`: URL base de la API del backend accesible desde el navegador (`http://localhost:3001/api`).
- `API_URL_INTERNA`: URL base de la API del backend para llamadas internas del servidor (`http://localhost:3001/api`).
- `NEXT_PUBLIC_VERSION_POLITICA`: Versión vigente de la política de datos (`2026-10`).

## Scripts

| Script | Qué hace |
|---|---|
| `npm run start` | Servidor de desarrollo (`next dev --port 3000`). |
| `npm run build` | Compilación de producción (no requiere el backend arriba). |
| `npm run start:prod` | Sirve la compilación en producción (`next start --port 3000`). |
| `npm run lint` | Análisis estático de código con ESLint. |
| `npm run test` | Pruebas unitarias con Vitest. |

## URLs y mapa de rutas

| Ruta | Descripción |
|---|---|
| <http://localhost:3000/> | Bloques de la sede Mocoa y buscador por número de personas |
| `/sedes/MOC/bloques/A` | Plano y espacios del bloque por piso, con aforo y filtro por tipo |
| `/espacios/B-101` | Ficha del espacio: fotos, aforo, dotación y tarifas |
| `/ingresar` | Autenticación, inicio de sesión y recuperación de credenciales |
| `/mis-solicitudes` | Consulta y seguimiento de solicitudes de reserva |
| `/panel` | Panel de gestión y administración |

La ruta del bloque incluye la sede (`/sedes/[sede]/bloques/[bloque]`) porque el código del bloque es único dentro de una sede.

## Pagos

El sistema opera bajo la modalidad oficial de pago por enlace con verificación manual, con las pasarelas apagadas (`PASARELA_PROVEEDOR=ninguna`).
La pantalla de orden de pago expone el valor y la referencia (`OP-`), facilitando el acceso al enlace de recaudo institucional, la carga del comprobante en formato PDF o imagen y la notificación a Tesorería vía WhatsApp o correo.
Los parámetros institucionales `PAGO_ENLACE_URL`, `PAGO_INSTRUCCIONES`, `PAGO_WHATSAPP_AREA` y `PAGO_CORREO_AREA` son editables por el administrador para configurar el enlace de recaudo y los canales de validación manual.

## Convenciones

- Server Components para lo público; todo `fetch` pasa por `src/lib/api.ts`.
- Colores mediante los tokens de diseño de `src/app/globals.css`; el estado nunca se comunica solo con color.
- Fechas `dd/mm/aaaa`, moneda en pesos colombianos (`src/lib/formato.ts`, zona `America/Bogota`).
- Next.js 16 con `cacheComponents` para optimización de renderizado.
- Commits en español siguiendo Conventional Commits.
