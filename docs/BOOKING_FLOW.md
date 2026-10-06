# Flujo de reserva — Mauro Acosta Gestión Nutricional

## Visión general

La reserva de turnos es un proceso público (sin login). El paciente necesita
**DNI + nombre y apellido + celular** para reservar; el resto de los datos son
opcionales y se pueden completar después desde el portal del paciente.

El celular es obligatorio para poder volver a contactar al paciente (por WhatsApp)
si pierde acceso a la plataforma. El **tipo de cobertura (particular / obra social)
no se pregunta al paciente**: queda bajo control del profesional desde el dashboard.

El **DNI es el identificador de login**. Al reservar, el sistema aprovisiona una
cuenta de paciente automáticamente y deja la sesión iniciada, eliminando la fricción
de crear cuenta.

Hay dos puertas de entrada:

1. **Flujo guiado** `/reservar` (elegir tipo, sede, horario y datos).
2. **Chat por QR general** `/ingresar` (pensado para gimnasios/socios).

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/reservar` | Selección de tipo de turno (presencial u online) |
| `/reservar/sede` | Selección de sede (solo turnos presenciales) |
| `/reservar/horario` | Selección de fecha y horario disponible |
| `/reservar/datos` | Datos mínimos: DNI, nombre, apellido y celular (el resto es opcional) |
| `/reservar/confirmacion` | Resumen y reserva del turno |
| `/ingresar` | Chat guiado de intake (entrada por QR general) |

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
- **Celular (obligatorio)**

Dentro de "Agregar más datos (opcional)": email, fecha de nacimiento y
motivo de consulta. Si el paciente tiene sesión iniciada y sus datos ya están
completos, este paso se saltea automáticamente.

### 5. Reserva (`/reservar/confirmacion`)

Resumen y reserva. Al reservar:

1. Se busca la ficha `Patient` por DNI; si no existe, se crea con los datos mínimos
   (`billingType` queda en `particular` por defecto; el profesional lo ajusta luego).
2. Se crea el `Appointment` con estado `PENDING` (el paciente **reserva**, no confirma:
   la confirmación la hace el profesional desde el dashboard).
3. Se **aprovisiona la cuenta de paciente** (User con `dni`) si no existía, sin iniciar
   sesión: el paciente debe crear su contraseña (activación).
4. Se envía email de aviso al paciente (solo si cargó email) y aviso al consultorio.
   El paciente es contactado por **WhatsApp** al celular indicado.

## Entrada por QR (gimnasios)

Hay un **único QR general** descargable desde `/dashboard/configuracion/sedes` que
apunta a `/ingresar`. Se puede pegar en todas las sedes.

El chat guiado pide, en orden:
1. **Sucursal** (el paciente elige dónde quiere el turno; siempre presencial).
2. **DNI** (consulta el padrón externo por DNI — hoy sin conectar, ver
   `services/member-lookup-service.ts`; si devuelve datos, se prellenan).
3. Si el DNI ya tiene un **turno activo**, avisa y ofrece **cambiarlo** (reprogramar)
   o **mantenerlo**. Un DNI solo puede tener un turno activo a la vez.
4. **Nombre y apellido** (si no vinieron del padrón), en dos campos.
5. **Celular** (obligatorio, para contacto por WhatsApp).
6. **Fecha y horario** (slots reales, con la regla de 45 min de la primera consulta).
7. **Reserva**.

## Cuenta y activación

- **Identificador de login**: DNI, email o usuario (`authService.login`).
- `User.email` es opcional; `User.dni` es único.
- `Patient.documentNumber` (DNI) es **único** y se guarda normalizado (solo dígitos).
- Al reservar se aprovisiona la cuenta (`mustSetPassword=true`) pero **no se inicia
  sesión**: el paciente debe crear su contraseña.
- **Registro / activación** (`/auth/sign-up`):
  - **DNI nuevo**: nombre + contraseña, sin email.
  - **DNI con ficha o cuenta sin activar** (por ejemplo, creada al reservar): se
    precargan los datos y se crea la contraseña directamente, sin código por email.
  - **Cuenta ya activa**: se indica iniciar sesión.
- Post-reserva se emite una cookie `activation_token` (JWT 24 h) que permite crear la
  contraseña sin email para la cuenta recién creada en esa misma reserva.
- Acción `registerOrActivateAccount` (`app/actions/activation.ts`) cubre los tres casos.

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
- El DNI es obligatorio y único; el celular es obligatorio; el email es opcional.
- El tipo de cobertura (`billingType`) no lo elige el paciente: es interno del
  profesional.
- **Un DNI puede tener un solo turno activo** (`PENDING`/`CONFIRMED`/`RESCHEDULED`).
  Si intenta reservar otro, el sistema avisa y solo permite reemplazar el anterior
  cuando el paciente lo confirma (`replaceExisting`).

## Gestión de sedes

Desde `/dashboard/configuracion/sedes` (solo administradores) se puede crear, editar,
activar/desactivar y eliminar sedes, y **descargar el QR general de reserva** (uno solo
para todas las sedes; el paciente elige la sucursal en el chat).

## Gestión desde el dashboard profesional

El profesional de todos los turnos es siempre **Mauro Acosta** (el admin del sitio).
Desde `/dashboard/turnos` se puede ver la agenda, crear turnos manualmente, completar,
reprogramar, cancelar y configurar disponibilidad.

## Gestión desde el portal del paciente

Desde `/paciente/dashboard/turnos` el paciente puede ver sus próximos turnos, solicitar
cancelación (con motivo) y reprogramación. El resto de sus datos puede completarlos en
`/paciente/dashboard/perfil`.
