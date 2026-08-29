"use server";

import { getCurrentUser, hasPermission } from "@/lib/auth";
import { whatsappSettingsService } from "@/lib/whatsapp-settings";
import { sendWhatsAppMessage } from "@/lib/whatsapp-sender";
import { reminderService } from "@/services/reminder-service";

async function requireAuth() {
    const user = await getCurrentUser();
    if (!user) throw new Error("No autenticado");
    return user;
}

export async function getWhatsAppSettings() {
    const user = await requireAuth();
    return whatsappSettingsService.getMasked(user.id);
}

export async function saveWhatsAppSettings(data: {
    phone: string;
    apiKey: string;
    enabled?: boolean;
    notifTurnosHoy?: boolean;
    notifTurnosManana?: boolean;
    notifSeguimientosPendientes?: boolean;
    notifPacientesInactivos?: boolean;
    notifPlanDelDia?: boolean;
    notifTurno24h?: boolean;
    notifTurno2h?: boolean;
    notifTipsRecetas?: boolean;
    notifSeguimientoSemanal?: boolean;
}) {
    const user = await requireAuth();

    const existing = await whatsappSettingsService.getRaw(user.id);

    if (existing && data.apiKey === "___unchanged___") {
        data.apiKey = existing.apiKey;
    }

    if (!data.phone.trim()) {
        throw new Error("El teléfono es obligatorio");
    }
    if (!data.apiKey.trim()) {
        throw new Error("La API key es obligatoria");
    }

    await whatsappSettingsService.save(user.id, data.phone, data.apiKey, {
        enabled: data.enabled,
        notifTurnosHoy: data.notifTurnosHoy,
        notifTurnosManana: data.notifTurnosManana,
        notifSeguimientosPendientes: data.notifSeguimientosPendientes,
        notifPacientesInactivos: data.notifPacientesInactivos,
        notifPlanDelDia: data.notifPlanDelDia,
        notifTurno24h: data.notifTurno24h,
        notifTurno2h: data.notifTurno2h,
        notifTipsRecetas: data.notifTipsRecetas,
        notifSeguimientoSemanal: data.notifSeguimientoSemanal,
    });

    return { ok: true };
}

export async function deleteWhatsAppSettings() {
    const user = await requireAuth();
    await whatsappSettingsService.delete(user.id);
    return { ok: true };
}

export async function sendTestWhatsApp() {
    const user = await requireAuth();
    const settings = await whatsappSettingsService.getRaw(user.id);

    if (!settings) {
        throw new Error(
            "No tenés configuración de WhatsApp guardada. Configurala primero.",
        );
    }

    const message =
        "✅ *Mensaje de prueba*\n\n" +
        "Si ves este mensaje, tu WhatsApp está configurado correctamente.\n\n" +
        "— Mauro Acosta — Gestión nutricional";

    await sendWhatsAppMessage(settings.phone, settings.apiKey, message);

    return { ok: true };
}

export async function triggerReminders() {
    const user = await requireAuth();
    return reminderService.checkAndSendForUser(user.id);
}

/**
 * Envía al WhatsApp del paciente (si lo tiene configurado) un resumen con
 * sus comidas del día, tips y recordatorios de la app. Solo profesionales.
 */
export async function sendDailySummaryToPatient(patientId: string) {
    const user = await requireAuth();

    if (!hasPermission(user, "patients:read")) {
        throw new Error("No tenés permisos para realizar esta acción");
    }

    const result = await reminderService.sendManualDailySummary(patientId);

    if (!result.sent) {
        throw new Error(result.reason);
    }

    return { ok: true, reason: result.reason };
}
