"use server";

import { isakService } from "@/services/isak-service";
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

export type IsakFormInput = {
    patientId: string;
    measuredAt?: string;
    activityLevel?: string;
    sport?: string;
    weight?: number;
    height?: number;
    tricepsSF?: number;
    subscapSF?: number;
    suprailiacSF?: number;
    abdominalSF?: number;
    thighSF?: number;
    calfSF?: number;
    relaxedArm?: number;
    flexedArm?: number;
    waist?: number;
    hip?: number;
    midThigh?: number;
    calf?: number;
    // Diámetros ISAK en mm
    humerusBreadth?: number;
    femurBreadth?: number;
    biStyloidWrist?: number;
    biMalleolarAnkle?: number;
    biacromial?: number;
    biiliocristal?: number;
    transverseChest?: number;
    apChestDepth?: number;
    apAbdominalDepth?: number;
    notes?: string;
};

function validateIsakInput(data: Partial<IsakFormInput>) {
    for (const key of ["weight", "height"] as const) {
        const value = data[key];
        if (value !== undefined && value !== null && (!Number.isFinite(value) || value <= 0)) {
            throw new Error(`${key} debe ser un número mayor que cero`);
        }
    }
    const fields = ["tricepsSF", "subscapSF", "suprailiacSF", "abdominalSF", "thighSF", "calf", "relaxedArm", "flexedArm", "waist", "hip", "midThigh", "humerusBreadth", "femurBreadth", "biStyloidWrist", "biMalleolarAnkle", "biacromial", "biiliocristal", "transverseChest", "apChestDepth", "apAbdominalDepth"] as const;
    for (const key of fields) {
        const value = data[key];
        if (value !== undefined && value !== null && (!Number.isFinite(value) || value < 0)) {
            throw new Error(`${key} debe ser un número válido`);
        }
    }
    if (data.measuredAt !== undefined && Number.isNaN(new Date(data.measuredAt).getTime())) {
        throw new Error("La fecha de medición no es válida");
    }
}

export async function getIsakAssessments(patientId: string) {
    await requireAuth("patients:read");
    const list = await isakService.getByPatient(patientId);
    return serializePrisma(list);
}

export async function getIsakById(id: string) {
    await requireAuth("patients:read");
    const item = await isakService.getById(id);
    return serializePrisma(item);
}

export async function createIsak(data: IsakFormInput) {
    await requireAuth("measurements:create");
    const user = await getCurrentUser();
    validateIsakInput(data);

    const result = await isakService.create({
        patientId: data.patientId,
        measuredById: user?.id,
        measuredAt: data.measuredAt ? new Date(data.measuredAt) : new Date(),
        activityLevel: data.activityLevel || null,
        sport: data.sport || null,
        weight: data.weight ?? null,
        height: data.height ?? null,
        tricepsSF: data.tricepsSF ?? null,
        subscapSF: data.subscapSF ?? null,
        suprailiacSF: data.suprailiacSF ?? null,
        abdominalSF: data.abdominalSF ?? null,
        thighSF: data.thighSF ?? null,
        calfSF: data.calfSF ?? null,
        relaxedArm: data.relaxedArm ?? null,
        flexedArm: data.flexedArm ?? null,
        waist: data.waist ?? null,
        hip: data.hip ?? null,
        midThigh: data.midThigh ?? null,
        calf: data.calf ?? null,
        humerusBreadth: data.humerusBreadth ?? null,
        femurBreadth: data.femurBreadth ?? null,
        biStyloidWrist: data.biStyloidWrist ?? null,
        biMalleolarAnkle: data.biMalleolarAnkle ?? null,
        biacromial: data.biacromial ?? null,
        biiliocristal: data.biiliocristal ?? null,
        transverseChest: data.transverseChest ?? null,
        apChestDepth: data.apChestDepth ?? null,
        apAbdominalDepth: data.apAbdominalDepth ?? null,
        notes: data.notes || null,
    });

    revalidatePath(`/dashboard/pacientes/${data.patientId}`);
    revalidatePath(`/dashboard/pacientes/${data.patientId}/evolucion`);
    revalidatePath(`/dashboard/pacientes/${data.patientId}/antropometria`);
    return serializePrisma(result);
}

export async function updateIsak(id: string, data: Partial<IsakFormInput>) {
    await requireAuth("measurements:update");
    validateIsakInput(data);

    const result = await isakService.update(id, {
        activityLevel: data.activityLevel ?? undefined,
        sport: data.sport ?? undefined,
        weight: data.weight ?? undefined,
        height: data.height ?? undefined,
        tricepsSF: data.tricepsSF ?? undefined,
        subscapSF: data.subscapSF ?? undefined,
        suprailiacSF: data.suprailiacSF ?? undefined,
        abdominalSF: data.abdominalSF ?? undefined,
        thighSF: data.thighSF ?? undefined,
        calfSF: data.calfSF ?? undefined,
        relaxedArm: data.relaxedArm ?? undefined,
        flexedArm: data.flexedArm ?? undefined,
        waist: data.waist ?? undefined,
        hip: data.hip ?? undefined,
        midThigh: data.midThigh ?? undefined,
        calf: data.calf ?? undefined,
        humerusBreadth: data.humerusBreadth ?? undefined,
        femurBreadth: data.femurBreadth ?? undefined,
        biStyloidWrist: data.biStyloidWrist ?? undefined,
        biMalleolarAnkle: data.biMalleolarAnkle ?? undefined,
        biacromial: data.biacromial ?? undefined,
        biiliocristal: data.biiliocristal ?? undefined,
        transverseChest: data.transverseChest ?? undefined,
        apChestDepth: data.apChestDepth ?? undefined,
        apAbdominalDepth: data.apAbdominalDepth ?? undefined,
        notes: data.notes ?? undefined,
    });

    if (data.patientId) {
        revalidatePath(`/dashboard/pacientes/${data.patientId}/antropometria`);
    }
    return serializePrisma(result);
}

export async function deleteIsak(id: string, patientId: string) {
    await requireAuth("measurements:delete");
    await isakService.delete(id);
    revalidatePath(`/dashboard/pacientes/${patientId}`);
    revalidatePath(`/dashboard/pacientes/${patientId}/antropometria`);
    return { success: true };
}

export async function getLatestIsak(patientId: string) {
    await requireAuth("patients:read");
    const item = await isakService.getLatest(patientId);
    return serializePrisma(item);
}

export async function getAllIsakAssessments() {
    await requireAuth("patients:read");
    const list = await isakService.getAll();
    return serializePrisma(list);
}

export async function getPatientsWithIsak() {
    await requireAuth("patients:read");
    const list = await isakService.getPatientsWithIsak();
    return serializePrisma(list);
}

export async function publishIsakToPatient(id: string) {
    const user = await requireAuth("measurements:update");
    const assessment = await isakService.getById(id);
    if (!assessment) throw new Error("Evaluación no encontrada");
    const result = await isakService.publish(id, user.id);
    revalidatePath(`/dashboard/pacientes/${assessment.patientId}/antropometria`);
    revalidatePath("/paciente/dashboard/antropometria");
    return serializePrisma(result);
}

export async function revokeIsakFromPatient(id: string) {
    await requireAuth("measurements:update");
    const assessment = await isakService.getById(id);
    if (!assessment) throw new Error("Evaluación no encontrada");
    const result = await isakService.revoke(id);
    revalidatePath(`/dashboard/pacientes/${assessment.patientId}/antropometria`);
    revalidatePath("/paciente/dashboard/antropometria");
    return serializePrisma(result);
}
