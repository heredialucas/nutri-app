"use server";

import { availabilityService } from "@/services/availability-service";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { serializePrisma } from "@/lib/utils";
import { fromZonedTime } from "date-fns-tz";

const AR_TZ = "America/Argentina/Buenos_Aires";

async function requireAuth(permission?: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error("No autenticado");
    if (permission && !hasPermission(user, permission)) {
        throw new Error("No tienes permisos para esta acción");
    }
    return user;
}

export async function getAvailability(professionalId?: string, locationId?: string | null) {
    const user = await requireAuth("availability:read");
    const targetId = professionalId || user.id;

    const availability = await availabilityService.getByProfessional(targetId, locationId ?? null);
    return serializePrisma(availability);
}

export async function getAllAvailability(professionalId?: string) {
    const user = await requireAuth("availability:read");
    const targetId = professionalId || user.id;

    const availability = await availabilityService.getAllByProfessional(targetId);
    return serializePrisma(availability);
}

export async function createAvailabilitySlot(data: {
    professionalId?: string;
    locationId?: string | null;
    weekday: number;
    startTime: string;
    endTime: string;
    slotDuration?: number;
}) {
    const user = await requireAuth("availability:manage");

    const result = await availabilityService.create({
        professionalId: data.professionalId || user.id,
        locationId: data.locationId ?? null,
        weekday: data.weekday,
        startTime: data.startTime,
        endTime: data.endTime,
        slotDuration: data.slotDuration || 30,
    });

    revalidatePath("/dashboard/turnos/disponibilidad");
    return serializePrisma(result);
}

export async function updateAvailabilitySlot(id: string, data: {
    startTime?: string;
    endTime?: string;
    slotDuration?: number;
    isActive?: boolean;
}) {
    await requireAuth("availability:manage");
    const result = await availabilityService.update(id, data);
    revalidatePath("/dashboard/turnos/disponibilidad");
    return serializePrisma(result);
}

export async function deleteAvailabilitySlot(id: string) {
    await requireAuth("availability:manage");
    await availabilityService.delete(id);
    revalidatePath("/dashboard/turnos/disponibilidad");
    return { success: true };
}

export async function getAvailableSlots(
    professionalId: string,
    date: string,
    locationId?: string | null,
    opts?: { duration?: number; excludeAppointmentId?: string },
) {
    // date string is the Argentina-local date (e.g. "2026-08-27")
    const [y, m, d] = date.split("-").map(Number);
    const localNoon = new Date(y, m - 1, d, 12, 0, 0);
    const utcDate = fromZonedTime(localNoon, AR_TZ);
    const slots = await availabilityService.getAvailableSlots(
        professionalId,
        utcDate,
        locationId ?? null,
        opts,
    );
    return slots;
}
