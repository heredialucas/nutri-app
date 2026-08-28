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
    patientId: string;
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

    if (!data.patientId) throw new Error("El paciente es obligatorio");
    if (!data.title?.trim()) throw new Error("El título es obligatorio");

    const plan = await nutritionPlanService.create({
        ...data,
        professionalId: user.id,
        title: data.title.trim(),
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
    });

    revalidatePath("/dashboard/nutrition-plans");
    revalidatePath(`/dashboard/patients/${data.patientId}`);
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
    if (data.days !== undefined) updateData.days = data.days;

    const plan = await nutritionPlanService.update(id, updateData);
    revalidatePath("/dashboard/nutrition-plans");
    revalidatePath(`/dashboard/nutrition-plans/${id}`);
    return serializePrisma(plan);
}

export async function deleteNutritionPlan(id: string) {
    await requireAuth("plans:delete");
    await nutritionPlanService.delete(id);
    revalidatePath("/dashboard/nutrition-plans");
    return { success: true };
}

export async function setActivePlan(id: string, patientId: string) {
    await requireAuth("plans:update");
    await nutritionPlanService.setActive(id, patientId);
    revalidatePath("/dashboard/nutrition-plans");
    revalidatePath(`/dashboard/patients/${patientId}`);
    return { success: true };
}

export async function duplicateNutritionPlan(id: string) {
    const user = await requireAuth("plans:create");
    const plan = await nutritionPlanService.duplicate(id, user.id);
    revalidatePath("/dashboard/nutrition-plans");
    return serializePrisma(plan);
}

export async function getActivePlanForPatient(patientId: string) {
    await requireAuth("plans:read");
    const plan = await nutritionPlanService.getActiveForPatient(patientId);
    return serializePrisma(plan);
}
