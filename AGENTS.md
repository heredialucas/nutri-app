# AGENTS.md

## Identidad obligatoria del proyecto

Este proyecto representa a **Mauro Acosta** y ofrece servicios de **Gestión nutricional** para pacientes y consultorios.

- La identidad pública, visual y comercial de toda la aplicación es **Mauro Acosta**.
- Mauro Acosta es la persona que representa la imagen de toda la aplicación.
- La landing debe presentar a Mauro Acosta y sus servicios nutricionales.
- La expresión “Gestión nutricional” debe conservarse como descriptor principal.
- No usar en la interfaz textos, marcas o referencias del sistema anterior ni ninguna marca alternativa a Mauro Acosta.
- No usar datos personales, proyectos, curriculum ni experiencia profesional de Lucas Heredia en la landing.
- El texto “Desarrollado por Heredia Lucas” debe eliminarse de la landing y de la documentación pública.
- El contenido de `lucas-portfolio` puede reutilizarse únicamente como referencia visual, estructura de componentes y patrón de animaciones; nunca se debe copiar su identidad o contenido profesional.

El plan completo de transformación está documentado en `docs/MAURO_ACOSTA_PLAN_DE_IMPLEMENTACION.md`. Ese documento debe seguirse fase por fase y no se deben saltar las verificaciones indicadas.

## Commands

```bash
pnpm dev                # Start dev server
pnpm build              # Run prisma generate + next build (order matters)
pnpm migrate:create     # Generate migration SQL diff (see Prisma workflow below)
```

No test suite configured.

## IMPORTANT: Never do these

- **NEVER run `prisma db push --force-reset`** - This wipes all data from the database
- **NEVER run `pnpm lint`** - It times out and is not needed
- **NEVER run `prisma migrate dev`** - Shadow DB creation fails with Supabase/PgBouncer
- **NEVER run `prisma migrate resolve` on existing migrations** unless you understand the full migration history state
- Only run `pnpm build` to verify no errors

## Architecture

- **Framework:** Next.js 15 (App Router) + React 19
- **Database:** PostgreSQL via Prisma with `@prisma/adapter-pg` (not standard PrismaClient)
- **UI:** Tailwind CSS + shadcn/ui (Radix primitives)
- **Auth:** JWT (`jose`), session stored in `session_token` cookie

### Key Patterns

- **Server Actions:** All in `app/actions/*.ts` (not API routes)
- **DB Client:** Singleton in `lib/prisma.ts` with adapter pattern
- **User Query:** `getCurrentUser()` uses React `cache()` for request deduplication
- **Route Protection:** Middleware via `proxy.ts` redirects unauthenticated requests to `/auth/login`

## Prisma Migration Workflow

`prisma migrate dev` is **broken** because Supabase/PgBouncer doesn't allow creating shadow databases. Use this manual workflow instead:

### 1. Generate migration SQL diff
```bash
pnpm migrate:create > /tmp/migration.sql
```

Review the SQL to make sure it's correct. The output may include pnpm banner lines — strip those (actual SQL starts after them).

### 2. Create migration directory and SQL file
```bash
MIGRATION_NAME="describe_the_change"
TIMESTAMP=$(date -u +%Y%m%d%H%M%S)
mkdir -p prisma/migrations/${TIMESTAMP}_${MIGRATION_NAME}
# Use direct prisma command to avoid pnpm shell noise in the SQL file
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script > prisma/migrations/${TIMESTAMP}_${MIGRATION_NAME}/migration.sql
```

### 3. Apply the migration
```bash
pnpm prisma db execute --file prisma/migrations/<TIMESTAMP>_<NAME>/migration.sql
```

### 4. Mark as applied in `_prisma_migrations`
```bash
pnpm prisma migrate resolve --applied <TIMESTAMP>_<NAME>
```

### 5. Regenerate Prisma client
```bash
pnpm prisma generate
```

### 6. Verify
```bash
pnpm prisma migrate status
```

### Important notes

- **Only use this workflow for NEW migrations.** Never use `prisma migrate resolve` on existing migrations — that was the mistake that broke the tracking.
- The `_prisma_migrations` table must contain ALL prior migrations. If it doesn't, mark them all as applied with `prisma migrate resolve --applied <name>` for each one.
- Migration names come from the directory names under `prisma/migrations/` (e.g., `20251206024958_init_migration`).
- Always verify with `pnpm prisma migrate status` afterward — it should say "Database schema is up to date!".
- For simple enum-only changes, `pnpm prisma db execute --stdin <<< "ALTER TYPE ... ADD VALUE ..."` is sufficient, but still create a migration SQL file for tracking.

## Database Schema

La base objetivo es la de Mauro Acosta. Se deben conservar como infraestructura los modelos de autenticación `User`, `Role`, `Permission`, `UserRole` y `RolePermission`, y reemplazar los modelos de inventario por pacientes, turnos, historia clínica, mediciones, planes alimentarios, seguimientos, archivos, consentimientos, cobros, gastos y reportes.

No modificar ni eliminar tablas de producción sin revisar primero los datos existentes, crear respaldo y preparar una migración explícita. La especificación detallada del modelo objetivo está en `docs/MAURO_ACOSTA_PLAN_DE_IMPLEMENTACION.md`.

## Env Requirements

```
DATABASE_URL   # App connection (via PgBouncer)
DIRECT_URL     # Migrations (direct PostgreSQL)
JWT_SECRET     # Auth signing
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
NEXT_PUBLIC_APP_URL
OPENAI_API_KEY # OpenAI gpt-4o-mini for AI generators
```

Los archivos `.env` y `.env.local` nunca se deben commitear. Las credenciales proporcionadas durante la planificación quedaron expuestas y deben rotarse antes de usar el proyecto en producción, especialmente la contraseña de PostgreSQL, el secreto de Cloudinary y cualquier secreto JWT.

## Documentation

- `docs/MAURO_ACOSTA_PLAN_DE_IMPLEMENTACION.md` - plan operativo detallado por fases y archivos
- `README.md` - documentación pública de Mauro Acosta
- `docs/ARCHITECTURE.md` - arquitectura de la aplicación
- `docs/DATABASE.md` - modelo de datos nutricional
- `docs/ROLES_AND_PERMISSIONS.md` - roles y permisos
- `docs/BOOKING_FLOW.md` - flujo de reserva de turnos
- `docs/PRIVACY.md` - privacidad y datos clínicos
- `docs/DEPLOYMENT.md` - despliegue y variables de entorno

Los documentos `sistema_gestion_stock.md`, `NEW_STRUCTURE.md` y `EXPLICACION_SCHEMAS.md` son documentación histórica del sistema anterior y deben reemplazarse o archivarse cuando termine la migración.

## Quirks

- `npm run build` runs `prisma generate` first; don't run just `next build`
- Prisma adapter requires `DIRECT_URL` for migrations, separate from app `DATABASE_URL`
- No TypeScript strict mode; ESLint extends `next/core-web-vitals` + `next/typescript`
- Always run `pnpm prisma generate` after modifying schema.prisma

## Progreso de implementación

### Completado

- **Fase 1 — Seguridad y variables de entorno:** `.gitignore`, `lib/cloudinary.ts` (presets nutricionales), `next.config.ts` verificado, defaults de presets actualizados en actions y services.
- **Fase 2 — Rebranding:** `app/layout.tsx` (metadata Mauro Acosta), `app/page.tsx` (renderiza LandingPage), `components/hero.tsx` eliminado (era DMCE), todos los textos del sistema anterior eliminados.
- **Fase 3 — Adaptación visual:** Hero cinematográfico con imagen de fondo, header flotante con glass morphism, menú móvil con curva SVG, loading intro, smooth scroll con Lenis, `globals.css` con animaciones. Dependencias `framer-motion` y `lenis` instaladas. Imagen `tritri.png` copiada como `public/images/hero-mauro.jpg`.
- **Fase 4 — Landing completa y reserva pública:**
  - Landing: Header, Hero, Servicios, Cómo trabajo, Beneficios, Testimonios, CTA Reserva, Contacto, Footer.
  - Reserva: `/reservar` (Presencial/Online), `/reservar/datos`, `/reservar/horario`, `/reservar/confirmacion`.
  - Tipos de turno simplificados a `IN_PERSON` y `ONLINE`.
  - Smooth scroll con `lenis.scrollTo()`.
  - Datos de contacto: WhatsApp `+54 9 3816 70-9189`, ubicación `San Miguel de Tucumán, Tucumán`.
- **Fase 5:** ✅ Nuevo modelo Prisma (schema actualizado, pendiente migración DB)
- **Fase 6:** ✅ Migración de base de datos (schema → SQL → execute → verify)
- **Fase 7:** ✅ Seed, roles y permisos nutricionales
- **Fase 8:** ✅ Autenticación y autorización (lib/auth.ts extendido, proxy.ts protege /paciente/dashboard)
- **Fase 9:** ✅ Servicios y Server Actions nutricionales (18 services + 17 actions)
- **Fase 10:** ✅ Layout privado y navegación del dashboard (sidebar nutricional, mobile nav, metadata)
- **Fase 11:** ✅ Dashboard (turnos de hoy, pacientes activos, ingresos, alertas de seguimiento)
- **Fase 12:** ✅ Pacientes (CRUD, búsqueda, archivado, formulario completo)
- **Fase 13:** ✅ Historia clínica (antecedentes, alergias, medicación, objetivos)
- **Fase 14:** ✅ Turnos y agenda (lista, calendario mensual, disponibilidad horaria)
- **Fase 15:** ✅ Mediciones y evolución (IMC server-side, fotos, gráficos)
- **Fase 16:** ✅ Planes alimentarios (editor, días, comidas, PDF)
- **Fase 17:** ✅ Generadores IA (planes, recetas, listas de compras con OpenAI gpt-4o-mini)
- **Fase 18:** ✅ Recetas y listas de compras (CRUD recetas, listas de compras)
- **Fase 19:** ✅ Persistencia de estado del plan con zustand (localStorage, persist middleware)
- **Fase 20:** ✅ Archivos, fotos y consentimientos (Cloudinary) — file-upload, file-list, file-preview, consent-form, consent-history, páginas archivos y consentimientos, navegación desde detalle del paciente
- **Fase 21:** ✅ Seguimiento semanal (followup-list, followup-form, adherence-field, followup-summary, ruta por paciente, botón de navegación)
- **Fase 22:** ✅ Cobros, gastos y reportes (payment-list, payment-form, cash-summary, expense-list, expense-form, revenue-report, patients-report, appointments-report, retention-report)
- **Fase 23:** ✅ Portal del paciente (`/paciente/`) — login con redirect por rol, patient-nav (desktop sidebar + mobile bottom nav), dashboard mejorado con stats, turnos con cancelación, plan activo con días/comidas/recetas/listas de compras/tips, seguimiento semanal con check-in, archivos, patient→user link via `userId` FK
- **Fase 24:** ✅ Automatizaciones y recordatorios
- **Fase 25:** ✅ Eliminación del sistema anterior (92 archivos eliminados: 32 rutas dashboard, 34 componentes, 11 acciones, 12 servicios, 3 docs)
- **Fase 26:** ✅ Documentación final (README.md, ARCHITECTURE.md, DATABASE.md, ROLES_AND_PERMISSIONS.md, BOOKING_FLOW.md, PRIVACY.md, DEPLOYMENT.md)
- **Fase 27:** ✅ Verificación final obligatoria

### Pendiente

Ninguna. Todas las fases completadas.
