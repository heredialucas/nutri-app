"use server";

import { medicalHistoryService } from "@/services/medical-history-service";
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

// ==================== HISTORIA CLÍNICA ====================

export async function getMedicalHistory(patientId: string) {
    await requireAuth("patients:read");
    const history = await medicalHistoryService.getByPatientId(patientId);
    return serializePrisma(history);
}

export async function upsertMedicalHistory(patientId: string, data: {
    familyHistory?: string;
    personalHistory?: string;
    surgeries?: string;
    diagnoses?: string;
    habits?: string;
    sleepHours?: string;
    physicalActivity?: string;
    digestiveSymptoms?: string;
    observations?: string;
}) {
    await requireAuth("patients:update");
    const result = await medicalHistoryService.upsert(patientId, data);
    revalidatePath(`/dashboard/patients/${patientId}`);
    return serializePrisma(result);
}

// ==================== ALERGIAS ====================

export async function getAllergies(patientId: string) {
    await requireAuth("patients:read");
    const allergies = await medicalHistoryService.getPatientAllergies(patientId);
    return serializePrisma(allergies);
}

export async function addAllergy(patientId: string, data: { name: string; reaction?: string; severity?: string; notes?: string }) {
    await requireAuth("patients:update");
    if (!data.name?.trim()) throw new Error("El nombre de la alergia es obligatorio");
    const result = await medicalHistoryService.addAllergy(patientId, data);
    revalidatePath(`/dashboard/patients/${patientId}`);
    return serializePrisma(result);
}

export async function updateAllergy(id: string, data: { name?: string; reaction?: string; severity?: string; notes?: string }) {
    await requireAuth("patients:update");
    const result = await medicalHistoryService.updateAllergy(id, data);
    revalidatePath(`/dashboard/patients`);
    return serializePrisma(result);
}

export async function deleteAllergy(id: string) {
    await requireAuth("patients:update");
    await medicalHistoryService.deleteAllergy(id);
    revalidatePath(`/dashboard/patients`);
    return { success: true };
}

// ==================== MEDICACIONES ====================

export async function getMedications(patientId: string) {
    await requireAuth("patients:read");
    const meds = await medicalHistoryService.getPatientMedications(patientId);
    return serializePrisma(meds);
}

export async function addMedication(patientId: string, data: {
    name: string;
    dosage?: string;
    frequency?: string;
    indication?: string;
    startDate?: string;
    endDate?: string;
    notes?: string;
}) {
    await requireAuth("patients:update");
    if (!data.name?.trim()) throw new Error("El nombre del medicamento es obligatorio");
    const result = await medicalHistoryService.addMedication(patientId, {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
    });
    revalidatePath(`/dashboard/patients/${patientId}`);
    return serializePrisma(result);
}

export async function updateMedication(id: string, data: {
    name?: string;
    dosage?: string;
    frequency?: string;
    indication?: string;
    startDate?: string;
    endDate?: string;
    notes?: string;
}) {
    await requireAuth("patients:update");
    const result = await medicalHistoryService.updateMedication(id, {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
    });
    revalidatePath(`/dashboard/patients`);
    return serializePrisma(result);
}

export async function deleteMedication(id: string) {
    await requireAuth("patients:update");
    await medicalHistoryService.deleteMedication(id);
    revalidatePath(`/dashboard/patients`);
    return { success: true };
}

// ==================== OBJETIVOS ====================

export async function getGoals(patientId: string) {
    await requireAuth("patients:read");
    const goals = await medicalHistoryService.getPatientGoals(patientId);
    return serializePrisma(goals);
}

export async function addGoal(patientId: string, data: {
    type: string;
    description?: string;
    targetValue?: string;
    targetDate?: string;
}) {
    await requireAuth("patients:update");
    if (!data.type?.trim()) throw new Error("El tipo de objetivo es obligatorio");
    const result = await medicalHistoryService.addGoal(patientId, {
        ...data,
        targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
    });
    revalidatePath(`/dashboard/patients/${patientId}`);
    return serializePrisma(result);
}

export async function updateGoal(id: string, data: {
    type?: string;
    description?: string;
    targetValue?: string;
    targetDate?: string;
    status?: string;
}) {
    await requireAuth("patients:update");
    const result = await medicalHistoryService.updateGoal(id, {
        ...data,
        targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
        completedAt: data.status === "COMPLETED" ? new Date() : undefined,
    });
    revalidatePath(`/dashboard/patients`);
    return serializePrisma(result);
}

export async function deleteGoal(id: string) {
    await requireAuth("patients:update");
    await medicalHistoryService.deleteGoal(id);
    revalidatePath(`/dashboard/patients`);
    return { success: true };
}
