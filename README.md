# SIRA · Frontend

**SIRA (Sistema de Inventario y Reserva de Activos)** es la plataforma web con la que la Institución Universitaria del Putumayo administra sus espacios físicos (sede → bloque → espacio), publica su disponibilidad y tramita reservas. Este repositorio es el **frontend** (Next.js 16 · React 19 · Tailwind CSS 4). Visión completa: [`docs/architecture/01-project-vision.md`](docs/architecture/01-project-vision.md).

> La fuente de verdad de `docs/` y de `PROMPT-MAESTRO.md` es el repositorio del backend: <https://github.com/Ludwyng06/Sistema-Sira-Backend>. Las copias de este repositorio solo se resincronizan desde allí.

## Requisitos

- Node.js 22.22.3 o superior (22 LTS, `.nvmrc`; el mismo mínimo del backend) y npm
- Git
- El backend de SIRA arriba en el puerto **3001** (ver su repositorio)

## Arranque

```bash
npm install
cp .env.example .env.local
npm run start
```

`npm run start` levanta el servidor de **desarrollo** en <http://localhost:3000>. Para producción: `npm run build` y luego `npm run start:prod` (mismo puerto).

| Script | Qué hace |
|---|---|
| `npm run start` | Servidor de desarrollo (`next dev --port 3000`) |
| `npm run build` | Compilación de producción (no requiere el backend arriba) |
| `npm run start:prod` | Sirve la compilación (`next start --port 3000`) |
| `npm run lint` | ESLint |

Variables (`.env.example`): `NEXT_PUBLIC_API_URL` (navegador) y `API_URL_INTERNA` (servidor), ambas `http://localhost:3001/api` en local.

## URLs y mapa de rutas

| Ruta | Estado | Qué es |
|---|---|---|
| <http://localhost:3000/> | Fase 0 | Bloques de la sede Mocoa + buscador por número de personas |
| `/sedes/MOC/bloques/A` | Fase 0 | Plano y espacios del bloque por piso, con aforo y filtro por tipo (`?asistentes=`, `?tipo=`) |
| `/espacios/B-101` | Fase 0 | Ficha del espacio: fotos, aforo, dotación y tarifas |
| `/ingresar` | En construcción | Identidad (responsable: Jensen) |
| `/mis-solicitudes` | En construcción | Mis solicitudes (responsable: Isabel) |
| `/panel` | En construcción | Panel de gestión (responsable: Jensen) |

La ruta del bloque incluye la sede (`/sedes/[sede]/bloques/[bloque]`) porque el código del bloque solo es único dentro de una sede.

## Mapa de la documentación (`docs/architecture/`)

| Documento | Contenido |
|---|---|
| `01-project-vision.md` | Visión, alcance y actores |
| `02-data-model.md` | Modelo de datos |
| `03-backend.md` | API, reglas de negocio y errores |
| `04-frontend.md` | **Este proyecto**: identidad visual, rutas, pantallas y componentes |
| `05` … `07` | Arquitectura, seguridad y cambios al documento base |
| `08-plan-de-trabajo-20-dias.md` | Plan, responsables y convenciones de ramas/commits |
| `09-inicializacion-y-git.md` | Receta de inicialización (Fase 0) |
| `anexos/` | Esquema Prisma, restricciones SQL, `aforo.ts`, máquina de estados |

## Convenciones

- Server Components para lo público; todo `fetch` pasa por `src/lib/api.ts`.
- Colores solo por los tokens de `src/app/globals.css`; el estado nunca se comunica solo con color.
- Fechas `dd/mm/aaaa`, pesos `$1.250.000` (`src/lib/formato.ts`, zona `America/Bogota`).
- Next.js 16 con `cacheComponents`: lee `node_modules/next/dist/docs/` antes de usar una API nueva (ver `AGENTS.md`).
- Commits en español con Conventional Commits.
