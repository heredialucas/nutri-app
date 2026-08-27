"use server";

import { recipeService } from "@/services/recipe-service";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import prisma from "@/lib/prisma";
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

export async function getRecipes(filters?: { search?: string }) {
    await requireAuth("recipes:read");
    const user = await getCurrentUser();
    const recipes = await recipeService.list({
        ...filters,
        professionalId: user?.id,
    });
    return serializePrisma(recipes);
}

export async function getRecipeById(id: string) {
    await requireAuth("recipes:read");
    const recipe = await recipeService.getById(id);
    if (!recipe) throw new Error("Receta no encontrada");
    return serializePrisma(recipe);
}

export async function getRecipesByPlan(nutritionPlanId: string) {
    await requireAuth("recipes:read");
    const recipes = await recipeService.listByPlan(nutritionPlanId);
    return serializePrisma(recipes);
}

export async function linkRecipesToPlan(recipeIds: string[], nutritionPlanId: string) {
    await requireAuth("recipes:update");
    await prisma.recipe.updateMany({
        where: { id: { in: recipeIds } },
        data: { nutritionPlanId },
    });
    revalidatePath("/dashboard/recetas");
    revalidatePath(`/dashboard/planes/${nutritionPlanId}`);
    return { success: true };
}

export async function createRecipe(data: {
    title: string;
    description?: string;
    ingredients?: string;
    instructions?: string;
    imageUrl?: string;
    nutritionPlanId?: string;
}) {
    const user = await requireAuth("recipes:create");
    if (!data.title?.trim()) throw new Error("El título es obligatorio");

    const recipe = await recipeService.create({
        ...data,
        professionalId: user.id,
        title: data.title.trim(),
    });

    revalidatePath("/dashboard/recetas");
    return serializePrisma(recipe);
}

export async function updateRecipe(id: string, data: {
    title?: string;
    description?: string;
    ingredients?: string;
    instructions?: string;
    imageUrl?: string;
}) {
    await requireAuth("recipes:update");
    const recipe = await recipeService.update(id, data);
    revalidatePath("/dashboard/recetas");
    revalidatePath(`/dashboard/recetas/${id}`);
    return serializePrisma(recipe);
}

export async function deleteRecipe(id: string) {
    await requireAuth("recipes:delete");
    await recipeService.delete(id);
    revalidatePath("/dashboard/recetas");
    return { success: true };
}
