"use server";

import { followupService } from "@/services/followup-service";
import { getCurrentUser, hasPermission, isPatientUser } from "@/lib/auth";
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

export async function getFollowUps(patientId: string) {
    await requireAuth("patients:read");
    const followUps = await followupService.getByPatient(patientId);
    return serializePrisma(followUps);
}

export async function getAllFollowUps() {
    await requireAuth("followups:read");
    const followUps = await followupService.getAll();
    return serializePrisma(followUps);
}

export async function getFollowUpById(id: string) {
    await requireAuth("patients:read");
    const followUp = await followupService.getById(id);
    if (!followUp) throw new Error("Seguimiento no encontrado");
    return serializePrisma(followUp);
}

export async function createFollowUp(data: {
    patientId: string;
    weekStart: string;
    weight?: number;
    adherence?: string;
    hunger?: string;
    energy?: string;
    difficulties?: string;
    patientNotes?: string;
    proNotes?: string;
}) {
    await requireAuth("followups:create");

    if (!data.patientId) throw new Error("El paciente es obligatorio");
    if (!data.weekStart) throw new Error("La fecha de inicio es obligatoria");

    const followUp = await followupService.create({
        ...data,
        weekStart: new Date(data.weekStart),
    });

    revalidatePath(`/dashboard/pacientes/${data.patientId}`);
    return serializePrisma(followUp);
}

export async function updateFollowUp(id: string, data: {
    weight?: number;
    adherence?: string;
    hunger?: string;
    energy?: string;
    difficulties?: string;
    patientNotes?: string;
    proNotes?: string;
}) {
    await requireAuth("followups:update");
    const followUp = await followupService.update(id, data);
    revalidatePath(`/dashboard/pacientes`);
    return serializePrisma(followUp);
}

export async function deleteFollowUp(id: string) {
    await requireAuth("followups:delete");
    await followupService.delete(id);
    revalidatePath(`/dashboard/pacientes`);
    return { success: true };
}
