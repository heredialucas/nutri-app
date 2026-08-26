import prisma from "@/lib/prisma";
import {
    createCipheriv,
    createDecipheriv,
    randomBytes,
    scryptSync,
} from "node:crypto";

const ENCRYPTION_KEY = process.env.WHATSAPP_ENCRYPTION_KEY;
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT = "nutri-app-whatsapp-salt-v1";

export type WhatsAppSettings = {
    phone: string;
    apiKey: string;
    enabled: boolean;
    notifTurnosHoy: boolean;
    notifTurnosManana: boolean;
    notifSeguimientosPendientes: boolean;
    notifPacientesInactivos: boolean;
    notifPlanDelDia: boolean;
    notifTurno24h: boolean;
    notifTurno2h: boolean;
    notifTipsRecetas: boolean;
    notifSeguimientoSemanal: boolean;
};

function getKey(): Buffer {
    if (!ENCRYPTION_KEY) {
        throw new Error("WHATSAPP_ENCRYPTION_KEY no configurada en el server");
    }
    return scryptSync(ENCRYPTION_KEY, SALT, 32);
}

function encrypt(text: string): string {
    const key = getKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
        cipher.update(text, "utf8"),
        cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

function decrypt(encoded: string): string {
    const key = getKey();
    const buf = Buffer.from(encoded, "base64");
    const iv = buf.subarray(0, IV_LENGTH);
    const tag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
    ]).toString("utf8");
}

function maskPhone(phone: string): string {
    if (phone.length < 6) return "***";
    return phone.slice(0, 3) + "***" + phone.slice(-3);
}

export const whatsappSettingsService = {
    async save(
        userId: string,
        phone: string,
        apiKey: string,
        preferences: Partial<Omit<WhatsAppSettings, "phone" | "apiKey">>,
    ): Promise<void> {
        const encryptedPhone = encrypt(phone.trim());
        const encryptedApiKey = encrypt(apiKey.trim());

        await prisma.whatsAppSetting.upsert({
            where: { userId },
            create: {
                userId,
                encryptedPhone,
                encryptedApiKey,
                enabled: preferences.enabled ?? true,
                notifTurnosHoy: preferences.notifTurnosHoy ?? true,
                notifTurnosManana: preferences.notifTurnosManana ?? true,
                notifSeguimientosPendientes:
                    preferences.notifSeguimientosPendientes ?? true,
                notifPacientesInactivos:
                    preferences.notifPacientesInactivos ?? false,
                notifPlanDelDia: preferences.notifPlanDelDia ?? true,
                notifTurno24h: preferences.notifTurno24h ?? true,
                notifTurno2h: preferences.notifTurno2h ?? true,
                notifTipsRecetas: preferences.notifTipsRecetas ?? false,
                notifSeguimientoSemanal:
                    preferences.notifSeguimientoSemanal ?? true,
            },
            update: {
                encryptedPhone,
                encryptedApiKey,
                enabled: preferences.enabled,
                notifTurnosHoy: preferences.notifTurnosHoy,
                notifTurnosManana: preferences.notifTurnosManana,
                notifSeguimientosPendientes:
                    preferences.notifSeguimientosPendientes,
                notifPacientesInactivos: preferences.notifPacientesInactivos,
                notifPlanDelDia: preferences.notifPlanDelDia,
                notifTurno24h: preferences.notifTurno24h,
                notifTurno2h: preferences.notifTurno2h,
                notifTipsRecetas: preferences.notifTipsRecetas,
                notifSeguimientoSemanal: preferences.notifSeguimientoSemanal,
            },
        });
    },

    async get(userId: string): Promise<WhatsAppSettings | null> {
        const record = await prisma.whatsAppSetting.findUnique({
            where: { userId },
        });
        if (!record) return null;

        try {
            return {
                phone: decrypt(record.encryptedPhone),
                apiKey: decrypt(record.encryptedApiKey),
                enabled: record.enabled,
                notifTurnosHoy: record.notifTurnosHoy,
                notifTurnosManana: record.notifTurnosManana,
                notifSeguimientosPendientes:
                    record.notifSeguimientosPendientes,
                notifPacientesInactivos: record.notifPacientesInactivos,
                notifPlanDelDia: record.notifPlanDelDia,
                notifTurno24h: record.notifTurno24h,
                notifTurno2h: record.notifTurno2h,
                notifTipsRecetas: record.notifTipsRecetas,
                notifSeguimientoSemanal: record.notifSeguimientoSemanal,
            };
        } catch {
            return null;
        }
    },

    async getMasked(
        userId: string,
    ): Promise<Omit<WhatsAppSettings, "apiKey"> & { maskedPhone: string } | null> {
        const settings = await this.get(userId);
        if (!settings) return null;
        return {
            phone: settings.phone,
            maskedPhone: maskPhone(settings.phone),
            enabled: settings.enabled,
            notifTurnosHoy: settings.notifTurnosHoy,
            notifTurnosManana: settings.notifTurnosManana,
            notifSeguimientosPendientes:
                settings.notifSeguimientosPendientes,
            notifPacientesInactivos: settings.notifPacientesInactivos,
            notifPlanDelDia: settings.notifPlanDelDia,
            notifTurno24h: settings.notifTurno24h,
            notifTurno2h: settings.notifTurno2h,
            notifTipsRecetas: settings.notifTipsRecetas,
            notifSeguimientoSemanal: settings.notifSeguimientoSemanal,
        };
    },

    async getRaw(userId: string): Promise<WhatsAppSettings | null> {
        return this.get(userId);
    },

    async delete(userId: string): Promise<void> {
        await prisma.whatsAppSetting.deleteMany({ where: { userId } });
    },

    async hasSettings(userId: string): Promise<boolean> {
        const count = await prisma.whatsAppSetting.count({
            where: { userId },
        });
        return count > 0;
    },

    async logNotification(data: {
        userId: string;
        type: string;
        recipient: string;
        message: string;
        status: string;
        error?: string;
    }) {
        await prisma.notificationLog.create({
            data: {
                userId: data.userId,
                type: data.type,
                recipient: maskPhone(data.recipient),
                message: data.message,
                status: data.status,
                error: data.error,
            },
        });
    },

    async wasAlreadySentToday(
        userId: string,
        type: string,
    ): Promise<boolean> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const log = await prisma.notificationLog.findFirst({
            where: {
                userId,
                type,
                status: "SENT",
                sentAt: { gte: today },
            },
        });

        return !!log;
    },
};
