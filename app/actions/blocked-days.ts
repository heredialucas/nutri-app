"use server";

import { blockedDayService } from "@/services/blocked-day-service";
import { professionalService } from "@/services/professional-service";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { serializePrisma } from "@/lib/utils";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

async function requireAuth(permission: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error("No autenticado");
    if (!hasPermission(user, permission)) {
        throw new Error("No tienes permisos para esta acción");
    }
    return user;
}

function revalidateBlockedDayPaths() {
    revalidatePath("/dashboard/turnos/calendario");
    revalidatePath("/dashboard/turnos");
    revalidatePath("/reservar/horario");
}

export async function getBlockedDays(from: string, to: string) {
    await requireAuth("availability:read");
    if (!DATE_RE.test(from) || !DATE_RE.test(to)) {
        throw new Error("Rango de fechas inválido");
    }
    const professionalId = await professionalService.getDefaultProfessionalId();
    const days = await blockedDayService.listByRange(professionalId, from, to);
    return serializePrisma(days);
}

export async function blockDay(data: { date: string; reason?: string }) {
    await requireAuth("availability:manage");
    if (!DATE_RE.test(data.date)) throw new Error("Fecha inválida");

    const professionalId = await professionalService.getDefaultProfessionalId();
    const day = await blockedDayService.create({
        professionalId,
        date: data.date,
        reason: data.reason,
    });

    revalidateBlockedDayPaths();
    return serializePrisma(day);
}

export async function unblockDay(id: string) {
    await requireAuth("availability:manage");
    if (!id) throw new Error("Bloqueo inválido");

    await blockedDayService.delete(id);
    revalidateBlockedDayPaths();
    return { success: true };
}
