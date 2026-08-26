import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { whatsappSettingsService } from "@/lib/whatsapp-settings";
import { sendWhatsAppMessage } from "@/lib/whatsapp-sender";

export async function POST() {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const settings = await whatsappSettingsService.getRaw(user.id);

    if (!settings) {
        return NextResponse.json(
            {
                error:
                    "No tenés configuración de WhatsApp guardada. Configurala primero.",
            },
            { status: 400 },
        );
    }

    try {
        const message =
            "✅ *Mensaje de prueba*\n\n" +
            "Si ves este mensaje, tu WhatsApp está configurado correctamente.\n\n" +
            "— Mauro Acosta — Gestión nutricional";

        await sendWhatsAppMessage(
            settings.phone,
            settings.apiKey,
            message,
        );

        return NextResponse.json({ ok: true });
    } catch (error) {
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Error al enviar",
            },
            { status: 500 },
        );
    }
}
