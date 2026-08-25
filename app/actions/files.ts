"use server";

import { fileService } from "@/services/file-service";
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

export async function getPatientFiles(patientId: string) {
    await requireAuth("patients:read");
    const files = await fileService.getByPatient(patientId);
    return serializePrisma(files);
}

export async function getPatientFileById(id: string) {
    await requireAuth("patients:read");
    const file = await fileService.getById(id);
    if (!file) throw new Error("Archivo no encontrado");
    return serializePrisma(file);
}

export async function uploadPatientFile(data: {
    patientId: string;
    name: string;
    url: string;
    publicId?: string;
    mimeType?: string;
    size?: number;
    category?: string;
}) {
    await requireAuth("patients:update");

    const user = await getCurrentUser();
    const file = await fileService.create({
        ...data,
        uploadedById: user?.id,
    });

    revalidatePath(`/dashboard/patients/${data.patientId}`);
    return serializePrisma(file);
}

export async function deletePatientFile(id: string) {
    await requireAuth("patients:update");
    await fileService.delete(id);
    revalidatePath(`/dashboard/patients`);
    return { success: true };
}
