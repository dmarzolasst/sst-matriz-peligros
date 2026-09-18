# Matriz de Peligros GTC 45

Plataforma web para crear y gestionar matrices de identificación de peligros,
evaluación y valoración de riesgos según la **Guía Técnica Colombiana GTC 45**
(ICONTEC, segunda actualización), pensada para profesionales de Seguridad y
Salud en el Trabajo (SST) en Colombia.

El objetivo es reemplazar el Excel tradicional de matriz de riesgos por un
flujo guiado, con cálculos automáticos, catálogos reutilizables y trazabilidad,
sin sacrificar la fidelidad a la metodología oficial.

## Funcionalidades

- **Wizard de 7 etapas** para construir cada tarea de la matriz: Contexto →
  Peligros → Controles existentes → Evaluación → Valoración → Criterios →
  Medidas de intervención. Guardado automático en cada campo y duplicación de
  tareas/peligros para no repetir digitación.
- **Motor de cálculo GTC 45 centralizado** (`src/lib/risk-engine`): ND × NE =
  NP, NP × NC = NR, con interpretaciones y prioridad siempre derivadas — nunca
  digitadas manualmente. Verificado palabra por palabra contra el documento
  oficial de ICONTEC (ver [`prisma/seed.ts`](prisma/seed.ts) para el detalle),
  incluida la regla de ND = "Bajo" que clasifica directo a nivel de riesgo IV.
- **Catálogos configurables** (clasificaciones de peligro GTC 45, controles,
  peores consecuencias, medidas de intervención, procesos y zonas por
  empresa) editables desde el módulo de Configuración — activar/desactivar,
  nunca borrar, para no perder trazabilidad.
- **Dashboard gerencial** con KPIs, gráficos (Recharts) y filtros por empresa,
  proceso, zona, clasificación, nivel de riesgo y tipo de tarea.
- **Exportación a Excel** (matriz completa, formato tradicional, con color por
  nivel de riesgo) y **PDF** (informe ejecutivo con resumen, distribución de
  riesgos y principales riesgos pendientes).
- **Auditoría**: cada creación/edición queda registrada con usuario y fecha.
- Interfaz responsive (sidebar tipo panel deslizable en móvil/tablet).

## Stack técnico

- [Next.js 16](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS
- [Prisma](https://www.prisma.io) `6.19.3` (fijado — evitar subir a Prisma
  7/8, que cambia de arquitectura) + PostgreSQL
- [NextAuth v5](https://authjs.dev) (credenciales, sesión JWT)
- [Recharts](https://recharts.org) · [ExcelJS](https://github.com/exceljs/exceljs) · [jsPDF](https://github.com/parallax/jsPDF)
- [Zod](https://zod.dev) para validación · [Vitest](https://vitest.dev) para pruebas del motor de riesgo

## Requisitos previos

- Node.js 20+
- Docker Desktop (para PostgreSQL local) — o cualquier instancia de
  PostgreSQL accesible

## Puesta en marcha local

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno y completar DATABASE_URL
cp .env.example .env

# 3. Levantar PostgreSQL local con Docker
docker compose up -d

# 4. Aplicar migraciones
npx prisma migrate dev

# 5. Cargar catálogos base y la metodología GTC 45
npm run db:seed

# 6. Iniciar el servidor de desarrollo
npm run dev
```

La app queda disponible en `http://localhost:3000`. El seed crea un usuario
administrador (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` en `.env`, con
valores por defecto en `.env.example`).

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo (Turbopack) |
| `npm run build` / `npm start` | Build y arranque en producción |
| `npm run lint` | ESLint |
| `npm test` | Pruebas unitarias del motor de cálculo GTC 45 |
| `npm run db:migrate` | Crear/aplicar migraciones de Prisma |
| `npm run db:seed` | Cargar catálogos base y metodología GTC 45 |
| `npm run db:studio` | Prisma Studio (explorar la base de datos) |

## Estructura del proyecto

```
prisma/               Esquema, migraciones y seed (catálogos + metodología GTC 45)
src/app/               Rutas (App Router): auth, dashboard, matrices, wizard, configuración
src/components/        Componentes de UI, agrupados por dominio (wizard, dashboard, config, ...)
src/lib/risk-engine/    Motor de cálculo GTC 45 (única fuente de verdad para ND/NE/NP/NC/NR)
src/lib/export/         Generación de Excel y PDF
src/server/actions/     Server actions (mutaciones de datos, con auditoría)
```

## Nota sobre la metodología

Los valores de ND, NE, NC, NP y NR, así como el catálogo de peligros (Anexo A),
fueron verificados contra el documento oficial de la GTC 45 (ICONTEC, segunda
actualización, 2012-06-20). Son editables desde **Configuración → Metodología
GTC 45** por si tu organización necesita ajustarlos a una versión distinta.
