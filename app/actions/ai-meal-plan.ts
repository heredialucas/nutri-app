"use server";

import { generateMealPlan, type GeneratedMealPlan, type PlanOptions } from "@/lib/ai/meal-plan-generator";
import { getCurrentUser, hasPermission } from "@/lib/auth";

export async function generateMealPlanWithAI(
    patientId: string | null,
    options: PlanOptions,
    customPrompt?: string
): Promise<GeneratedMealPlan> {
    const user = await getCurrentUser();
    if (!user) throw new Error("No autenticado");
    if (!hasPermission(user, "plans:create")) {
        throw new Error("No tienes permisos para crear planes alimentarios");
    }

    if (!options.calorieTarget || options.calorieTarget <= 0) {
        throw new Error("Las calorías diarias son obligatorias");
    }

    try {
        const plan = await generateMealPlan(patientId, options, customPrompt);
        return plan;
    } catch (error) {
        if (error instanceof Error) {
            if (error.message.includes("Paciente no encontrado") || error.message.includes("permisos")) {
                throw error;
            }
            if (error.message.includes("API key")) {
                throw new Error("La clave de API de OpenAI no está configurada correctamente");
            }
            if (error.message.includes("rate")) {
                throw new Error("Se excedió el límite de solicitudes. Intentá nuevamente en unos segundos");
            }
            throw new Error(`Error al generar el plan: ${error.message}`);
        }
        throw new Error("Error desconocido al generar el plan con IA");
    }
}
