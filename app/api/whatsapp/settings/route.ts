import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { whatsappSettingsService } from "@/lib/whatsapp-settings";

export async function GET() {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const settings = await whatsappSettingsService.getMasked(user.id);

    return NextResponse.json({
        hasSettings: !!settings,
        phone: settings?.maskedPhone ?? null,
        enabled: settings?.enabled ?? false,
        preferences: settings
            ? {
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
              }
            : null,
    });
}

export async function POST(req: Request) {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { phone, apiKey, ...preferences } = body;

        if (!phone?.trim()) {
            return NextResponse.json(
                { error: "El teléfono es obligatorio" },
                { status: 400 },
            );
        }

        const existing = await whatsappSettingsService.getRaw(user.id);

        const finalApiKey =
            apiKey === "___unchanged___" || !apiKey
                ? existing?.apiKey
                : apiKey;

        if (!finalApiKey) {
            return NextResponse.json(
                { error: "La API key es obligatoria" },
                { status: 400 },
            );
        }

        await whatsappSettingsService.save(
            user.id,
            phone,
            finalApiKey,
            preferences,
        );

        return NextResponse.json({ ok: true });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Error" },
            { status: 500 },
        );
    }
}

export async function DELETE() {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    await whatsappSettingsService.delete(user.id);
    return NextResponse.json({ ok: true });
}
