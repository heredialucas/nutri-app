"use server";

import { nutritionPlanService } from "@/services/nutrition-plan-service";
import { notificationService } from "@/services/notification-service";
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

export async function getNutritionPlans(filters?: { patientId?: string; status?: string }) {
    const user = await requireAuth("plans:read");

    if (isPatientUser(user)) {
        const { patientService } = await import("@/services/patient-service");
        const patient = await patientService.getByUserId(user.id);
        if (patient) {
            const plans = await nutritionPlanService.list({ patientId: patient.id, ...filters });
            return serializePrisma(plans);
        }
        return [];
    }

    const plans = await nutritionPlanService.list({
        professionalId: user.id,
        ...filters,
    });
    return serializePrisma(plans);
}

export async function getNutritionPlanById(id: string) {
    await requireAuth("plans:read");
    const plan = await nutritionPlanService.getById(id);
    if (!plan) throw new Error("Plan no encontrado");
    return serializePrisma(plan);
}

export async function createNutritionPlan(data: {
    patientIds?: string[];
    title: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    calorieTarget?: number;
    proteinTarget?: number;
    carbTarget?: number;
    fatTarget?: number;
    notes?: string;
    tips?: string;
    supplements?: {
        name: string;
        dosage?: string;
        timing?: string;
        frequency?: string;
        notes?: string;
    }[];
    days?: {
        dayOrder: number;
        label: string;
        meals: {
            label: string;
            mealOrder: number;
            notes?: string;
            foods: {
                name: string;
                quantity?: string;
                unit?: string;
                notes?: string;
                calories?: number;
                protein?: number;
                carbs?: number;
                fat?: number;
            }[];
        }[];
    }[];
}) {
    const user = await requireAuth("plans:create");

    if (!data.title?.trim()) throw new Error("El título es obligatorio");

    const plan = await nutritionPlanService.create({
        ...data,
        professionalId: user.id,
        title: data.title.trim(),
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
    });

    revalidatePath("/dashboard/planes");
    for (const patientId of data.patientIds || []) {
        revalidatePath(`/dashboard/pacientes/${patientId}`);
    }
    return serializePrisma(plan);
}

export async function updateNutritionPlan(id: string, data: {
    title?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    calorieTarget?: number;
    proteinTarget?: number;
    carbTarget?: number;
    fatTarget?: number;
    notes?: string;
    tips?: string;
    pdfUrl?: string;
    patientIds?: string[];
    supplements?: {
        name: string;
        dosage?: string;
        timing?: string;
        frequency?: string;
        notes?: string;
    }[];
    days?: {
        dayOrder: number;
        label: string;
        meals: {
            label: string;
            mealOrder: number;
            notes?: string;
            foods: {
                name: string;
                quantity?: string;
                unit?: string;
                notes?: string;
                calories?: number;
                protein?: number;
                carbs?: number;
                fat?: number;
            }[];
        }[];
    }[];
}) {
    await requireAuth("plans:update");

    const updateData: Record<string, any> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.calorieTarget !== undefined) updateData.calorieTarget = data.calorieTarget;
    if (data.proteinTarget !== undefined) updateData.proteinTarget = data.proteinTarget;
    if (data.carbTarget !== undefined) updateData.carbTarget = data.carbTarget;
    if (data.fatTarget !== undefined) updateData.fatTarget = data.fatTarget;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.tips !== undefined) updateData.tips = data.tips;
    if (data.pdfUrl !== undefined) updateData.pdfUrl = data.pdfUrl;
    if (data.supplements !== undefined) updateData.supplements = data.supplements;
    if (data.days !== undefined) updateData.days = data.days;
    if (data.patientIds !== undefined) updateData.patientIds = data.patientIds;

    const plan = await nutritionPlanService.update(id, updateData);
    revalidatePath("/dashboard/planes");
    revalidatePath(`/dashboard/planes/${id}`);
    return serializePrisma(plan);
}

export async function assignPatientsToPlan(id: string, patientIds: string[]) {
    await requireAuth("plans:update");
    const result = await nutritionPlanService.assignPatients(id, patientIds);
    revalidatePath("/dashboard/planes");
    revalidatePath(`/dashboard/planes/${id}`);
    for (const patientId of patientIds) {
        revalidatePath(`/dashboard/pacientes/${patientId}`);
    }
    return result;
}

export async function deleteNutritionPlan(id: string) {
    await requireAuth("plans:delete");
    await nutritionPlanService.delete(id);
    revalidatePath("/dashboard/planes");
    return { success: true };
}

export async function setActivePlan(id: string, patientId: string) {
    await requireAuth("plans:update");
    await nutritionPlanService.setActive(id, patientId);
    revalidatePath("/dashboard/planes");
    revalidatePath(`/dashboard/pacientes/${patientId}`);
    return { success: true };
}

export async function duplicateNutritionPlan(id: string) {
    const user = await requireAuth("plans:create");
    const plan = await nutritionPlanService.duplicate(id, user.id);
    revalidatePath("/dashboard/planes");
    return serializePrisma(plan);
}

export async function getActivePlanForPatient(patientId: string) {
    await requireAuth("plans:read");
    const plan = await nutritionPlanService.getActiveForPatient(patientId);
    return serializePrisma(plan);
}
