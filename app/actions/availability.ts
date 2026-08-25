"use server";

import { availabilityService } from "@/services/availability-service";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { serializePrisma } from "@/lib/utils";

async function requireAuth(permission?: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error("No autenticado");
    if (permission && !hasPermission(user, permission)) {
        throw new Error("No tienes permisos para esta acción");
    }
    return user;
}

export async function getAvailability(professionalId?: string) {
    const user = await requireAuth("availability:read");
    const targetId = professionalId || user.id;

    const availability = await availabilityService.getByProfessional(targetId);
    return serializePrisma(availability);
}

export async function createAvailabilitySlot(data: {
    professionalId?: string;
    weekday: number;
    startTime: string;
    endTime: string;
    slotDuration?: number;
}) {
    const user = await requireAuth("availability:manage");

    const result = await availabilityService.create({
        professionalId: data.professionalId || user.id,
        weekday: data.weekday,
        startTime: data.startTime,
        endTime: data.endTime,
        slotDuration: data.slotDuration || 30,
    });

    revalidatePath("/dashboard/availability");
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
    revalidatePath("/dashboard/availability");
    return serializePrisma(result);
}

export async function deleteAvailabilitySlot(id: string) {
    await requireAuth("availability:manage");
    await availabilityService.delete(id);
    revalidatePath("/dashboard/availability");
    return { success: true };
}

export async function getAvailableSlots(professionalId: string, date: string) {
    // Este endpoint es público para que los pacientes puedan ver horarios disponibles
    const slots = await availabilityService.getAvailableSlots(professionalId, new Date(date));
    return slots;
}
