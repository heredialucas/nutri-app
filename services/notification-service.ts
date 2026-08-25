/**
 * Servicio de notificaciones.
 * Actualmente es mock — enviará emails/WhatsApp en producción.
 * Integrar con servicio de email (Resend, SendGrid) y WhatsApp API.
 */

export const notificationService = {
    async sendAppointmentReminder(data: {
        patientEmail: string;
        patientName: string;
        date: Date;
        time: string;
        type: "IN_PERSON" | "ONLINE";
        meetingUrl?: string;
    }) {
        console.log(`[NOTIFICATION] Recordatorio de turno para ${data.patientName} (${data.patientEmail})`);
        console.log(`  Fecha: ${data.date.toISOString().split("T")[0]} a las ${data.time}`);
        console.log(`  Tipo: ${data.type}`);
        if (data.meetingUrl) console.log(`  Link: ${data.meetingUrl}`);
        // TODO: Integrar con servicio de email real
        return { sent: true };
    },

    async sendFollowupReminder(data: {
        patientEmail: string;
        patientName: string;
    }) {
        console.log(`[NOTIFICATION] Recordatorio de seguimiento para ${data.patientName} (${data.patientEmail})`);
        return { sent: true };
    },

    async sendPaymentReminder(data: {
        patientEmail: string;
        patientName: string;
        amount: number;
    }) {
        console.log(`[NOTIFICATION] Recordatorio de pago para ${data.patientName}: $${data.amount}`);
        return { sent: true };
    },

    async notifyNewPlan(data: {
        patientEmail: string;
        patientName: string;
        planTitle: string;
    }) {
        console.log(`[NOTIFICATION] Nuevo plan alimentario "${data.planTitle}" para ${data.patientName}`);
        return { sent: true };
    },
};
