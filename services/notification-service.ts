import prisma from "@/lib/prisma";
import { notifyAdmin, sendEmail } from "@/lib/email";
import { formatInTimeZone } from "date-fns-tz";

const AR_TZ = "America/Argentina/Buenos_Aires";

export type AppointmentEvent = "CREATED" | "RESCHEDULED" | "CANCELLED";

const EVENT_LABELS: Record<AppointmentEvent, string> = {
    CREATED: "🟢 Nuevo turno reservado",
    RESCHEDULED: "🔄 Turno reprogramado",
    CANCELLED: "🔴 Turno cancelado",
};

function escapeHtml(value: unknown): string {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function formatDate(date: Date): string {
    return formatInTimeZone(date, AR_TZ, "dd/MM/yyyy");
}

function formatTime(date: Date): string {
    return formatInTimeZone(date, AR_TZ, "HH:mm");
}

function row(label: string, value: unknown): string {
    return `<tr><td style="padding:6px 12px 6px 0;color:#64748b;font-size:13px;white-space:nowrap;vertical-align:top">${label}</td><td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:600">${escapeHtml(value)}</td></tr>`;
}

function wrapHtml(title: string, body: string): string {
    return `<div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#0f172a;max-width:560px">
  <h2 style="margin:0 0 4px;font-size:18px">${title}</h2>
  <p style="margin:0 0 16px;color:#64748b;font-size:13px">Mauro Acosta · Gestión nutricional</p>
  ${body}
  <p style="margin-top:20px;color:#94a3b8;font-size:12px">Notificación automática del sistema.</p>
</div>`;
}

export const notificationService = {
    /**
     * Envía un email al buzón de administración con los datos del turno.
     * Nunca lanza: si falla, solo se loguea.
     */
    async notifyAppointmentEvent(
        appointmentId: string,
        event: AppointmentEvent,
        options?: { reason?: string; previousStartAt?: Date },
    ): Promise<boolean> {
        try {
            const appointment = await prisma.appointment.findUnique({
                where: { id: appointmentId },
                include: {
                    patient: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                        },
                    },
                    professional: { select: { fullName: true } },
                    sede: { select: { name: true, address: true } },
                },
            });

            if (!appointment) return false;

            const patientName = `${appointment.patient.firstName} ${appointment.patient.lastName}`;
            const typeStr =
                appointment.type === "ONLINE" ? "Online" : "Presencial";

            const locationStr =
                appointment.type === "ONLINE"
                    ? appointment.meetingUrl || "Sin link de videollamada"
                    : appointment.sede
                      ? `${appointment.sede.name} — ${appointment.sede.address}`
                      : appointment.location || "Sin sede";

            let body = `<table style="border-collapse:collapse;width:100%">
  ${row("Paciente", patientName)}
  ${row("Email", appointment.patient.email || "—")}
  ${row("Teléfono", appointment.patient.phone || "—")}
  ${row("Fecha", formatDate(appointment.startAt))}
  ${row("Hora", `${formatTime(appointment.startAt)} – ${formatTime(appointment.endAt)} hs`)}
  ${row("Tipo", typeStr)}
  ${row("Sede / Link", locationStr)}
  ${row("Profesional", appointment.professional.fullName)}
  ${row("Estado", appointment.status)}
</table>`;

            if (event === "RESCHEDULED" && options?.previousStartAt) {
                body += `<p style="margin-top:16px;font-size:14px"><b>Horario anterior:</b> ${formatDate(options.previousStartAt)} ${formatTime(options.previousStartAt)} hs</p>`;
            }

            if (event === "CANCELLED") {
                body += `<p style="margin-top:16px;font-size:14px"><b>Motivo:</b> ${escapeHtml(options?.reason || appointment.cancellationReason || "No especificado")}</p>`;
            }

            const sent = await notifyAdmin({
                subject: `${EVENT_LABELS[event]} · ${patientName} · ${formatDate(appointment.startAt)} ${formatTime(appointment.startAt)} hs`,
                html: wrapHtml(EVENT_LABELS[event], body),
            });

            // Aviso inmediato por WhatsApp al profesional (solo si configuró CallMeBot).
            try {
                const { sendDirectNotification } = await import("@/lib/whatsapp-sender");
                const waMessage = [
                    EVENT_LABELS[event],
                    `👤 ${patientName}`,
                    `📅 ${formatDate(appointment.startAt)} · ${formatTime(appointment.startAt)} hs`,
                    `📞 ${appointment.patient.phone || "Sin celular"}`,
                    appointment.type === "ONLINE" ? "💻 Online" : `📍 ${locationStr}`,
                ].join("\n");
                await sendDirectNotification(
                    appointment.professionalId,
                    `APPOINTMENT_${event}`,
                    waMessage,
                );
            } catch {
                // el aviso por WhatsApp es opcional: nunca interrumpe el flujo
            }

            return sent;
        } catch (error) {
            console.error(
                "[notification] Error notificando turno:",
                error instanceof Error ? error.message : error,
            );
            return false;
        }
    },

    /**
     * Envía la confirmación de reserva al paciente. Solo se envía si el
     * paciente tiene un email cargado. Nunca lanza.
     */
    async notifyPatientBooking(appointmentId: string): Promise<boolean> {
        try {
            const appointment = await prisma.appointment.findUnique({
                where: { id: appointmentId },
                include: {
                    patient: {
                        select: { firstName: true, email: true },
                    },
                    professional: { select: { fullName: true } },
                    sede: { select: { name: true, address: true } },
                },
            });

            if (!appointment?.patient.email) return false;

            const typeStr =
                appointment.type === "ONLINE" ? "Online" : "Presencial";
            const locationStr =
                appointment.type === "ONLINE"
                    ? appointment.meetingUrl || "Te enviaremos el link de la videollamada."
                    : appointment.sede
                      ? `${appointment.sede.name} — ${appointment.sede.address}`
                      : appointment.location || "A confirmar";

            const body = `<p style="margin:0 0 16px;font-size:15px">Hola ${escapeHtml(
                appointment.patient.firstName,
            )}, tu turno quedó reservado. Mauro lo va a confirmar y te contactaremos por WhatsApp al número que dejaste. Te esperamos.</p>
<table style="border-collapse:collapse;width:100%">
  ${row("Fecha", formatDate(appointment.startAt))}
  ${row("Hora", `${formatTime(appointment.startAt)} – ${formatTime(appointment.endAt)} hs`)}
  ${row("Tipo", typeStr)}
  ${row("Sede / Link", locationStr)}
  ${row("Profesional", appointment.professional.fullName)}
  ${row("Estado", "Pendiente de confirmación por el profesional")}
</table>
<p style="margin-top:16px;font-size:13px;color:#64748b">Podés gestionar tus turnos desde tu portal de paciente.</p>`;

            return await sendEmail({
                to: appointment.patient.email,
                subject: `Turno reservado · ${formatDate(appointment.startAt)} ${formatTime(appointment.startAt)} hs`,
                html: wrapHtml("Turno reservado", body),
            });
        } catch (error) {
            console.error(
                "[notification] Error notificando turno al paciente:",
                error instanceof Error ? error.message : error,
            );
            return false;
        }
    },

    /**
     * Notifica al administrador que un paciente completó su check-in semanal.
     */
    async notifyFollowUpSubmitted(patientId: string): Promise<boolean> {
        try {
            const patient = await prisma.patient.findUnique({
                where: { id: patientId },
                select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                },
            });

            if (!patient) return false;

            const patientName = `${patient.firstName} ${patient.lastName}`;
            const body = `<table style="border-collapse:collapse;width:100%">
  ${row("Paciente", patientName)}
  ${row("Email", patient.email || "—")}
  ${row("Teléfono", patient.phone || "—")}
</table>
<p style="margin-top:16px;font-size:14px">El paciente completó su <b>seguimiento semanal</b>. Ingresá al dashboard para revisarlo.</p>`;

            return await notifyAdmin({
                subject: `📝 Seguimiento semanal recibido · ${patientName}`,
                html: wrapHtml("📝 Nuevo seguimiento semanal", body),
            });
        } catch (error) {
            console.error(
                "[notification] Error notificando seguimiento:",
                error instanceof Error ? error.message : error,
            );
            return false;
        }
    },
};
