# Modelo de datos — Mauro Acosta Gestión Nutricional

## Visión general

Base de datos PostgreSQL con 28 modelos (incluidos los legacy del sistema anterior que pendientes de eliminación). Los modelos activos se organizan en dominios: autenticación, pacientes, agenda, mediciones, nutrición, seguimiento, archivos, finanzas y comunicación.

## Modelos de autenticación

### User

Usuario del sistema (profesionales, asistentes, recepción y pacientes vinculados).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| email | String | Email único |
| password | String | Hash bcrypt |
| fullName | String? | Nombre completo |
| firstName / lastName | String? | Nombre y apellido |
| username | String? | Nombre de usuario único |
| isActive | Boolean | Si el usuario está activo |

### Role / Permission / UserRole / RolePermission

Sistema RBAC (Role-Based Access Control). Los roles se asignan a usuarios through `UserRole`, y los permisos a roles through `RolePermission`.

## Modelos de pacientes

### Patient

Registro principal de cada paciente.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| userId | UUID? | FK a User (para portal del paciente) |
| firstName / lastName | String | Nombre y apellido |
| email / phone | String? | Datos de contacto |
| birthDate | DateTime? | Fecha de nacimiento |
| documentNumber | String? | DNI u otro documento |
| address / city | String? | Ubicación |
| billingType | String | Tipo de facturación |
| status | String | ACTIVE / INACTIVE / ARCHIVED |
| deletedAt | DateTime? | Soft delete |

### MedicalHistory

Historia clínica del paciente (1:1 con Patient).

Campos: `familyHistory`, `personalHistory`, `surgeries`, `diagnoses`, `habits`, `sleepHours`, `physicalActivity`, `digestiveSymptoms`, `observations`.

### Allergy

Alergias del paciente (1:N). Campos: `name`, `reaction`, `severity`, `notes`.

### Medication

Medicación actual o pasada (1:N). Campos: `name`, `dosage`, `frequency`, `indication`, `startDate`, `endDate`, `notes`.

### PatientGoal

Objetivos del paciente (1:N). Campos: `type`, `description`, `targetValue`, `targetDate`, `status`, `completedAt`.

## Modelos de agenda

### Appointment

Turno entre paciente y profesional.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| type | Enum | `ONLINE` o `IN_PERSON` |
| status | Enum | `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`, `RESCHEDULED` |
| startAt / endAt | DateTime | Horario del turno |
| meetingUrl | String? | Link de videollamada (online) |
| cancellationReason | String? | Motivo de cancelación |

### Availability

Horarios disponibles del profesional. Campos: `weekday` (0-6), `startTime`, `endTime`, `slotDuration` (minutos), `isActive`.

## Modelos de mediciones

### AnthropometricMeasurement

Mediciones antropométricas del paciente.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| weight | Decimal? | Peso en kg |
| height | Decimal? | Altura en cm |
| bmi | Decimal? | IMC (calculado en servidor) |
| waist / hip / arm | Decimal? | Perímetros en cm |
| bodyFatPercentage | Decimal? | % grasa corporal |
| muscleMass | Decimal? | Masa muscular en kg |

### ProgressPhoto

Fotos de evolución. Requieren `consentGranted`. Almacenadas en Cloudinary.

## Modelos de nutrición

### NutritionPlan

Plan alimentario. Estados: `DRAFT`, `PUBLISHED`, `ARCHIVED`.

Jerarquía: `NutritionPlan` → `NutritionPlanDay` → `Meal` → `MealFood`.

| Campo | Descripción |
|-------|-------------|
| calorieTarget | Objetivo calórico diario |
| status | DRAFT / PUBLISHED / ARCHIVED |
| pdfUrl | URL del PDF generado |

### Recipe

Receta creada por el profesional. Campos: `title`, `description`, `ingredients`, `instructions`, `imageUrl`.

### ShoppingList / ShoppingListItem

Lista de compras asociada a un paciente y/o plan alimentario.

## Modelos de seguimiento

### FollowUp

Check-in semanal del paciente.

| Campo | Descripción |
|-------|-------------|
| weekStart | Fecha de inicio de semana |
| weight | Peso semanal |
| adherence | Nivel de adherencia al plan |
| hunger / energy | Escala subjetiva |
| difficulties | Dificultades encontradas |
| patientNotes | Notas del paciente |
| proNotes | Notas del profesional |

## Modelos de archivos

### PatientFile

Archivo subido a Cloudinary. Campos: `name`, `url`, `publicId`, `mimeType`, `size`, `category`.

### Consent

Consentimiento registrado. Campos: `type`, `version`, `signedAt`, `signature`, `ipAddress`, `documentUrl`.

## Modelos de finanzas

### Payment

Cobro registrado. Campos: `amount` (Decimal), `method`, `description`, `date`, `notes`.

### Expense

Gasto del consultorio. Campos: `category`, `description`, `amount` (Decimal), `date`, `notes`.

## Modelos de comunicación

### MessageThread / Message

Hilo de mensajes entre profesional y paciente.

### WaitlistEntry

Paciente en lista de espera.

### WhatsAppSetting / NotificationLog

Configuración de WhatsApp y log de notificaciones enviadas.

## Enums

| Enum | Valores |
|------|---------|
| `AppointmentType` | `ONLINE`, `IN_PERSON` |
| `AppointmentStatus` | `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`, `RESCHEDULED` |

## Relaciones principales

```
User ──1:N──> UserRole ──N:1──> Role ──1:N──> RolePermission ──N:1──> Permission

Patient ──1:1──> MedicalHistory
Patient ──1:N──> Allergy, Medication, PatientGoal
Patient ──1:N──> Appointment
Patient ──1:N──> AnthropometricMeasurement, ProgressPhoto
Patient ──1:N──> NutritionPlan ──1:N──> NutritionPlanDay ──1:N──> Meal ──1:N──> MealFood
Patient ──1:N──> FollowUp
Patient ──1:N──> PatientFile, Consent, Payment
Patient ──1:1──> User (portal)
```

## Tablas legacy (pendientes de eliminación)

Las siguientes tablas pertenecen al sistema anterior de inventario y no se utilizan en la versión actual:

`Warehouse`, `WarehouseStock`, `WarehouseTransfer`, `Product`, `Category`, `Supplier`, `PurchaseOrder`, `PurchaseOrderItem`, `PurchaseReceipt`, `PurchaseReceiptItem`, `Institution`, `Delivery`, `DeliveryItem`, `StockMovement`, `Loan`, `LoanItem`, `Expediente`, `ExpedienteCategory`, `ProductPriceHistory`.
