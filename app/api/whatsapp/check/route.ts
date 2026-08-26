import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { reminderService } from "@/services/reminder-service";

export async function POST() {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    try {
        const results = await reminderService.checkAndSendForUser(user.id);
        return NextResponse.json({ ok: true, results });
    } catch (error) {
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Error al procesar",
            },
            { status: 500 },
        );
    }
}
