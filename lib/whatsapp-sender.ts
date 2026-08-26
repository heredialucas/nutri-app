import { whatsappSettingsService } from "./whatsapp-settings";

const CALLMEBOT_API = "https://api.callmebot.com/whatsapp.php";

export async function sendWhatsAppMessage(
    phone: string,
    apiKey: string,
    text: string,
): Promise<void> {
    const url = `${CALLMEBOT_API}?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(
            `CallMeBot error ${res.status}: ${body.slice(0, 200)}`,
        );
    }

    const body = await res.text();
    if (
        !body.includes("Message queued") &&
        !body.includes("API activada")
    ) {
        const match = body.match(/<b>(.*?)<\/b>/);
        const reason = match
            ? match[1]
            : body.replace(/<[^>]+>/g, "").trim().slice(0, 200);
        throw new Error(`CallMeBot: ${reason}`);
    }
}

export async function sendNotification(
    userId: string,
    type: string,
    message: string,
): Promise<{ sent: boolean; reason: string }> {
    const settings = await whatsappSettingsService.getRaw(userId);

    if (!settings) {
        return { sent: false, reason: "WhatsApp no configurado" };
    }

    if (!settings.enabled) {
        return { sent: false, reason: "WhatsApp deshabilitado" };
    }

    const alreadySent =
        await whatsappSettingsService.wasAlreadySentToday(userId, type);
    if (alreadySent) {
        return { sent: false, reason: "Ya enviado hoy" };
    }

    try {
        await sendWhatsAppMessage(settings.phone, settings.apiKey, message);

        await whatsappSettingsService.logNotification({
            userId,
            type,
            recipient: settings.phone,
            message,
            status: "SENT",
        });

        return { sent: true, reason: "Enviado" };
    } catch (error) {
        const errorMsg =
            error instanceof Error ? error.message : "Error desconocido";

        await whatsappSettingsService.logNotification({
            userId,
            type,
            recipient: settings.phone,
            message,
            status: "FAILED",
            error: errorMsg,
        });

        return { sent: false, reason: errorMsg };
    }
}
