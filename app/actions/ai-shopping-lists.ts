"use server";

import { generateShoppingListFromPrompt, generateShoppingListFromMealPlan, type GeneratedShoppingList } from "@/lib/ai/shopping-list-generator";
import { getCurrentUser, hasPermission } from "@/lib/auth";

export async function generateShoppingListWithAI(prompt: string): Promise<GeneratedShoppingList> {
    const user = await getCurrentUser();
    if (!user) throw new Error("No autenticado");
    if (!hasPermission(user, "plans:create")) {
        throw new Error("No tienes permisos para crear listas de compras");
    }

    return generateShoppingListFromPrompt(prompt);
}

export async function generateShoppingListFromPlanAI(
    mealPlanData: any
): Promise<GeneratedShoppingList> {
    const user = await getCurrentUser();
    if (!user) throw new Error("No autenticado");
    if (!hasPermission(user, "plans:create")) {
        throw new Error("No tienes permisos para crear listas de compras");
    }

    return generateShoppingListFromMealPlan(mealPlanData);
}
