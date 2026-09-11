# Flujo de reserva — Mauro Acosta Gestión Nutricional

## Visión general

La reserva de turnos es un proceso público (sin login) que permite a nuevos pacientes agendar una primera consulta con Mauro Acosta. El flujo consta de 4 pasos para turnos online y 5 para turnos presenciales (se agrega la elección de sede).

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/reservar` | Selección de tipo de turno (presencial u online) |
| `/reservar/sede` | Selección de sede (solo turnos presenciales) |
| `/reservar/datos` | Formulario con datos personales del paciente |
| `/reservar/horario` | Selección de fecha y horario disponible |
| `/reservar/confirmacion` | Resumen y confirmación de la reserva |

## Flujo paso a paso

### 1. Tipo de turno (`/reservar`)

El paciente elige entre:
- **Presencial**: consulta en el consultorio. Continúa a la selección de sede.
- **Online**: consulta por videollamada. Salta directo a los datos personales.

### 2. Sede (`/reservar/sede`)

Solo para turnos presenciales:
- Se listan las sedes activas administradas desde `/dashboard/configuracion/sedes`.
- Cada sede muestra nombre y dirección.
- La sede elegida determina la disponibilidad horaria que se ofrece en el paso de horario.

### 3. Datos personales (`/reservar/datos`)

Formulario con:
- Nombre y apellido
- Email
- Teléfono
- Fecha de nacimiento (opcional)
- Observaciones (opcional)

### 4. Selección de horario (`/reservar/horario`)

- Se muestra un calendario con los días disponibles.
- La disponibilidad se obtiene de la tabla `availability` del profesional, filtrando por la sede elegida (o por modalidad online).
- Se muestran los slots disponibles según la `slotDuration` configurada.
- Se filtran horarios ocupados (turnos existentes con status `PENDING` o `CONFIRMED`).

### 5. Confirmación (`/reservar/confirmacion`)

Resumen con:
- Tipo de turno
- Sede (solo presencial)
- Datos del paciente
- Fecha y horario seleccionado
- Botón de confirmación

Al confirmar:
1. Se crea un registro en `Patient` (si es nuevo) o se usa uno existente.
2. Se crea un `Appointment` con status `PENDING`.
3. Se muestra confirmación con opción de volver al inicio.

## Tipos de turno

| Tipo | Enum | Descripción |
|------|------|-------------|
| Presencial | `IN_PERSON` | Consulta en el consultorio |
| Online | `ONLINE` | Consulta por videollamada |

## Estados del turno

| Estado | Descripción |
|--------|-------------|
| `PENDING` | Recién creado, esperando confirmación |
| `CONFIRMED` | Confirmado por el profesional |
| `COMPLETED` | Turno realizado |
| `CANCELLED` | Cancelado (con motivo) |
| `NO_SHOW` | Paciente no se presentó |
| `RESCHEDULED` | Reprogramado |

## Reglas de negocio

- No se permiten turnos en horarios pasados.
- Los turnos presenciales requieren elegir una sede activa.
- La disponibilidad se configura por separado para cada sede y para la modalidad online.
- No se permiten solapamientos de turnos para el mismo profesional (aunque sean en sedes distintas).
- La duración del slot es configurable por el profesional.
- Se valida la disponibilidad horaria configurada.
- Los turnos online pueden incluir un link de videollamada.

## Gestión de sedes

Desde `/dashboard/configuracion/sedes` (solo administradores) se puede:
- Crear, editar y eliminar sedes (nombre y dirección).
- Activar o desactivar sedes (las inactivas no se ofrecen al reservar).
- Una sede no se puede eliminar si tiene turnos o disponibilidad asociada.

## Gestión desde el dashboard profesional

Desde `/dashboard/turnos` el profesional puede:
- Ver lista de turnos con filtros por estado y fecha.
- Ver calendario mensual.
- Crear turnos manualmente.
- Confirmar, cancelar o reprogramar turnos.
- Marcar como completado o ausente.
- Configurar disponibilidad horaria.

## Gestión desde el portal del paciente

Desde `/paciente/dashboard/turnos` el paciente puede:
- Ver sus próximos turnos.
- Solicitar cancelación (con motivo).
- Solicitar reprogramación.
