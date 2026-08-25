"use server";

import { shoppingListService } from "@/services/shopping-list-service";
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

export async function getShoppingLists(filters?: { patientId?: string; nutritionPlanId?: string }) {
    await requireAuth("plans:read");
    const lists = await shoppingListService.list(filters);
    return serializePrisma(lists);
}

export async function getShoppingListById(id: string) {
    await requireAuth("plans:read");
    const list = await shoppingListService.getById(id);
    if (!list) throw new Error("Lista de compras no encontrada");
    return serializePrisma(list);
}

export async function createShoppingList(data: {
    title: string;
    patientId?: string;
    nutritionPlanId?: string;
    items?: { name: string; quantity?: string; unit?: string }[];
}) {
    await requireAuth("plans:create");
    if (!data.title?.trim()) throw new Error("El título es obligatorio");

    const list = await shoppingListService.create(data);
    revalidatePath("/dashboard/shopping-lists");
    return serializePrisma(list);
}

export async function addItemToList(listId: string, data: { name: string; quantity?: string; unit?: string }) {
    await requireAuth("plans:update");
    if (!data.name?.trim()) throw new Error("El nombre del item es obligatorio");

    const item = await shoppingListService.addItem(listId, data);
    revalidatePath("/dashboard/shopping-lists");
    return serializePrisma(item);
}

export async function toggleShoppingListItem(id: string) {
    await requireAuth("plans:update");
    const item = await shoppingListService.toggleItem(id);
    revalidatePath("/dashboard/shopping-lists");
    return serializePrisma(item);
}

export async function deleteShoppingListItem(id: string) {
    await requireAuth("plans:update");
    await shoppingListService.deleteItem(id);
    revalidatePath("/dashboard/shopping-lists");
    return { success: true };
}

export async function deleteShoppingList(id: string) {
    await requireAuth("plans:delete");
    await shoppingListService.delete(id);
    revalidatePath("/dashboard/shopping-lists");
    return { success: true };
}

export async function generateShoppingListFromPlan(nutritionPlanId: string) {
    await requireAuth("plans:create");
    const list = await shoppingListService.generateFromPlan(nutritionPlanId);
    revalidatePath("/dashboard/shopping-lists");
    return serializePrisma(list);
}
