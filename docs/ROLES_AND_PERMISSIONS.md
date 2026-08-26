# Roles y permisos — Mauro Acosta Gestión Nutricional

## Sistema RBAC

La aplicación utiliza un sistema de control de acceso basado en roles (RBAC) con tres tablas: `roles`, `permissions` y `role_permissions`.

## Roles

| Rol | Descripción |
|-----|-------------|
| `ADMIN` | Acceso total a todas las funciones del sistema |
| `PROFESSIONAL` | Profesional nutricional: pacientes, turnos, historia clínica, planes, seguimiento, recetas |
| `ASSISTANT` | Asistente: pacientes y agenda con acceso clínico limitado (solo lectura) |
| `RECEPTION` | Recepción: turnos, datos básicos de pacientes y cobros |
| `PATIENT` | Paciente: únicamente sus propios datos (portal del paciente) |

## Permisos

### Dashboard

| Permiso | Descripción |
|---------|-------------|
| `dashboard:view` | Ver panel principal |

### Pacientes

| Permiso | Descripción |
|---------|-------------|
| `patients:read` | Ver lista de pacientes |
| `patients:create` | Crear pacientes |
| `patients:update` | Editar pacientes |
| `patients:delete` | Archivar pacientes |

### Historia clínica

| Permiso | Descripción |
|---------|-------------|
| `medical_history:read` | Ver historia clínica |
| `medical_history:update` | Editar historia clínica, alergias, medicación y objetivos |

### Turnos

| Permiso | Descripción |
|---------|-------------|
| `appointments:read` | Ver turnos y agenda |
| `appointments:create` | Crear turnos |
| `appointments:update` | Confirmar, cancelar y reprogramar turnos |

### Disponibilidad

| Permiso | Descripción |
|---------|-------------|
| `availability:read` | Ver disponibilidad horaria |
| `availability:manage` | Configurar disponibilidad horaria |

### Mediciones

| Permiso | Descripción |
|---------|-------------|
| `measurements:read` | Ver mediciones antropométricas |
| `measurements:create` | Cargar mediciones |
| `measurements:update` | Editar mediciones |
| `measurements:delete` | Eliminar mediciones |

### Planes alimentarios

| Permiso | Descripción |
|---------|-------------|
| `plans:read` | Ver planes alimentarios |
| `plans:create` | Crear planes alimentarios |
| `plans:update` | Editar planes alimentarios |
| `plans:delete` | Eliminar planes alimentarios |

### Recetas

| Permiso | Descripción |
|---------|-------------|
| `recipes:read` | Ver recetas |
| `recipes:create` | Crear recetas |
| `recipes:update` | Editar recetas |
| `recipes:delete` | Eliminar recetas |

### Seguimiento

| Permiso | Descripción |
|---------|-------------|
| `followups:read` | Ver seguimientos semanales |
| `followups:create` | Crear seguimientos |
| `followups:update` | Responder seguimientos |
| `followups:delete` | Eliminar seguimientos |

### Archivos y consentimientos

| Permiso | Descripción |
|---------|-------------|
| `files:read` | Ver archivos de pacientes |
| `files:manage` | Subir y eliminar archivos |
| `consents:read` | Ver consentimientos |
| `consents:update` | Registrar consentimientos |

### Finanzas

| Permiso | Descripción |
|---------|-------------|
| `payments:read` | Ver cobros |
| `payments:create` | Registrar cobros |
| `payments:update` | Editar cobros |
| `payments:delete` | Eliminar cobros |
| `expenses:read` | Ver gastos |
| `expenses:create` | Registrar gastos |
| `expenses:update` | Editar gastos |
| `expenses:delete` | Eliminar gastos |

### Reportes

| Permiso | Descripción |
|---------|-------------|
| `reports:read` | Ver reportes y estadísticas |

### Comunicación

| Permiso | Descripción |
|---------|-------------|
| `messages:read` | Ver mensajes de pacientes |
| `messages:send` | Enviar y gestionar mensajes |

### Configuración

| Permiso | Descripción |
|---------|-------------|
| `users:read` | Ver usuarios del sistema |
| `users:manage` | Gestionar usuarios, roles y permisos |
| `settings:manage` | Configurar datos del consultorio |

## Matriz de asignación

| Permiso | ADMIN | PROFESSIONAL | ASSISTANT | RECEPTION | PATIENT |
|---------|:-----:|:------------:|:---------:|:---------:|:-------:|
| `dashboard:view` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `patients:read` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `patients:create` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `patients:update` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `patients:delete` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `medical_history:read` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `medical_history:update` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `appointments:read` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `appointments:create` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `appointments:update` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `availability:read` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `availability:manage` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `measurements:read` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `measurements:create` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `measurements:update` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `measurements:delete` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `plans:read` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `plans:create` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `plans:update` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `plans:delete` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `recipes:read` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `recipes:create` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `recipes:update` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `recipes:delete` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `followups:read` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `followups:create` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `followups:update` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `followups:delete` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `files:read` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `files:manage` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `consents:read` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `consents:update` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `payments:read` | ✅ | ✅ | ❌ | ✅ | ❌ |
| `payments:create` | ✅ | ❌ | ❌ | ✅ | ❌ |
| `payments:update` | ✅ | ❌ | ❌ | ✅ | ❌ |
| `payments:delete` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `expenses:read` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `expenses:create` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `expenses:update` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `expenses:delete` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `reports:read` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `messages:read` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `messages:send` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `users:read` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `users:manage` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `settings:manage` | ✅ | ❌ | ❌ | ❌ | ❌ |

## Portal del paciente

El rol `PATIENT` se asigna a usuarios que acceden al portal del paciente (`/paciente`). La verificación de acceso se realiza en `lib/auth.ts`:

- `isPatientUser()` verifica si el usuario tiene el rol `PATIENT`.
- `isProfessionalUser()` verifica roles ADMIN, PROFESSIONAL, ASSISTANT o RECEPTION.
- `requirePatientAccess()` asegura que un paciente solo acceda a sus propios datos.
- `requireProfessionalAccess()` redirige pacientes a su portal.

## Implementación

Los permisos se verifican en dos niveles:

1. **UI**: El sidebar oculta rutas según permisos del usuario.
2. **Servidor**: Cada Server Action valida permisos con `requirePermission()` antes de ejecutar operaciones.

```typescript
// Ejemplo de verificación en Server Action
const user = await getCurrentUser();
requirePermission(user, "patients:create");
```
