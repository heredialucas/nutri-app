"use server";

import { consentService } from "@/services/consent-service";
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

export async function getConsents(patientId: string) {
    await requireAuth("patients:read");
    const consents = await consentService.getByPatient(patientId);
    return serializePrisma(consents);
}

export async function getConsentById(id: string) {
    await requireAuth("patients:read");
    const consent = await consentService.getById(id);
    if (!consent) throw new Error("Consentimiento no encontrado");
    return serializePrisma(consent);
}

export async function createConsent(data: {
    patientId: string;
    type: string;
    version?: string;
    signature?: string;
    ipAddress?: string;
    documentUrl?: string;
}) {
    await requireAuth("patients:update");

    if (!data.patientId) throw new Error("El paciente es obligatorio");
    if (!data.type?.trim()) throw new Error("El tipo de consentimiento es obligatorio");

    const consent = await consentService.create(data);
    revalidatePath(`/dashboard/pacientes/${data.patientId}`);
    return serializePrisma(consent);
}

export async function checkActiveConsent(patientId: string, type: string) {
    await requireAuth("patients:read");
    return consentService.hasActiveConsent(patientId, type);
}

export async function deleteConsent(id: string) {
    await requireAuth("patients:update");
    await consentService.delete(id);
    revalidatePath(`/dashboard/pacientes`);
    return { success: true };
}
