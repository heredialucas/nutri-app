"use server";

import { measurementService } from "@/services/measurement-service";
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

export async function getMeasurements(patientId: string) {
    await requireAuth("patients:read");
    const measurements = await measurementService.getByPatient(patientId);
    return serializePrisma(measurements);
}

export async function createMeasurement(data: {
    patientId: string;
    weight?: number;
    height?: number;
    waist?: number;
    hip?: number;
    arm?: number;
    bodyFatPercentage?: number;
    muscleMass?: number;
    notes?: string;
    measuredAt?: string;
}) {
    await requireAuth("measurements:create");

    const user = await getCurrentUser();
    const result = await measurementService.create({
        ...data,
        measuredById: user?.id,
        measuredAt: data.measuredAt ? new Date(data.measuredAt) : undefined,
    });

    revalidatePath(`/dashboard/pacientes/${data.patientId}`);
    revalidatePath(`/dashboard/pacientes/${data.patientId}/evolucion`);
    return serializePrisma(result);
}

export async function updateMeasurement(id: string, data: {
    weight?: number;
    height?: number;
    waist?: number;
    hip?: number;
    arm?: number;
    bodyFatPercentage?: number;
    muscleMass?: number;
    notes?: string;
}) {
    await requireAuth("measurements:update");
    const result = await measurementService.update(id, data);
    revalidatePath(`/dashboard/pacientes`);
    return serializePrisma(result);
}

export async function deleteMeasurement(id: string) {
    await requireAuth("measurements:delete");
    await measurementService.delete(id);
    revalidatePath(`/dashboard/pacientes`);
    return { success: true };
}

export async function getLatestMeasurement(patientId: string) {
    await requireAuth("patients:read");
    const measurement = await measurementService.getLatest(patientId);
    return serializePrisma(measurement);
}

export async function getEvolutionData(patientId: string, limit?: number) {
    await requireAuth("patients:read");
    const data = await measurementService.getEvolutionData(patientId, limit);
    return data;
}
