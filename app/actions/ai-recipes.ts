"use server";

import { generateRecipe, generateRecipesFromMealPlan, type GeneratedRecipe, type GeneratedRecipeBatch } from "@/lib/ai/recipe-generator";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { patientService } from "@/services/patient-service";

async function buildPatientContext(patientId: string): Promise<string> {
    try {
        const patient = await patientService.getById(patientId);
        if (!patient) return "";

        const sections: string[] = [];
        if (patient.allergies && patient.allergies.length > 0) {
            sections.push(`Alergias: ${patient.allergies.map((a: any) => a.name).join(", ")}`);
        }
        if (patient.medications && patient.medications.length > 0) {
            sections.push(`Medicación: ${patient.medications.map((m: any) => m.name).join(", ")}`);
        }
        if (patient.goals && patient.goals.length > 0) {
            sections.push(`Objetivos: ${patient.goals.map((g: any) => g.description || g.type).join(", ")}`);
        }
        return sections.join("\n");
    } catch {
        return "";
    }
}

export async function generateRecipeWithAI(prompt: string, patientId?: string): Promise<GeneratedRecipe> {
    const user = await getCurrentUser();
    if (!user) throw new Error("No autenticado");
    if (!hasPermission(user, "recipes:create")) {
        throw new Error("No tienes permisos para crear recetas");
    }

    const patientContext = patientId ? await buildPatientContext(patientId) : undefined;
    return generateRecipe(prompt, patientContext);
}

export async function generateRecipesFromPlan(
    mealPlanData: any,
    patientId?: string
): Promise<GeneratedRecipeBatch> {
    const user = await getCurrentUser();
    if (!user) throw new Error("No autenticado");
    if (!hasPermission(user, "recipes:create")) {
        throw new Error("No tienes permisos para crear recetas");
    }

    const patientContext = patientId ? await buildPatientContext(patientId) : undefined;
    return generateRecipesFromMealPlan(mealPlanData, patientContext);
}
