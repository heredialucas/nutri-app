# Mauro Acosta — Gestión Nutricional

Plataforma web de gestión nutricional para el consultorio de **Mauro Acosta**. Ofrece una landing pública de captación, reserva online de turnos y un sistema privado de gestión de pacientes, planes alimentarios, seguimiento y administración.

## Funcionalidades

### Landing y reserva pública

- Landing presentacional con servicios, testimonios y contacto.
- Reserva de turnos presenciales u online sin necesidad de cuenta.
- Selección de horario según disponibilidad del profesional.

### Panel profesional (`/dashboard`)

- **Pacientes**: CRUD, búsqueda, archivado, historia clínica completa.
- **Historia clínica**: antecedentes, alergias, medicación, objetivos.
- **Turnos y agenda**: lista, calendario mensual, disponibilidad horaria.
- **Mediciones**: peso, IMC (calculado en servidor), fotos de evolución, gráficos.
- **Planes alimentarios**: editor por días/comidas, generador con IA (OpenAI gpt-4o-mini), plantillas.
- **Recetas y listas de compras**: CRUD, generación con IA.
- **Seguimiento semanal**: check-in del paciente, adherencia, notas.
- **Archivos y consentimientos**: upload a Cloudinary, registro de consentimientos.
- **Cobros, gastos y reportes**: finanzas, reportes de pacientes, turnos, retención.
- **WhatsApp**: configuración de recordatorios y notificaciones.

### Portal del paciente (`/paciente`)

- Login separado con redirect por rol.
- Ver turnos, cancelar, solicitar reprogramación.
- Ver plan alimentario activo con días, comidas, recetas y listas de compras.
- Completar seguimiento semanal.
- Ver y descargar archivos propios.

## Tecnologías

- **Framework**: Next.js 15 (App Router) + React 19
- **Base de datos**: PostgreSQL con Prisma (`@prisma/adapter-pg`)
- **UI**: Tailwind CSS + shadcn/ui (Radix primitives)
- **Auth**: JWT (`jose`), cookie `session_token`
- **IA**: OpenAI SDK (`gpt-4o-mini`)
- **Archivos**: Cloudinary
- **Charts**: Recharts
- **Animaciones**: Framer Motion + Lenis (smooth scroll)
- **Estado**: Zustand (persist en localStorage)

## Instalación

```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd nutri-app

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus valores

# Generar cliente Prisma
pnpm prisma generate

# Ejecutar seed (roles, permisos y usuario admin)
pnpm prisma db seed

# Iniciar servidor de desarrollo
pnpm dev
```

## Variables de entorno

Las siguientes variables deben definirse en `.env.local`:

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | URL de conexión a PostgreSQL (via PgBouncer para la app) |
| `DIRECT_URL` | URL de conexión directa a PostgreSQL (para migraciones) |
| `JWT_SECRET` | Secreto para firmar tokens JWT |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Nombre del cloud de Cloudinary |
| `CLOUDINARY_API_KEY` | API key de Cloudinary |
| `CLOUDINARY_API_SECRET` | API secret de Cloudinary |
| `NEXT_PUBLIC_APP_URL` | URL base de la aplicación |
| `OPENAI_API_KEY` | API key de OpenAI (para generadores IA) |

> Nunca commitear `.env` o `.env.local`. Rotar credenciales si fueron expuestas.

## Base de datos

### Schema

El schema de Prisma está en `prisma/schema.prisma`. Incluye modelos de:

- Infraestructura de auth: `User`, `Role`, `Permission`, `UserRole`, `RolePermission`
- Pacientes: `Patient`, `MedicalHistory`, `Allergy`, `Medication`, `PatientGoal`
- Agenda: `Appointment`, `Availability`
- Mediciones: `AnthropometricMeasurement`, `ProgressPhoto`
- Nutrición: `NutritionPlan`, `NutritionPlanDay`, `Meal`, `MealFood`, `Recipe`, `ShoppingList`, `ShoppingListItem`
- Seguimiento: `FollowUp`
- Archivos: `PatientFile`, `Consent`
- Finanzas: `Payment`, `Expense`
- Comunicación: `MessageThread`, `Message`, `WaitlistEntry`
- Notificaciones: `WhatsAppSetting`, `NotificationLog`

### Migraciones

`prisma migrate dev` no funciona con Supabase/PgBouncer. Usar el workflow manual documentado en `AGENTS.md`.

```bash
# Generar diff SQL
pnpm migrate:create > /tmp/migration.sql

# Crear migración
TIMESTAMP=$(date -u +%Y%m%d%H%M%S)
mkdir -p prisma/migrations/${TIMESTAMP}_nombre_cambio
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script > prisma/migrations/${TIMESTAMP}_nombre_cambio/migration.sql

# Aplicar
pnpm prisma db execute --file prisma/migrations/${TIMESTAMP}_nombre_cambio/migration.sql

# Marcar como aplicada
pnpm prisma migrate resolve --applied ${TIMESTAMP}_nombre_cambio

# Verificar
pnpm prisma migrate status
```

## Cloudinary

Se usa para almacenar archivos de pacientes: fotos de evolución, documentos, planes en PDF, consentimientos, recibos de cobro e imágenes de recetas.

Carpeta base: `mauro-acosta/` con subcarpetas por tipo (`patients/`, `progress/`, `documents/`, etc.).

Ver `lib/cloudinary.ts` para los presets de upload configurados.

## Roles y permisos

| Rol | Descripción |
|-----|-------------|
| `ADMIN` | Acceso total a todas las funciones |
| `PROFESSIONAL` | Pacientes, turnos, historia clínica, planes, seguimiento, recetas |
| `ASSISTANT` | Pacientes y agenda con acceso clínico limitado (solo lectura) |
| `RECEPTION` | Turnos, datos básicos de pacientes y cobros |
| `PATIENT` | Únicamente sus propios datos (portal del paciente) |

Ver `docs/ROLES_AND_PERMISSIONS.md` para el detalle completo de permisos.

## Privacidad

- Los datos clínicos están protegidos por autenticación y autorización.
- Cada paciente solo puede ver sus propios datos.
- Las fotos de evolución requieren consentimiento registrado.
- Los archivos privados usan URLs firmadas de Cloudinary.
- Soft delete para pacientes (campo `deletedAt`).
- Ver `docs/PRIVACY.md` para más detalles.

## Despliegue

Ver `docs/DEPLOYMENT.md` para instrucciones de despliegue en Vercel y configuración de variables de entorno.

## Licencia

Uso privado — Consultorio de Mauro Acosta.
