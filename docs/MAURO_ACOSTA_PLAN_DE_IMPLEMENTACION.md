# Plan de Implementación: Mauro Acosta

## 0. Regla principal

Este documento es la guía obligatoria para transformar el sistema actual en una aplicación de **Gestión nutricional** para **Mauro Acosta**.

Toda persona o inteligencia artificial que modifique el repositorio debe:

1. Leer este documento antes de trabajar.
2. Ejecutar las fases en orden.
3. No saltar la verificación indicada al final de cada fase.
4. No inventar otra marca o identidad para el proyecto.
5. Mantener a **Mauro Acosta** como única identidad pública, comercial y visual.
6. Mantener **Gestión nutricional** como descriptor principal.

La aplicación no debe presentar a Lucas Heredia, DMCE, inventario estatal ni ninguna identidad del sistema anterior.

---

## 1. Objetivo final

Construir una aplicación web para el consultorio de Mauro Acosta con dos áreas:

### 1.1 Landing pública

La landing debe captar pacientes y explicar:

- Quién es Mauro Acosta.
- Qué significa su servicio de Gestión nutricional.
- Qué tipos de consulta ofrece.
- Cómo reservar un turno.
- Qué ocurre después de reservar.
- Cómo contactar al consultorio.

### 1.2 Aplicación privada

La aplicación debe permitir gestionar:

- Pacientes.
- Historia clínica.
- Antecedentes, alergias y medicación.
- Objetivos nutricionales.
- Turnos presenciales y online.
- Calendario y disponibilidad.
- Mediciones antropométricas.
- Fotos de progreso.
- Planes alimentarios.
- Plantillas de planes.
- Recetas.
- Listas de compras.
- Seguimientos semanales.
- Archivos.
- Consentimientos.
- Cobros.
- Gastos.
- Reportes.
- Recordatorios y automatizaciones.
- Comunicación entre paciente y profesional.

---

## 2. Estado actual del repositorio

El repositorio actual es un sistema de control de stock. No se debe asumir que sus modelos de negocio son reutilizables.

### 2.1 Stack actual que puede conservarse

- Next.js con App Router.
- React.
- TypeScript.
- PostgreSQL.
- Prisma.
- `@prisma/adapter-pg`.
- JWT con `jose`.
- Cookie `session_token`.
- Tailwind CSS.
- Componentes shadcn/ui y Radix.
- Cloudinary.
- `date-fns`.
- `sonner`.
- `lucide-react`.
- Protección de rutas en `proxy.ts`.
- `getCurrentUser()` con `cache()`.

### 2.2 Código de negocio que debe desaparecer

El sistema anterior contiene módulos para:

- Productos.
- Categorías de productos.
- Depósitos.
- Stock.
- Transferencias.
- Proveedores.
- Compras.
- Recepciones.
- Entregas.
- Instituciones.
- Préstamos de materiales.
- Expedientes.
- Movimientos de stock.

No se deben renombrar superficialmente estos módulos. Deben reemplazarse por módulos de Gestión nutricional.

---

## 3. Reglas de identidad y contenido

### 3.1 Textos obligatorios

Usar:

- Mauro Acosta.
- Gestión nutricional.
- Consultorio nutricional.
- Pacientes.
- Turnos.
- Planes alimentarios.
- Seguimiento.
- Historia clínica.

### 3.2 Textos prohibidos

Eliminar de código, metadata, documentación y textos visibles:

- DMCE.
- Dirección de Materiales y Construcciones Escolares.
- Sistema de Gestión de Control de Stock.
- Inventario estatal.
- Depósitos.
- Escuelas.
- Proveedores de materiales.
- Entregas de materiales.
- Préstamos de materiales.
- “Desarrollado por Heredia Lucas”.
- Curriculum, experiencia y proyectos de Lucas Heredia.

### 3.3 Regla sobre `lucas-portfolio`

El proyecto ubicado en `/Users/heredialucas/Desktop/lucas/lucas-portfolio` se puede utilizar como referencia técnica y visual.

Se pueden adaptar:

- Header fijo.
- Menú móvil.
- Intro de carga.
- Animaciones con Framer Motion.
- Scroll suave.
- Texturas y transiciones.
- Composición de hero a pantalla completa.
- Secciones con aparición al hacer scroll.
- Tarjetas con movimiento y profundidad.

No se pueden copiar:

- Nombre Heredia Lucas.
- Foto de Lucas.
- Curriculum.
- Experiencias laborales.
- Proyectos profesionales.
- Publicaciones.
- Certificados.
- Links personales.
- Textos de `src/dictionaries/es.json`.
- Datos de `src/data/portfolio.ts`.

---

## 4. Reglas de trabajo para la inteligencia artificial

Antes de modificar un archivo:

1. Leer el archivo completo.
2. Buscar sus imports y usos.
3. Confirmar si pertenece al sistema viejo o a infraestructura reutilizable.
4. No borrar un archivo si todavía tiene imports activos.
5. Reemplazar primero sus consumidores.
6. Ejecutar `pnpm build` después de cada grupo de cambios.

Nunca:

- Ejecutar `prisma db push --force-reset`.
- Ejecutar `pnpm lint`.
- Ejecutar `prisma migrate dev`.
- Reescribir una migración histórica.
- Hacer `git reset --hard`.
- Commitear `.env` o `.env.local`.
- Exponer secretos en componentes cliente.
- Cargar datos clínicos sin autorización.

---

## Fase 1: Seguridad y variables de entorno

### Archivo: `.gitignore`

Verificar que contenga:

```text
.env
.env.local
.env.*.local
```

No cambiar estas reglas para permitir secretos en Git.

### Archivo a crear: `.env.local`

Crear localmente con:

```env
DATABASE_URL=""
DIRECT_URL=""
JWT_SECRET=""
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Completar los valores fuera del repositorio.

Las credenciales compartidas durante la planificación quedaron expuestas. Antes de producción se deben rotar:

- Contraseña de PostgreSQL/Supabase.
- API secret de Cloudinary.
- JWT secret.

### Archivo: `next.config.ts`

Verificar:

- Que `res.cloudinary.com` siga habilitado.
- Que no se agreguen dominios desconocidos.
- Que se mantengan headers de seguridad.
- Que las server actions tengan un límite razonable.

### Archivo: `lib/cloudinary.ts`

Reemplazar presets de inventario por:

- `patientPhotos`.
- `progressPhotos`.
- `patientDocuments`.
- `nutritionPlans`.
- `consents`.
- `paymentReceipts`.
- `recipeImages`.

Usar carpetas:

```text
mauro-acosta/patients
mauro-acosta/progress
mauro-acosta/documents
mauro-acosta/nutrition-plans
mauro-acosta/consents
mauro-acosta/receipts
mauro-acosta/recipes
```

No usar carpetas `inventory-control`.

### Verificación

- `.env.local` existe solo localmente.
- `git status --short` no muestra secretos.
- Ningún archivo cliente importa el API secret.

---

## Fase 2: Rebranding de la aplicación

### Archivo: `app/layout.tsx`

Modificar:

- `title.default` a `Mauro Acosta | Gestión nutricional`.
- `title.template` a `%s | Mauro Acosta`.
- Descripción para pacientes y consultorios.
- Open Graph con Mauro Acosta.
- `locale: "es_AR"`.
- `lang="es"`.

Eliminar cualquier mención a:

- Control de Inventario.
- Inventario.
- Compras.
- Entregas.

Conservar:

- `ThemeProvider`.
- `Toaster`.
- Skip link.
- `globals.css`.

### Archivo: `app/page.tsx`

Reemplazar la composición actual por:

```tsx
<LandingPage />
```

No mostrar el botón de autenticación como elemento principal de la landing.

### Archivo: `components/hero.tsx`

Eliminarlo o convertirlo en `components/landing/landing-hero.tsx`.

No conservar los textos actuales de DMCE.

### Archivo a crear: `components/landing/landing-page.tsx`

Componer, en orden:

1. `LandingHeader`.
2. `LandingHero`.
3. `LandingServices`.
4. `LandingApproach`.
5. `LandingFeatures`.
6. `LandingBookingCta`.
7. `LandingContact`.
8. `LandingFooter`.

### Verificación

Buscar en todo el repositorio textos del sistema anterior y corregirlos antes de continuar.

---

## Fase 3: Adaptación visual de `lucas-portfolio`

### Archivos de referencia

Leer:

- `lucas-portfolio/src/components/Header.tsx`.
- `lucas-portfolio/src/components/NavMenu.tsx`.
- `lucas-portfolio/src/components/LoadingIntro.tsx`.
- `lucas-portfolio/src/components/SmoothScrollProvider.tsx`.
- `lucas-portfolio/src/components/CinematicHero.tsx`.
- `lucas-portfolio/src/components/ContactSection.tsx`.
- `lucas-portfolio/src/app/globals.css`.

### Archivos a crear

- `components/landing/landing-header.tsx`.
- `components/landing/landing-menu.tsx`.
- `components/landing/landing-loading-intro.tsx`.
- `components/landing/smooth-scroll-provider.tsx`.

### `landing-header.tsx`

Adaptar:

- Nombre visual “Mauro Acosta”.
- Descriptor “Gestión nutricional”.
- Links `Inicio`, `Servicios`, `Cómo trabajo`, `Reservar`, `Contacto`.
- Botón `Reservar turno`.
- Menú responsive.

Eliminar:

- Selector de idiomas, salvo que se solicite después.
- Link de curriculum.
- Referencias personales.

### `landing-hero.tsx`

Crear una composición visual de pantalla completa con:

- Mauro Acosta como identidad.
- “Gestión nutricional” visible sin ambigüedad.
- Mensaje claro para pacientes.
- CTA de reserva.
- CTA secundaria de contacto.
- Imagen relacionada con consulta nutricional autorizada.

No usar `hero-lucas.jpg`.

### `app/globals.css`

Adaptar la estética del portfolio sin copiar la identidad:

- Tipografía editorial para títulos.
- Tipografía legible para textos.
- Fondo crema, verde y negro suave.
- Alto contraste.
- Bordes redondeados.
- Textura sutil.
- Animaciones de entrada.
- Estados de foco visibles.
- `prefers-reduced-motion`.

### Dependencias

En `package.json`, agregar solo si se usan:

- `framer-motion`.
- `lenis`.

No agregar GSAP sin una necesidad concreta.

### Verificación

- La landing funciona sin datos de sesión.
- El diseño funciona en móvil.
- No aparece ninguna imagen o texto de Lucas.
- Las animaciones se desactivan o reducen con `prefers-reduced-motion`.

---

## Fase 4: Landing y reserva pública

### Archivos a crear

- `components/landing/landing-services.tsx`.
- `components/landing/landing-approach.tsx`.
- `components/landing/landing-features.tsx`.
- `components/landing/landing-booking-cta.tsx`.
- `components/landing/landing-contact.tsx`.
- `components/landing/landing-footer.tsx`.
- `app/reservar/page.tsx`.
- `app/reservar/datos/page.tsx`.
- `app/reservar/horario/page.tsx`.
- `app/reservar/confirmacion/page.tsx`.

### Reserva pública

Paso 1: tipo de consulta:

- Consulta online.
- Consulta presencial.
- Primera consulta.
- Seguimiento.

Paso 2: datos básicos:

- Nombre.
- Apellido.
- Email.
- Teléfono.
- Edad o fecha de nacimiento.
- Objetivo.
- Obra social o particular.

Paso 3: agenda:

- Mostrar disponibilidad real.
- Ocultar turnos ocupados.
- Evitar superposiciones.
- Mostrar zona horaria.

Paso 4: confirmación:

- Mostrar resumen.
- Crear solicitud o turno.
- Enviar confirmación cuando exista proveedor de email.
- Generar link de WhatsApp cuando se configure.

### Componentes

- `components/booking/booking-type-step.tsx`.
- `components/booking/booking-patient-step.tsx`.
- `components/booking/booking-slot-step.tsx`.
- `components/booking/booking-summary.tsx`.
- `components/booking/booking-success.tsx`.

### Verificación

- Un visitante puede reservar sin iniciar sesión.
- No se puede reservar una hora ocupada.
- Se validan email, teléfono y horario.
- No se guardan datos clínicos sensibles en la reserva pública.

---

## Fase 5: Nuevo modelo Prisma

### Archivo: `prisma/schema.prisma`

Conservar inicialmente:

- `User`.
- `Role`.
- `Permission`.
- `UserRole`.
- `RolePermission`.

Reemplazar las relaciones de esos modelos que apuntan a inventario.

### Modelo `Patient`

Campos:

- `id String @id @default(uuid()) @db.Uuid`.
- `firstName String`.
- `lastName String`.
- `email String?`.
- `phone String?`.
- `birthDate DateTime?`.
- `documentNumber String?`.
- `address String?`.
- `city String?`.
- `occupation String?`.
- `emergencyContact String?`.
- `emergencyPhone String?`.
- `healthInsurance String?`.
- `billingType String`.
- `status String`.
- `notes String?`.
- `createdAt DateTime @default(now())`.
- `updatedAt DateTime @updatedAt`.
- `deletedAt DateTime?`.

Relaciones:

- `appointments Appointment[]`.
- `medicalHistory MedicalHistory?`.
- `allergies Allergy[]`.
- `medications Medication[]`.
- `goals PatientGoal[]`.
- `measurements AnthropometricMeasurement[]`.
- `progressPhotos ProgressPhoto[]`.
- `nutritionPlans NutritionPlan[]`.
- `followUps FollowUp[]`.
- `files PatientFile[]`.
- `consents Consent[]`.
- `payments Payment[]`.
- `waitlistEntries WaitlistEntry[]`.

### Modelo `MedicalHistory`

Campos:

- `id`.
- `patientId` único.
- `familyHistory`.
- `personalHistory`.
- `surgeries`.
- `diagnoses`.
- `habits`.
- `sleepHours`.
- `physicalActivity`.
- `digestiveSymptoms`.
- `observations`.
- `createdAt`.
- `updatedAt`.

### Modelo `Allergy`

Campos:

- `id`.
- `patientId`.
- `name`.
- `reaction`.
- `severity`.
- `notes`.

### Modelo `Medication`

Campos:

- `id`.
- `patientId`.
- `name`.
- `dosage`.
- `frequency`.
- `indication`.
- `startDate`.
- `endDate`.
- `notes`.

### Modelo `PatientGoal`

Campos:

- `id`.
- `patientId`.
- `type`.
- `description`.
- `targetValue`.
- `targetDate`.
- `status`.
- `createdAt`.
- `completedAt`.

### Modelo `Appointment`

Campos:

- `id`.
- `patientId`.
- `professionalId`.
- `type`.
- `status`.
- `startAt`.
- `endAt`.
- `location`.
- `meetingUrl`.
- `notes`.
- `cancellationReason`.
- `createdAt`.
- `updatedAt`.

Estados:

- `PENDING`.
- `CONFIRMED`.
- `COMPLETED`.
- `CANCELLED`.
- `NO_SHOW`.
- `RESCHEDULED`.

Tipos:

- `ONLINE`.
- `IN_PERSON`.
- `FIRST_CONSULTATION`.
- `FOLLOW_UP`.

### Modelo `Availability`

Campos:

- `id`.
- `professionalId`.
- `weekday`.
- `startTime`.
- `endTime`.
- `slotDuration`.
- `isActive`.

### Modelo `AnthropometricMeasurement`

Campos:

- `id`.
- `patientId`.
- `appointmentId`.
- `measuredAt`.
- `weight`.
- `height`.
- `bmi`.
- `waist`.
- `hip`.
- `arm`.
- `bodyFatPercentage`.
- `muscleMass`.
- `notes`.

El IMC debe calcularse en el servidor. No aceptar únicamente el valor enviado por el navegador.

### Modelo `ProgressPhoto`

Campos:

- `id`.
- `patientId`.
- `uploadedById`.
- `url`.
- `publicId`.
- `type`.
- `takenAt`.
- `consentGranted`.
- `createdAt`.

### Modelos de planes

Crear:

- `NutritionPlan`.
- `NutritionPlanDay`.
- `Meal`.
- `MealFood`.

`NutritionPlan` debe tener:

- Paciente.
- Profesional creador.
- Título.
- Descripción.
- Fecha inicial.
- Fecha final.
- Estado.
- Objetivo calórico opcional.
- Notas.
- PDF generado opcional.

### Modelos adicionales

Crear:

- `Recipe`.
- `ShoppingList`.
- `ShoppingListItem`.
- `FollowUp`.
- `PatientFile`.
- `Consent`.
- `Payment`.
- `Expense`.
- `WaitlistEntry`.
- `MessageThread`.
- `Message`.

### Verificación

- No quedan relaciones de negocio con `Warehouse`, `Product` o `Delivery` en los nuevos modelos.
- `prisma validate` no se usa como sustituto de `pnpm build`.
- Ejecutar `pnpm prisma generate` después de modificar el schema.

---

## Fase 6: Migración de base de datos

### Preparación

Antes de borrar modelos:

1. Confirmar si la base contiene datos reales.
2. Crear respaldo si existen datos que deban conservarse.
3. Revisar el estado de `_prisma_migrations`.
4. No eliminar migraciones históricas.

### Archivo nuevo

Crear:

`prisma/migrations/<timestamp>_mauro_acosta_nutrition/migration.sql`

### Procedimiento exacto

1. Modificar `prisma/schema.prisma`.
2. Ejecutar `pnpm migrate:create > /tmp/migration.sql`.
3. Revisar el SQL completo.
4. Confirmar que no contenga un reset destructivo.
5. Crear la carpeta de migración.
6. Generar el SQL definitivo con `npx prisma migrate diff`.
7. Ejecutar el SQL con `pnpm prisma db execute`.
8. Marcar únicamente la migración nueva como aplicada.
9. Ejecutar `pnpm prisma generate`.
10. Ejecutar `pnpm prisma migrate status`.

No ejecutar `prisma migrate dev` porque la configuración con Supabase/PgBouncer no tiene shadow database funcional.

### Verificación

La base debe informar que está actualizada. Si aparece una divergencia, detener el trabajo y revisar antes de crear otra migración.

---

## Fase 7: Seed, roles y permisos

### Archivo: `prisma/seed.ts`

Eliminar permisos de:

- Inventario.
- Depósitos.
- Transferencias.
- Préstamos.
- Compras.
- Proveedores.
- Entregas.
- Instituciones.
- Expedientes.
- Recepciones.
- Movimientos de stock.

Crear permisos:

```text
dashboard.view
patients.view
patients.manage
medical_history.view
medical_history.manage
appointments.view
appointments.manage
availability.view
availability.manage
measurements.view
measurements.manage
nutrition_plans.view
nutrition_plans.manage
recipes.view
recipes.manage
followups.view
followups.manage
files.view
files.manage
consents.view
consents.manage
payments.view
payments.manage
expenses.view
expenses.manage
reports.view
messages.view
messages.manage
users.view
users.manage
settings.manage
```

Roles:

- `ADMIN`: acceso total.
- `PROFESSIONAL`: pacientes, turnos, historia clínica, planes y seguimiento.
- `ASSISTANT`: pacientes y agenda con acceso clínico limitado.
- `RECEPTION`: turnos, datos básicos y cobros.
- `PATIENT`: únicamente sus propios datos.

### Archivo: `prisma/seeds/seed-permissions.ts`

Actualizarlo para que no vuelva a crear permisos de stock.

### Verificación

- El seed no contiene `warehouse`, `product`, `supplier`, `delivery` o `institution`.
- Los roles se pueden asignar sin errores.
- Un paciente no recibe permisos de administración.

---

## Fase 8: Autenticación y autorización

### Archivo: `lib/auth.ts`

Conservar:

- `getSession`.
- `getCurrentUser`.
- `hasPermission`.
- `isAdminUser`.

Agregar:

- `isProfessionalUser`.
- `isPatientUser`.
- `requirePermission`.
- `requirePatientAccess`.
- `requireProfessionalAccess`.

Cada operación clínica debe comprobar:

1. Sesión válida.
2. Usuario activo.
3. Permiso correcto.
4. Acceso al paciente solicitado.

### Archivo: `proxy.ts`

Proteger:

- `/dashboard`.
- `/paciente/dashboard`.

Dejar públicas:

- `/`.
- `/reservar`.
- `/auth/login`.
- `/auth/sign-up` si se mantiene.

Separar sesión profesional de sesión paciente si se utiliza el mismo modelo `User`.

### Verificación

- Un usuario sin sesión no entra al dashboard.
- Un paciente no entra a rutas profesionales.
- Un profesional no ve pacientes fuera de su alcance.

---

## Fase 9: Servicios y Server Actions

### Servicios a crear

- `services/patient-service.ts`.
- `services/medical-history-service.ts`.
- `services/appointment-service.ts`.
- `services/availability-service.ts`.
- `services/measurement-service.ts`.
- `services/progress-service.ts`.
- `services/nutrition-plan-service.ts`.
- `services/recipe-service.ts`.
- `services/shopping-list-service.ts`.
- `services/followup-service.ts`.
- `services/file-service.ts`.
- `services/consent-service.ts`.
- `services/payment-service.ts`.
- `services/expense-service.ts`.
- `services/report-service.ts`.
- `services/message-service.ts`.
- `services/waitlist-service.ts`.
- `services/notification-service.ts`.

### Server Actions a crear

- `app/actions/patients.ts`.
- `app/actions/medical-history.ts`.
- `app/actions/appointments.ts`.
- `app/actions/availability.ts`.
- `app/actions/measurements.ts`.
- `app/actions/progress-photos.ts`.
- `app/actions/nutrition-plans.ts`.
- `app/actions/recipes.ts`.
- `app/actions/shopping-lists.ts`.
- `app/actions/followups.ts`.
- `app/actions/files.ts`.
- `app/actions/consents.ts`.
- `app/actions/payments.ts`.
- `app/actions/expenses.ts`.
- `app/actions/reports.ts`.
- `app/actions/messages.ts`.
- `app/actions/waitlist.ts`.

Cada action debe:

1. Tener `"use server"`.
2. Validar sesión.
3. Validar permisos.
4. Validar los datos recibidos.
5. Llamar a un servicio.
6. No devolver secretos.
7. Revalidar las rutas necesarias.
8. Manejar errores de forma segura.

No consultar Prisma directamente desde un componente de interfaz.

---

## Fase 10: Layout privado y navegación

### Archivo: `app/dashboard/layout.tsx`

Modificar:

- Descripción metadata.
- Nombre visual.
- Permisos nutricionales.
- Sidebar de Gestión nutricional.

### Archivo: `components/app-sidebar.tsx`

Reemplazar los grupos actuales por:

#### Principal

- Dashboard.

#### Pacientes

- Pacientes.
- Seguimientos.

#### Agenda

- Turnos.
- Calendario.
- Disponibilidad.

#### Nutrición

- Planes alimentarios.
- Plantillas.
- Recetas.
- Listas de compras.

#### Administración

- Cobros.
- Gastos.
- Reportes.

#### Configuración

- Datos del consultorio.
- Usuarios.
- Roles.

Eliminar todos los links de inventario.

### Archivo: `components/mobile-nav.tsx`

Mantener el patrón de Sheet, pero cambiar:

- Título a “Mauro Acosta”.
- Navegación nutricional.
- Permisos.
- Iconos.

### Verificación

- No existe ninguna ruta de stock en el sidebar.
- El menú funciona en móvil.
- Las rutas no autorizadas no aparecen ni se pueden abrir directamente.

---

## Fase 11: Dashboard

### Archivo: `app/dashboard/page.tsx`

Reemplazar completamente el dashboard de inventario.

Mostrar:

- Turnos de hoy.
- Próximos turnos.
- Pacientes activos.
- Controles pendientes.
- Planes por revisar.
- Pacientes sin seguimiento reciente.
- Ingresos del mes.
- Evolución promedio.

### Componentes a crear

- `components/dashboard/stat-card.tsx`.
- `components/dashboard/today-appointments.tsx`.
- `components/dashboard/upcoming-appointments.tsx`.
- `components/dashboard/patient-alerts.tsx`.
- `components/dashboard/revenue-summary.tsx`.
- `components/dashboard/progress-summary.tsx`.

### Acción

Crear en `app/actions/dashboard.ts`:

- `getDashboardSummary`.
- `getTodayAppointments`.
- `getPendingFollowUps`.
- `getMonthlyRevenue`.

### Verificación

- No aparecen tarjetas de productos, depósitos o proveedores.
- Las consultas independientes se paralelizan.
- El dashboard soporta estado vacío.

---

## Fase 12: Pacientes

### Rutas a crear

- `app/dashboard/pacientes/page.tsx`.
- `app/dashboard/pacientes/new/page.tsx`.
- `app/dashboard/pacientes/[id]/page.tsx`.
- `app/dashboard/pacientes/[id]/edit/page.tsx`.

### Componentes a crear

- `components/patients/patient-list.tsx`.
- `components/patients/patient-form.tsx`.
- `components/patients/patient-card.tsx`.
- `components/patients/patient-summary.tsx`.
- `components/patients/patient-actions.tsx`.

### Funciones

- Buscar por nombre.
- Buscar por email.
- Buscar por teléfono.
- Filtrar activos y archivados.
- Crear paciente.
- Editar paciente.
- Archivar paciente.
- Ver último peso.
- Ver próximo turno.
- Ver plan vigente.
- Abrir historia clínica.

### Verificación

- El email y teléfono se validan.
- El borrado debe ser archivado o soft delete.
- La lista no expone datos clínicos innecesarios.

---

## Fase 13: Historia clínica

### Rutas

- `app/dashboard/pacientes/[id]/historia-clinica/page.tsx`.

### Componentes

- `components/medical-history/medical-history-form.tsx`.
- `components/medical-history/allergy-list.tsx`.
- `components/medical-history/allergy-form.tsx`.
- `components/medical-history/medication-list.tsx`.
- `components/medical-history/medication-form.tsx`.
- `components/medical-history/goal-list.tsx`.
- `components/medical-history/goal-form.tsx`.

### Datos

- Antecedentes familiares.
- Antecedentes personales.
- Diagnósticos informados.
- Cirugías.
- Alergias.
- Medicación.
- Hábitos.
- Sueño.
- Actividad física.
- Síntomas digestivos.
- Objetivos.
- Observaciones privadas.

### Verificación

- Solo usuarios autorizados acceden.
- Se diferencia información del paciente y notas privadas.
- Se registra fecha de actualización.

---

## Fase 14: Turnos y agenda

### Rutas

- `app/dashboard/turnos/page.tsx`.
- `app/dashboard/turnos/calendario/page.tsx`.
- `app/dashboard/turnos/disponibilidad/page.tsx`.

### Componentes

- `components/appointments/appointment-list.tsx`.
- `components/appointments/appointment-calendar.tsx`.
- `components/appointments/appointment-form.tsx`.
- `components/appointments/appointment-status-badge.tsx`.
- `components/appointments/availability-form.tsx`.
- `components/appointments/reschedule-dialog.tsx`.
- `components/appointments/cancel-dialog.tsx`.

### Funciones

- Crear turno.
- Confirmar turno.
- Reprogramar.
- Cancelar.
- Marcar completado.
- Marcar ausente.
- Ver online o presencial.
- Asociar link de videollamada.
- Configurar horarios disponibles.
- Lista de espera.

### Reglas de servidor

- No permitir solapamientos.
- No permitir turnos en el pasado sin permiso especial.
- Validar duración.
- Validar disponibilidad.
- Validar zona horaria.

### Verificación

- Crear y editar turno.
- Reprogramar.
- Cancelar.
- Comprobar conflicto de horario.
- Confirmar reserva pública.

---

## Fase 15: Mediciones y evolución

### Ruta

`app/dashboard/pacientes/[id]/evolucion/page.tsx`

### Componentes

- `components/progress/measurement-form.tsx`.
- `components/progress/measurement-history.tsx`.
- `components/progress/progress-chart.tsx`.
- `components/progress/progress-photo-gallery.tsx`.
- `components/progress/progress-photo-upload.tsx`.
- `components/progress/evolution-summary.tsx`.

### Datos

- Peso.
- Altura.
- IMC.
- Cintura.
- Cadera.
- Brazo.
- Grasa corporal.
- Masa muscular.
- Fecha.
- Notas.

### Reglas

- Calcular IMC en servidor.
- Mantener histórico.
- No sobrescribir mediciones anteriores.
- Validar unidades.
- Solicitar consentimiento para fotos.

### Verificación

- Se pueden cargar varias mediciones.
- El gráfico respeta fechas.
- Se puede ver evolución sin exponerla públicamente.

---

## Fase 16: Planes alimentarios

### Rutas

- `app/dashboard/planes/page.tsx`.
- `app/dashboard/planes/new/page.tsx`.
- `app/dashboard/planes/[id]/page.tsx`.
- `app/dashboard/planes/templates/page.tsx`.

### Componentes

- `components/nutrition-plans/plan-list.tsx`.
- `components/nutrition-plans/plan-form.tsx`.
- `components/nutrition-plans/plan-day-editor.tsx`.
- `components/nutrition-plans/meal-editor.tsx`.
- `components/nutrition-plans/food-row.tsx`.
- `components/nutrition-plans/plan-preview.tsx`.
- `components/nutrition-plans/plan-actions.tsx`.

### Funciones

- Crear plan.
- Editar borrador.
- Publicar plan.
- Duplicar plan.
- Crear plantilla.
- Agregar días.
- Agregar comidas.
- Agregar alimentos.
- Agregar sustituciones.
- Asociar recetas.
- Generar PDF.
- Compartir con paciente.
- Archivar versión anterior.

### Verificación

- Un plan publicado no se modifica sin crear versión.
- El paciente solo ve planes publicados propios.
- El PDF no incluye datos de otro paciente.

---

## Fase 17: Recetas y listas de compras

### Rutas

- `app/dashboard/recetas/page.tsx`.
- `app/dashboard/recetas/new/page.tsx`.
- `app/dashboard/listas-compras/page.tsx`.

### Componentes

- `components/recipes/recipe-list.tsx`.
- `components/recipes/recipe-form.tsx`.
- `components/recipes/recipe-card.tsx`.
- `components/shopping-lists/shopping-list.tsx`.
- `components/shopping-lists/shopping-list-item.tsx`.

### Funciones

- Crear recetas.
- Guardar plantillas.
- Asociar recetas a comidas.
- Generar ingredientes.
- Marcar compras realizadas.
- Compartir lista.

### Verificación

- No se confunde receta con producto de inventario.
- La lista se genera solamente desde el plan elegido.

---

## Fase 18: Archivos, fotos y consentimientos

### Rutas

- `app/dashboard/pacientes/[id]/archivos/page.tsx`.
- `app/dashboard/pacientes/[id]/consentimientos/page.tsx`.

### Componentes

- `components/files/file-list.tsx`.
- `components/files/file-upload.tsx`.
- `components/files/file-preview.tsx`.
- `components/consents/consent-form.tsx`.
- `components/consents/consent-history.tsx`.

### Reglas de Cloudinary

- Validar extensión.
- Validar MIME.
- Validar tamaño.
- Guardar `publicId`.
- Guardar usuario que sube.
- Guardar fecha.
- Usar URLs firmadas cuando corresponda.
- No exponer fotos clínicas mediante links públicos permanentes.

### Consentimientos

Registrar:

- Tipo.
- Versión.
- Fecha.
- Firma.
- IP si la normativa y el producto lo requieren.
- Documento generado.

### Verificación

- Un paciente no puede descargar archivos ajenos.
- Las fotos no se muestran en la landing.
- El archivo eliminado no queda referenciado.

---

## Fase 19: Seguimiento

### Rutas

- `app/dashboard/seguimiento/page.tsx`.
- `app/dashboard/pacientes/[id]/seguimiento/page.tsx`.

### Componentes

- `components/followups/followup-list.tsx`.
- `components/followups/followup-form.tsx`.
- `components/followups/adherence-field.tsx`.
- `components/followups/followup-summary.tsx`.

### Datos

- Peso semanal.
- Cumplimiento del plan.
- Hambre.
- Energía.
- Dificultades.
- Notas del paciente.
- Notas del profesional.
- Fecha de inicio de semana.

### Verificación

- El paciente puede completar su seguimiento.
- El profesional puede responderlo.
- Se mantiene historial.

---

## Fase 20: Cobros, gastos y reportes

### Rutas

- `app/dashboard/cobros/page.tsx`.
- `app/dashboard/gastos/page.tsx`.
- `app/dashboard/reportes/page.tsx`.

### Componentes

- `components/payments/payment-list.tsx`.
- `components/payments/payment-form.tsx`.
- `components/payments/cash-summary.tsx`.
- `components/expenses/expense-list.tsx`.
- `components/expenses/expense-form.tsx`.
- `components/reports/appointments-report.tsx`.
- `components/reports/patients-report.tsx`.
- `components/reports/revenue-report.tsx`.
- `components/reports/retention-report.tsx`.

### Reportes

- Pacientes nuevos.
- Pacientes activos.
- Turnos del mes.
- Cancelaciones.
- Ausencias.
- Retención.
- Ingresos.
- Gastos.
- Evolución promedio.
- Cumplimiento.

### Verificación

- Los importes usan Decimal en base de datos.
- Los totales se calculan en servidor.
- Los filtros de fecha se validan.
- No se mezclan cobros con datos clínicos innecesarios.

---

## Fase 21: Mensajes y videollamadas

### Rutas

- `app/dashboard/pacientes/[id]/mensajes/page.tsx`.
- `app/paciente/dashboard/mensajes/page.tsx`.

### Componentes

- `components/messages/chat.tsx`.
- `components/messages/message-list.tsx`.
- `components/messages/message-form.tsx`.

### Reglas

- Un mensaje pertenece a un paciente y profesional.
- Registrar autor y fecha.
- Restringir acceso por relación.
- No usar el chat para emergencias médicas.

### Videollamada

Usar inicialmente un proveedor externo y guardar solamente `meetingUrl` en `Appointment`.

Opciones posibles:

- Google Meet.
- Zoom.
- Whereby.
- Daily.
- Jitsi.

No construir infraestructura propia de videollamadas en la primera versión.

---

## Fase 22: Portal del paciente

### Rutas

- `app/paciente/login/page.tsx`.
- `app/paciente/registro/page.tsx`.
- `app/paciente/dashboard/page.tsx`.
- `app/paciente/dashboard/turnos/page.tsx`.
- `app/paciente/dashboard/plan/page.tsx`.
- `app/paciente/dashboard/seguimiento/page.tsx`.
- `app/paciente/dashboard/archivos/page.tsx`.

### Componentes

- `components/patient-portal/patient-summary.tsx`.
- `components/patient-portal/upcoming-appointment.tsx`.
- `components/patient-portal/current-plan.tsx`.
- `components/patient-portal/weekly-checkin.tsx`.
- `components/patient-portal/patient-files.tsx`.

### Funciones

- Ver turnos propios.
- Solicitar cancelación.
- Solicitar reprogramación.
- Ver plan publicado.
- Descargar archivos propios.
- Completar seguimiento.
- Cargar peso.
- Subir foto con consentimiento.
- Firmar consentimiento.
- Enviar mensajes.

### Verificación

- Probar con dos pacientes diferentes.
- Confirmar aislamiento total de datos.
- Confirmar que una URL manipulada no permita acceder a otro paciente.

---

## Fase 23: Automatizaciones

### Archivos a crear

- `services/reminder-service.ts`.
- `services/automation-service.ts`.
- `app/actions/notifications.ts`.

### Automatizaciones previstas

- Recordatorio 24 horas antes.
- Recordatorio 2 horas antes.
- Aviso de turno cancelado.
- Aviso de plan publicado.
- Control cada 30 días.
- Seguimiento semanal.
- Felicitación por objetivo cumplido.

### Ejecución

No depender de que un usuario tenga abierta la página.

Usar posteriormente:

- Cron de Vercel.
- Scheduled function de Supabase.
- Worker externo.

### Verificación

- No enviar dos veces el mismo recordatorio.
- Registrar estado de envío.
- Registrar errores.
- No enviar información clínica en asuntos públicos.

---

## Fase 24: Eliminación del sistema anterior

Ejecutar esta fase únicamente después de que las nuevas rutas funcionen.

### Rutas a eliminar

- `app/dashboard/inventory/`.
- `app/dashboard/warehouses/`.
- `app/dashboard/purchases/`.
- `app/dashboard/receipts/`.
- `app/dashboard/deliveries/`.
- `app/dashboard/suppliers/`.
- `app/dashboard/institutions/`.
- `app/dashboard/expedientes/`.
- `app/dashboard/loans/`.
- `app/dashboard/movements/`.
- `app/dashboard/categories/`.
- `app/dashboard/administracion/`.
- `app/dashboard/reports/`.

### Componentes a eliminar

- `components/deliveries/`.
- `components/categories/`.
- `components/expedientes/`.
- `components/institutions/`.
- `components/inventory/`.
- `components/loans/`.
- `components/movements/`.
- `components/purchases/`.
- `components/receipts/`.
- `components/suppliers/`.
- `components/warehouses/`.
- `components/administracion/`.

### Acciones y servicios a eliminar

Eliminar luego de quitar todos sus imports:

- `app/actions/inventory.ts`.
- `app/actions/warehouses.ts`.
- `app/actions/purchases.ts`.
- `app/actions/receipts.ts`.
- `app/actions/deliveries.ts`.
- `app/actions/suppliers.ts`.
- `app/actions/institutions.ts`.
- `app/actions/expedientes.ts`.
- `app/actions/loans.ts`.
- `app/actions/traceability.ts`.
- `app/actions/analytics.ts`.
- Servicios equivalentes de inventario.

### Modelos a retirar

Retirar mediante migración explícita, no manualmente desde producción:

- `Warehouse`.
- `WarehouseStock`.
- `WarehouseTransfer`.
- `Product`.
- `Category`.
- `Supplier`.
- `PurchaseOrder`.
- `PurchaseOrderItem`.
- `PurchaseReceipt`.
- `PurchaseReceiptItem`.
- `Institution`.
- `Delivery`.
- `DeliveryItem`.
- `StockMovement`.
- `Loan`.
- `LoanItem`.
- `Expediente`.
- `ExpedienteCategory`.
- `ProductPriceHistory`.

### Documentación histórica

Reemplazar o archivar:

- `sistema_gestion_stock.md`.
- `NEW_STRUCTURE.md`.
- `EXPLICACION_SCHEMAS.md`.

No dejar esos documentos como documentación pública activa.

---

## Fase 25: Documentación final

### `README.md`

Reescribir para describir:

- Mauro Acosta.
- Gestión nutricional.
- Funciones de la aplicación.
- Instalación.
- Variables de entorno sin valores secretos.
- Prisma.
- Migraciones manuales.
- Cloudinary.
- Roles.
- Privacidad.
- Despliegue.

Eliminar:

- DMCE.
- Inventario.
- Usuarios demo de stock.
- Contraseñas.
- URL de producción anterior.
- “Desarrollado por Heredia Lucas”.

### Archivos a crear

- `docs/ARCHITECTURE.md`.
- `docs/DATABASE.md`.
- `docs/ROLES_AND_PERMISSIONS.md`.
- `docs/BOOKING_FLOW.md`.
- `docs/PRIVACY.md`.
- `docs/DEPLOYMENT.md`.

Estos documentos deben referirse a Mauro Acosta y Gestión nutricional.

---

## Fase 26: Verificación final obligatoria

### Comandos permitidos

Después de modificar el schema:

```bash
pnpm prisma generate
```

Verificación principal:

```bash
pnpm build
```

Migraciones:

```bash
pnpm prisma migrate status
```

### Comandos prohibidos

```bash
pnpm lint
prisma migrate dev
prisma db push --force-reset
```

### Lista de comprobación de identidad

- La landing muestra Mauro Acosta.
- La landing muestra Gestión nutricional.
- No aparece DMCE.
- No aparece Lucas Heredia.
- No aparece “Desarrollado por Heredia Lucas”.
- No aparecen textos de inventario.
- No aparecen imágenes de Lucas.

### Lista de comprobación funcional

- Landing pública.
- Reserva pública.
- Login profesional.
- Dashboard.
- Pacientes.
- Historia clínica.
- Alergias.
- Medicación.
- Objetivos.
- Turnos.
- Calendario.
- Disponibilidad.
- Mediciones.
- IMC.
- Evolución.
- Fotos con consentimiento.
- Planes alimentarios.
- Plantillas.
- Recetas.
- Lista de compras.
- Seguimiento semanal.
- Archivos.
- Cobros.
- Gastos.
- Reportes.
- Portal paciente.
- Permisos.
- Responsive mobile.

### Lista de comprobación de seguridad

- Secretos fuera de Git.
- Datos clínicos protegidos.
- Pacientes aislados entre sí.
- Roles verificados en servidor.
- Server Actions protegidas.
- Archivos validados.
- URLs privadas o firmadas cuando corresponda.
- Consentimiento registrado para fotos.
- Soft delete para pacientes.
- No se ejecutaron operaciones destructivas.

### Resultado esperado

El build debe finalizar correctamente y la aplicación debe representar exclusivamente a **Mauro Acosta** como profesional de **Gestión nutricional**, con una landing de captación y un sistema privado de gestión nutricional.

---

## Estado de implementación

> Esta sección se actualiza conforme se avanza. No modifica el plan original.

### Completado

| Fase | Estado | Detalle |
|------|--------|---------|
| 1 | ✅ | Seguridad y variables de entorno |
| 2 | ✅ | Rebranding de la aplicación |
| 3 | ✅ | Adaptación visual de lucas-portfolio |
| 4 | ✅ | Landing completa y reserva pública |

### Pendiente

| Fase | Estado | Descripción |
|------|--------|-------------|
| 5 | ⏳ | Nuevo modelo Prisma |
| 6 | ⏳ | Migración de base de datos |
| 7 | ⏳ | Seed, roles y permisos |
| 8 | ⏳ | Autenticación y autorización |
| 9 | ⏳ | Servicios y Server Actions |
| 10 | ⏳ | Layout privado y navegación |
| 11 | ⏳ | Dashboard |
| 12 | ⏳ | Pacientes |
| 13 | ⏳ | Historia clínica |
| 14 | ⏳ | Turnos y agenda |
| 15 | ⏳ | Mediciones y evolución |
| 16 | ⏳ | Planes alimentarios |
| 17 | ⏳ | Recetas y listas de compras |
| 18 | ⏳ | Archivos, fotos y consentimientos |
| 19 | ⏳ | Seguimiento semanal |
| 20 | ⏳ | Cobros, gastos y reportes |
| 21 | ⏳ | Mensajes y videollamadas |
| 22 | ⏳ | Portal del paciente |
| 23 | ⏳ | Automatizaciones y recordatorios |
| 24 | ⏳ | Eliminación del sistema anterior |
| 25 | ⏳ | Documentación final |
| 26 | ⏳ | Verificación final obligatoria |
