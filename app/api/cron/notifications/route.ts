import { NextResponse } from "next/server";
import { reminderService } from "@/services/reminder-service";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
    const secret = process.env.CRON_SECRET;
    if (!secret) return false;

    const auth = request.headers.get("authorization");
    if (auth === `Bearer ${secret}`) return true;

    const headerSecret = request.headers.get("x-cron-secret");
    return headerSecret === secret;
}

async function run(request: Request) {
    if (!isAuthorized(request)) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const results = await reminderService.runScheduledForAll();
        return NextResponse.json({ ok: true, processed: results.length, results });
    } catch (error) {
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Error al procesar recordatorios",
            },
            { status: 500 },
        );
    }
}

export async function GET(request: Request) {
    return run(request);
}

export async function POST(request: Request) {
    return run(request);
}
