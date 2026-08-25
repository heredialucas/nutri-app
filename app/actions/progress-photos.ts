"use server";

import { progressService } from "@/services/progress-service";
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

export async function getProgressPhotos(patientId: string) {
    await requireAuth("patients:read");
    const photos = await progressService.getByPatient(patientId);
    return serializePrisma(photos);
}

export async function createProgressPhoto(data: {
    patientId: string;
    url: string;
    publicId: string;
    type: string;
    takenAt?: string;
    consentGranted?: boolean;
}) {
    await requireAuth("measurements:create");

    const user = await getCurrentUser();
    const result = await progressService.create({
        ...data,
        uploadedById: user?.id,
        takenAt: data.takenAt ? new Date(data.takenAt) : undefined,
    });

    revalidatePath(`/dashboard/pacientes/${data.patientId}`);
    revalidatePath(`/dashboard/pacientes/${data.patientId}/evolucion`);
    return serializePrisma(result);
}

export async function deleteProgressPhoto(id: string) {
    await requireAuth("measurements:delete");
    await progressService.delete(id);
    revalidatePath(`/dashboard/pacientes`);
    return { success: true };
}

export async function getProgressPhotosGrouped(patientId: string) {
    await requireAuth("patients:read");
    const grouped = await progressService.getGroupedByType(patientId);
    return grouped;
}
