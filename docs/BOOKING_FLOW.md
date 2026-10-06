# Flujo de reserva — Mauro Acosta Gestión Nutricional

## Visión general

La reserva de turnos es un proceso público (sin login). El paciente solo necesita
**DNI + nombre y apellido** para reservar; el resto de los datos son opcionales y
se pueden completar después desde el portal del paciente.

El **DNI es el identificador de login**. Al reservar, el sistema aprovisiona una
cuenta de paciente automáticamente y deja la sesión iniciada, eliminando la fricción
de crear cuenta.

Hay dos puertas de entrada:

1. **Flujo guiado** `/reservar` (elegir tipo, sede, horario y datos).
2. **Chat por QR** `/ingresar?loc=<idSede>` (pensado para gimnasios/socios).

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/reservar` | Selección de tipo de turno (presencial u online) |
| `/reservar/sede` | Selección de sede (solo turnos presenciales) |
| `/reservar/horario` | Selección de fecha y horario disponible |
| `/reservar/datos` | Datos mínimos: DNI, nombre y apellido (el resto es opcional) |
| `/reservar/confirmacion` | Resumen y confirmación de la reserva |
| `/ingresar?loc=<idSede>` | Chat guiado de intake (entrada por QR) |

## Flujo paso a paso

### 1. Tipo de turno (`/reservar`)

El paciente elige entre:
- **Presencial**: continúa a la selección de sede.
- **Online**: salta directo a la selección de horario.

### 2. Sede (`/reservar/sede`)

Solo para turnos presenciales:
- Se listan las sedes activas administradas desde `/dashboard/configuracion/sedes`.
- La sede elegida determina la disponibilidad horaria del paso siguiente.

### 3. Selección de horario (`/reservar/horario`)

- Se muestra un calendario con los días disponibles.
- La disponibilidad se obtiene de la tabla `availability`, filtrando por sede (o por
  modalidad online).
- **La primera consulta de un paciente dura 45 minutos** y reserva ese bloque completo.
- La primera consulta se detecta por DNI (o por el paciente con sesión iniciada).

### 4. Datos mínimos (`/reservar/datos`)

Formulario con:
- **DNI (obligatorio)**
- **Nombre (obligatorio)**
- **Apellido (obligatorio)**

Dentro de "Agregar más datos (opcional)": email, teléfono, fecha de nacimiento y
motivo de consulta. Si el paciente tiene sesión iniciada y sus datos ya están
completos, este paso se saltea automáticamente.

### 5. Confirmación (`/reservar/confirmacion`)

Resumen y confirmación. Al confirmar:

1. Se busca la ficha `Patient` por DNI; si no existe, se crea con los datos mínimos.
2. Se crea el `Appointment` con estado `PENDING`.
3. Se **aprovisiona la cuenta de paciente** (User con `dni`) si no existía y se inicia
   sesión automáticamente.
4. Se envía email de confirmación al paciente (solo si cargó email) y aviso al
   consultorio.

## Entrada por QR (gimnasios)

Cada sede tiene un QR descargable desde `/dashboard/configuracion/sedes` que apunta a
`/ingresar?loc=<idSede>`.

El chat guiado pide, en orden:
1. **DNI** (consulta el padrón externo por DNI — hoy sin conectar, ver
   `services/member-lookup-service.ts`; si devuelve datos, se prellenan).
2. Si el DNI ya tiene un **turno activo**, avisa y ofrece **cambiarlo** (reprogramar)
   o **mantenerlo**. Un DNI solo puede tener un turno activo a la vez.
3. **Nombre y apellido** (si no vinieron del padrón), en dos campos.
4. **Fecha y horario** (slots reales, con la regla de 45 min de la primera consulta).
5. **Confirmación**.

Como el QR identifica la sede, la modalidad viene preseleccionada como presencial en
esa sede. Sin `?loc=`, el chat permite elegir modalidad y sede.

## Cuenta y activación

- **Identificador de login**: DNI, email o usuario (`authService.login`).
- `User.email` es opcional; `User.dni` es único.
- `Patient.documentNumber` (DNI) es **único** y se guarda normalizado (solo dígitos).
- Al reservar se aprovisiona la cuenta (`mustSetPassword=true`) pero **no se inicia
  sesión**: el paciente debe crear su contraseña.
- **Activación** (`/auth/sign-up`):
  - **DNI nuevo**: nombre + contraseña, sin email.
  - **DNI ya existente sin activar**: se verifica identidad con un **código por email**
    (al email de la ficha; si no hay, se pide uno) y luego se crea la contraseña.
  - **Cuenta ya activa**: se indica iniciar sesión.
- Post-reserva se emite una cookie `activation_token` (JWT 24 h) que permite crear la
  contraseña sin email para la cuenta recién creada en esa misma reserva.
- Códigos de email en `email_verification_codes` (hash sha256, 10 min, máx. 5 intentos).

## Tipos de turno

| Tipo | Enum | Descripción |
|------|------|-------------|
| Presencial | `IN_PERSON` | Consulta en el consultorio/sede |
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
- No se permiten solapamientos de turnos para el mismo profesional.
- La primera consulta dura 45 minutos; el resto usa la `slotDuration` del bloque.
- El DNI es obligatorio y único; el email es opcional.
- **Un DNI puede tener un solo turno activo** (`PENDING`/`CONFIRMED`/`RESCHEDULED`).
  Si intenta reservar otro, el sistema avisa y solo permite reemplazar el anterior
  cuando el paciente lo confirma (`replaceExisting`).

## Gestión de sedes

Desde `/dashboard/configuracion/sedes` (solo administradores) se puede crear, editar,
activar/desactivar y eliminar sedes, y **descargar el QR de reserva** de cada una.

## Gestión desde el dashboard profesional

El profesional de todos los turnos es siempre **Mauro Acosta** (el admin del sitio).
Desde `/dashboard/turnos` se puede ver la agenda, crear turnos manualmente, completar,
reprogramar, cancelar y configurar disponibilidad.

## Gestión desde el portal del paciente

Desde `/paciente/dashboard/turnos` el paciente puede ver sus próximos turnos, solicitar
cancelación (con motivo) y reprogramación. El resto de sus datos puede completarlos en
`/paciente/dashboard/perfil`.
