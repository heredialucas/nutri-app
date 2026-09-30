const RESEND_API = "https://api.resend.com/emails";

export function getNotificationRecipient(): string {
    return (
        process.env.NOTIFICATION_EMAIL || "nutricionmauroacosta@gmail.com"
    );
}

type SendEmailInput = {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
    replyTo?: string;
};

/**
 * Envía un email vía Resend. Nunca lanza: devuelve true/false y loguea el
 * error, para no romper flujos de negocio (reservas, cancelaciones, etc.).
 */
export async function sendEmail({
    to,
    subject,
    html,
    from,
    replyTo,
}: SendEmailInput): Promise<boolean> {
    const apiKey = process.env.RESEND_API_KEY;
    const fromAddress = from || process.env.RESEND_FROM_EMAIL;

    if (!apiKey || !fromAddress) {
        console.error(
            "[email] Faltan RESEND_API_KEY o RESEND_FROM_EMAIL. Email no enviado.",
        );
        return false;
    }

    try {
        const response = await fetch(RESEND_API, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: fromAddress,
                to: Array.isArray(to) ? to : [to],
                subject,
                html,
                ...(replyTo ? { reply_to: replyTo } : {}),
            }),
        });

        if (!response.ok) {
            const body = await response.text().catch(() => "");
            console.error(
                `[email] Resend error ${response.status}: ${body.slice(0, 300)}`,
            );
            return false;
        }

        return true;
    } catch (error) {
        console.error(
            "[email] Error enviando email:",
            error instanceof Error ? error.message : error,
        );
        return false;
    }
}

/**
 * Notifica al buzón de administración (NOTIFICATION_EMAIL). Todas las
 * notificaciones del sistema llegan a esta dirección.
 */
export async function notifyAdmin({
    subject,
    html,
}: {
    subject: string;
    html: string;
}): Promise<boolean> {
    return sendEmail({ to: getNotificationRecipient(), subject, html });
}
