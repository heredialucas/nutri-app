# Privacidad y datos clínicos — Mauro Acosta Gestión Nutricional

## Principios

1. **Mínimo necesario**: solo se recopila la información necesaria para la gestión nutricional.
2. **Aislamiento**: cada paciente solo puede acceder a sus propios datos.
3. **Consentimiento**: las fotos de evolución requieren consentimiento registrado.
4. **Seguridad**: autenticación JWT, autorización por permisos, datos en tránsito cifrados.

## Datos sensibles

La aplicación maneja datos sensibles de salud:

- Historia clínica (antecedentes, diagnósticos, cirugías)
- Alergias y medicación
- Mediciones antropométricas (peso, IMC, grasa corporal)
- Fotos de evolución corporal
- Objetivos de salud
- Planes alimentarios personalizados
- Notas clínicas del profesional

## Protección de datos

### Autenticación

- Sesión JWT con cookie `session_token` (httpOnly).
- Tokens firmados con `jose` usando `JWT_SECRET`.
- Expiración configurada en el servicio de auth.

### Autorización

Cada Server Action verifica:
1. Sesión válida.
2. Usuario activo.
3. Permiso necesario para la operación.
4. Acceso al paciente específico (para operaciones clínicas).

### Aislamiento de pacientes

- Los pacientes con rol `PATIENT` solo acceden a sus propios datos.
- `requirePatientAccess()` verifica que el `userId` del paciente coincida con la sesión.
- Las URLs manipuladas no permiten acceder a datos de otros pacientes.

### Almacenamiento de archivos

- Archivos en Cloudinary con carpetas por tipo.
- Fotos de evolución requieren `consentGranted = true` en la base de datos.
- URLs privadas/firmadas cuando corresponda.
- No se exponen fotos clínicas mediante links públicos permanentes.

### Soft delete

Los pacientes no se eliminan físicamente. Se marca `deletedAt` para preservar integridad referencial y auditoría.

## Consentimientos

Para fotos de evolución se registra:
- Tipo de consentimiento
- Versión del documento
- Fecha de firma
- Firma (texto o imagen)
- IP del paciente (opcional)
- URL del documento generado

## Logs de notificaciones

Los logs de WhatsApp/notificaciones (`NotificationLog`) registran:
- Tipo de notificación
- Destinatario
- Mensaje enviado
- Estado (SENT, ERROR)
- Timestamp

No se almacena contenido clínico en los asuntos de notificación.

## Headers de seguridad

Configurados en `next.config.ts`:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

## Datos que no se recopilan

- Datos de tarjetas de crédito o débito.
- Geolocalización precisa.
- Datos de navegación o analytics de terceros.
- Cookies de rastreo.

## Cumplimiento

La aplicación está diseñada para cumplir con principios de protección de datos personales y datos sensibles de salud. Se recomienda consultar la normativa local vigente (Ley 25.326 de Protección de Datos Personales en Argentina) para requisitos específicos de consentimiento y registro.
