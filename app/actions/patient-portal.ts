"use server";

import { getCurrentUser, isPatientUser } from "@/lib/auth";
import { patientService } from "@/services/patient-service";
import { appointmentService } from "@/services/appointment-service";
import { nutritionPlanService } from "@/services/nutrition-plan-service";
import { followupService } from "@/services/followup-service";
import { shoppingListService } from "@/services/shopping-list-service";
import { recipeService } from "@/services/recipe-service";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { serializePrisma } from "@/lib/utils";

async function requirePatient() {
    const user = await getCurrentUser();
    if (!user) throw new Error("No autenticado");
    if (!isPatientUser(user)) throw new Error("Acceso no autorizado");
    const patient = await patientService.getByUserId(user.id);
    if (!patient) throw new Error("No se encontró tu perfil de paciente");
    return { user, patient };
}

export async function getMyProfile() {
    const { patient } = await requirePatient();
    return serializePrisma(patient);
}

export async function getMyAppointments() {
    const { patient } = await requirePatient();
    const all = await appointmentService.list({ patientId: patient.id });
    return serializePrisma(all);
}

export async function requestAppointmentCancel(appointmentId: string, reason: string) {
    const { patient } = await requirePatient();
    const apt = await appointmentService.getById(appointmentId);
    if (!apt || apt.patientId !== patient.id) throw new Error("Turno no encontrado");
    if (apt.status === "CANCELLED") throw new Error("El turno ya está cancelado");

    await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: "CANCELLED", cancellationReason: reason },
    });

    revalidatePath("/paciente/dashboard/turnos");
    return { success: true };
}

export async function getMyActivePlan() {
    const { patient } = await requirePatient();
    const plan = await nutritionPlanService.getActiveForPatient(patient.id);
    if (!plan) return null;
    return serializePrisma(plan);
}

export async function getMyPlans() {
    const { patient } = await requirePatient();
    const plans = await nutritionPlanService.list({ patientId: patient.id });
    return serializePrisma(plans);
}

export async function getMyShoppingLists(planId?: string) {
    const { patient } = await requirePatient();
    const lists = await shoppingListService.list({
        patientId: patient.id,
        nutritionPlanId: planId,
    });
    return serializePrisma(lists);
}

export async function getMyRecipes() {
    const { patient } = await requirePatient();
    const activePlan = await nutritionPlanService.getActiveForPatient(patient.id);
    if (!activePlan) return [];
    const recipes = await recipeService.listByPlan(activePlan.id);
    return serializePrisma(recipes);
}

export async function getMyFollowUps() {
    const { patient } = await requirePatient();
    const followUps = await followupService.getByPatient(patient.id);
    return serializePrisma(followUps);
}

export async function submitFollowUp(data: {
    weight?: number;
    adherence?: string;
    hunger?: string;
    energy?: string;
    difficulties?: string;
    patientNotes?: string;
}) {
    const { patient } = await requirePatient();

    // Get current week start (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);

    // Check if already submitted this week
    const existing = await prisma.followUp.findFirst({
        where: {
            patientId: patient.id,
            weekStart: monday,
        },
    });

    if (existing) {
        // Update existing
        await followupService.update(existing.id, {
            weight: data.weight,
            adherence: data.adherence,
            hunger: data.hunger,
            energy: data.energy,
            difficulties: data.difficulties,
            patientNotes: data.patientNotes,
        });
    } else {
        await followupService.create({
            patientId: patient.id,
            weekStart: monday,
            weight: data.weight,
            adherence: data.adherence,
            hunger: data.hunger,
            energy: data.energy,
            difficulties: data.difficulties,
            patientNotes: data.patientNotes,
        });
    }

    revalidatePath("/paciente/dashboard/seguimiento");
    return { success: true };
}

export async function getMyFiles() {
    const { patient } = await requirePatient();
    const files = await prisma.patientFile.findMany({
        where: { patientId: patient.id },
        orderBy: { createdAt: "desc" },
    });
    return serializePrisma(files);
}

export async function getMyMeasurements() {
    const { patient } = await requirePatient();
    const measurements = await prisma.anthropometricMeasurement.findMany({
        where: { patientId: patient.id },
        orderBy: { measuredAt: "desc" },
        take: 12,
    });
    return serializePrisma(measurements);
}

export async function updateMyProfile(data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    birthDate?: string;
    billingType?: string;
    gender?: string;
    documentNumber?: string;
    city?: string;
    address?: string;
    occupation?: string;
    healthInsurance?: string;
}) {
    const { patient } = await requirePatient();

    const updateData: Record<string, any> = {};
    if (data.firstName !== undefined) {
        const value = data.firstName.trim();
        if (!value) throw new Error("El nombre es obligatorio");
        updateData.firstName = value;
    }
    if (data.lastName !== undefined) {
        const value = data.lastName.trim();
        if (!value) throw new Error("El apellido es obligatorio");
        updateData.lastName = value;
    }
    if (data.email !== undefined) {
        const email = data.email.trim();
        if (!email) throw new Error("El email es obligatorio");
        const conflict = await prisma.patient.findFirst({
            where: { email, id: { not: patient.id }, deletedAt: null },
            select: { id: true },
        });
        if (conflict) throw new Error("Ese email ya está en uso por otro paciente");
        updateData.email = email;
    }
    if (data.phone !== undefined) updateData.phone = data.phone.trim() || null;
    if (data.birthDate !== undefined) updateData.birthDate = data.birthDate ? new Date(data.birthDate) : null;
    if (data.billingType !== undefined) updateData.billingType = data.billingType;
    if (data.gender !== undefined) updateData.gender = data.gender.trim() || null;
    if (data.documentNumber !== undefined) updateData.documentNumber = data.documentNumber.trim() || null;
    if (data.city !== undefined) updateData.city = data.city.trim() || null;
    if (data.address !== undefined) updateData.address = data.address.trim() || null;
    if (data.occupation !== undefined) updateData.occupation = data.occupation.trim() || null;
    if (data.healthInsurance !== undefined) updateData.healthInsurance = data.healthInsurance.trim() || null;

    await patientService.update(patient.id, updateData);
    revalidatePath("/paciente/dashboard", "layout");
    revalidatePath("/reservar");
    return { success: true };
}
