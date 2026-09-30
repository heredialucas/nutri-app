# Despliegue — Mauro Acosta Gestión Nutricional

## Plataforma recomendada

Vercel (compatible con Next.js App Router).

## Requisitos previos

- Node.js 18+
- pnpm 10+
- Base de datos PostgreSQL (Supabase, Neon o similar)
- Cuenta de Cloudinary
- API key de OpenAI (opcional, para generadores IA)

## Variables de entorno

Configurar en el panel de Vercel (Settings → Environment Variables):

| Variable | Valor | Entorno |
|----------|-------|---------|
| `DATABASE_URL` | URL con PgBouncer (transaction mode) | Production, Preview |
| `DIRECT_URL` | URL directa a PostgreSQL (sin PgBouncer) | Production, Preview |
| `JWT_SECRET` | Secreto aleatorio de al menos 32 caracteres | Production, Preview |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Nombre del cloud | Production, Preview |
| `CLOUDINARY_API_KEY` | API key | Production, Preview |
| `CLOUDINARY_API_SECRET` | API secret | Production, Preview |
| `NEXT_PUBLIC_APP_URL` | URL de producción (ej: `https://tu-dominio.vercel.app`) | Production |
| `OPENAI_API_KEY` | API key de OpenAI | Production, Preview |
| `RESEND_API_KEY` | API key de Resend para recuperación de contraseña y notificaciones | Production, Preview |
| `RESEND_FROM_EMAIL` | Remitente verificado, ej. `Mauro Acosta <no-reply@tu-dominio.com>` | Production, Preview |
| `NOTIFICATION_EMAIL` | Buzón donde llegan TODAS las notificaciones (`nutricionmauroacosta@gmail.com`) | Production, Preview |
| `CRON_SECRET` | Secreto para autenticar el endpoint de recordatorios `/api/cron/notifications` | Production |

### DATABASE_URL vs DIRECT_URL

- `DATABASE_URL`: conexión via PgBouncer (transaction pooling). Para la aplicación.
- `DIRECT_URL`: conexión directa a PostgreSQL. Para migraciones Prisma.

En Supabase: `DIRECT_URL` usa el puerto 5432, `DATABASE_URL` usa el puerto 6543 (PgBouncer).

## Build

```bash
pnpm build
```

Esto ejecuta `prisma generate` seguido de `next build`.

## Despliegue en Vercel

### Configuración del proyecto

1. Conectar el repositorio de GitHub.
2. Framework: Next.js.
3. Build command: `pnpm build`.
4. Install command: `pnpm install`.
5. Node.js version: 18+.

### Branches

- `main`: producción.
- Pull requests: preview deployments automáticos.

## Despliegue manual

```bash
# Instalar dependencias
pnpm install

# Generar Prisma Client
pnpm prisma generate

# Build
pnpm build

# Iniciar
pnpm start
```

## Migraciones de base de datos

No ejecutar `prisma migrate dev` en producción. Usar el workflow manual documentado en `AGENTS.md`:

```bash
# Generar SQL diff
pnpm migrate:create > /tmp/migration.sql

# Crear directorio de migración
TIMESTAMP=$(date -u +%Y%m%d%H%M%S)
mkdir -p prisma/migrations/${TIMESTAMP}_nombre
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script > prisma/migrations/${TIMESTAMP}_nombre/migration.sql

# Aplicar
pnpm prisma db execute --file prisma/migrations/${TIMESTAMP}_nombre/migration.sql

# Marcar como aplicada
pnpm prisma migrate resolve --applied ${TIMESTAMP}_nombre
```

## Seed inicial

```bash
pnpm prisma db seed
```

Esto crea:
- Todos los permisos del sistema.
- Los 5 roles (ADMIN, PROFESSIONAL, ASSISTANT, RECEPTION, PATIENT).
- Asignación de permisos a cada rol.
- Usuario admin: `admin@mauroacosta.com` / `admin123`.

> Cambiar la contraseña del admin después del primer inicio de sesión.

## Seguridad en producción

- Cambiar `JWT_SECRET` a un valor aleatorio seguro.
- Cambiar contraseña del usuario admin.
- Verificar que `.env` y `.env.local` no estén en el repositorio.
- Rotar credenciales si fueron expuestas durante desarrollo.
- Configurar dominio personalizado en Vercel.

## Despliegue en VPS (auto-hospedado)

El proyecto se despliega en la VPS con PM2 + Nginx. El script `scripts/deploy.sh`
automatiza el flujo (pull/build/restart) y `scripts/setup-vps.sh` prepara el
servidor por primera vez.

```bash
# En la VPS, desde el directorio de la app
bash scripts/deploy.sh
```

### Recordatorios por WhatsApp vía cron

Los recordatorios de WhatsApp se ejecutan con un cron en la VPS que llama al
endpoint protegido:

```bash
# crontab -e  (ejecuta cada hora en punto)
0 * * * * curl -fsS -X POST -H "x-cron-secret: $CRON_SECRET" https://tu-dominio.com/api/cron/notifications > /dev/null 2>&1
```

El endpoint `/api/cron/notifications` requiere el header `x-cron-secret`
(o `Authorization: Bearer <CRON_SECRET>`) y recorre todos los usuarios con
WhatsApp habilitado enviando los recordatorios correspondientes del día.

## Notificaciones por email

- Los eventos (turno reservado, reprogramado, cancelado y seguimiento semanal)
  envían un email automático a `NOTIFICATION_EMAIL`.
- El envío usa Resend (`RESEND_API_KEY` + `RESEND_FROM_EMAIL`) y nunca interrumpe
  el flujo de negocio si falla.
- La recuperación de contraseña también usa Resend.

## Comandos útiles

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción (prisma generate + next build) |
| `pnpm start` | Iniciar servidor de producción |
| `pnpm prisma generate` | Regenerar Prisma Client |
| `pnpm prisma migrate status` | Estado de migraciones |
| `pnpm prisma db seed` | Ejecutar seed |
| `pnpm migrate:create` | Generar diff SQL de migración |

## Comandos prohibidos

| Comando | Razón |
|---------|-------|
| `pnpm lint` | Tiempo de espera excesivo |
| `prisma migrate dev` | Falla con Supabase/PgBouncer (sin shadow DB) |
| `prisma db push --force-reset` | Borra todos los datos |
