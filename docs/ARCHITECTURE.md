# Arquitectura — Mauro Acosta Gestión Nutricional

## Visión general

Aplicación web fullstack construida con Next.js 15 (App Router) que combina una landing pública con un sistema privado de gestión nutricional.

## Estructura de directorios

```
app/
  layout.tsx              # Root layout (metadata Mauro Acosta, ThemeProvider)
  page.tsx                # Landing page pública
  globals.css             # Estilos globales + animaciones
  auth/login/             # Login profesional y paciente
  reservar/               # Reserva pública de turnos (4 pasos)
  dashboard/              # Panel profesional (protegido)
    page.tsx              # Dashboard principal
    pacientes/            # CRUD pacientes + sub-rutas
    turnos/               # Agenda, calendario, disponibilidad
    planes/               # Planes alimentarios + plantillas
    recetas/              # Recetas
    listas-compras/       # Listas de compras
    seguimiento/          # Seguimiento semanal
    cobros/               # Pagos
    gastos/               # Gastos
    reportes/             # Reportes
    users/                # Gestión de usuarios
    roles/                # Gestión de roles
    configuracion/        # Configuración (WhatsApp)
  paciente/               # Portal del paciente (protegido)
    login/                # Login paciente
    dashboard/            # Dashboard paciente
      turnos/             # Turnos del paciente
      plan/               # Plan alimentario activo
      seguimiento/        # Check-in semanal
      archivos/           # Archivos propios
components/
  ui/                     # Componentes base (shadcn/ui)
  patients/               # Pacientes
  medical-history/        # Historia clínica
  appointments/           # Turnos y disponibilidad
  progress/               # Mediciones y evolución
  nutrition-plans/        # Planes alimentarios + IA
  recipes/                # Recetas + IA
  shopping-lists/         # Listas de compras + IA
  followups/              # Seguimiento
  files/                  # Archivos
  consents/               # Consentimientos
  payments/               # Cobros
  expenses/               # Gastos
  reports/                # Reportes
  dashboard/              # Componentes del dashboard
  patient-portal/         # Componentes del portal paciente
  hero/                   # Hero de landing
lib/
  auth.ts                 # Autenticación, permisos, helpers de sesión
  prisma.ts               # Singleton de PrismaClient con adapter Pg
  cloudinary.ts           # Configuración y presets de Cloudinary
  utils.ts                # Utilidades generales (cn, etc.)
  ai/                     # Servicios de IA (OpenAI)
services/                 # Capa de servicios (lógica de negocio)
stores/                   # Zustand stores (plan-draft-store)
app/actions/              # Server Actions (todas las operaciones CRUD)
prisma/
  schema.prisma           # Schema de base de datos
  seed.ts                 # Seed de roles, permisos y usuario admin
  migrations/             # Migraciones SQL manuales
```

## Patrones clave

### Server Actions

Todas las operaciones de datos se implementan como Server Actions en `app/actions/*.ts`. Ningún componente consulta Prisma directamente.

Cada action:
1. Tiene `"use server"` al inicio.
2. Valida la sesión del usuario.
3. Valida permisos.
4. Valida los datos de entrada.
5. Llama a un servicio de la capa `services/`.
6. Revalida rutas cuando es necesario.

### Capa de servicios

Los servicios en `services/` encapsulan la lógica de negocio y consultas a Prisma. Separamos la lógica de las Server Actions para facilitar testing y reutilización.

### Autenticación

- JWT firmado con `jose`, almacenado en cookie `session_token`.
- `getCurrentUser()` usa React `cache()` para deduplicar llamadas a DB dentro del mismo request.
- `proxy.ts` (middleware) protege rutas `/dashboard` y `/paciente/dashboard`.
- Separación de sesiones: profesional vs. paciente (mismo modelo `User`, differentes roles).

### Base de datos

- PostgreSQL con Prisma ORM.
- Adapter `@prisma/adapter-pg` en lugar de PrismaClient estándar.
- `DATABASE_URL` para la app (via PgBouncer), `DIRECT_URL` para migraciones.
- Migraciones manuales (no `prisma migrate dev`) por limitaciones con Supabase/PgBouncer.

### UI

- Tailwind CSS para estilos.
- shadcn/ui (basado en Radix UI) para componentes.
- Tema claro/oscuro con `next-themes`.
- Framer Motion para animaciones de landing.
- Lenis para smooth scroll.

### Almacenamiento de archivos

Cloudinary para fotos de evolución, documentos, planes PDF, consentimientos, recibos e imágenes de recetas. Carpeta base: `mauro-acosta/`.

## Flujo de datos

```
Landing / Reserva pública
  └─> Server Actions → Services → Prisma → PostgreSQL

Dashboard profesional
  └─> Server Actions → Services → Prisma → PostgreSQL
  └─> Cloudinary (archivos)
  └─> OpenAI (generadores IA)

Portal paciente
  └─> Server Actions → Services → Prisma → PostgreSQL
  └─> Cloudinary (archivos con URLs firmadas)
```

## Seguridad

- Headers de seguridad: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy.
- Autenticación JWT con cookie httpOnly.
- Autorización por permisos en cada Server Action.
- Aislamiento de datos: pacientes solo ven sus propios datos.
- Soft delete para pacientes.
- URLs firmadas de Cloudinary para archivos privados.
- Consentimiento registrado para fotos de evolución.
