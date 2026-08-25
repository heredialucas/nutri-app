"use server";

import { waitlistService } from "@/services/waitlist-service";
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

export async function getWaitlist() {
    await requireAuth("patients:read");
    const entries = await waitlistService.list();
    return serializePrisma(entries);
}

export async function addToWaitlist(patientId: string) {
    await requireAuth("patients:update");
    if (!patientId) throw new Error("El paciente es obligatorio");

    const entry = await waitlistService.add(patientId);
    revalidatePath("/dashboard/waitlist");
    return serializePrisma(entry);
}

export async function removeFromWaitlist(patientId: string) {
    await requireAuth("patients:update");
    await waitlistService.remove(patientId);
    revalidatePath("/dashboard/waitlist");
    return { success: true };
}

export async function checkWaitlistStatus(patientId: string) {
    await requireAuth("patients:read");
    return waitlistService.isInWaitlist(patientId);
}

export async function getWaitlistCount() {
    await requireAuth("patients:read");
    return waitlistService.getCount();
}
