"use server";

import { expenseService } from "@/services/expense-service";
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

export async function getExpenses(filters?: { category?: string; from?: string; to?: string }) {
    await requireAuth("expenses:read");

    const queryFilters: Record<string, any> = {};
    if (filters?.category) queryFilters.category = filters.category;
    if (filters?.from) queryFilters.from = new Date(filters.from);
    if (filters?.to) queryFilters.to = new Date(filters.to);

    const expenses = await expenseService.list(queryFilters);
    return serializePrisma(expenses);
}

export async function getExpenseById(id: string) {
    await requireAuth("expenses:read");
    const expense = await expenseService.getById(id);
    if (!expense) throw new Error("Gasto no encontrado");
    return serializePrisma(expense);
}

export async function createExpense(data: {
    category: string;
    description: string;
    amount: number;
    date?: string;
    notes?: string;
}) {
    await requireAuth("expenses:create");

    if (!data.category?.trim()) throw new Error("La categoría es obligatoria");
    if (!data.description?.trim()) throw new Error("La descripción es obligatoria");
    if (!data.amount || data.amount <= 0) throw new Error("El monto debe ser mayor a 0");

    const expense = await expenseService.create({
        ...data,
        date: data.date ? new Date(data.date) : undefined,
    });

    revalidatePath("/dashboard/expenses");
    return serializePrisma(expense);
}

export async function updateExpense(id: string, data: {
    category?: string;
    description?: string;
    amount?: number;
    date?: string;
    notes?: string;
}) {
    await requireAuth("expenses:update");

    const updateData: Record<string, any> = {};
    if (data.category !== undefined) updateData.category = data.category;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.notes !== undefined) updateData.notes = data.notes;

    const expense = await expenseService.update(id, updateData);
    revalidatePath("/dashboard/expenses");
    return serializePrisma(expense);
}

export async function deleteExpense(id: string) {
    await requireAuth("expenses:delete");
    await expenseService.delete(id);
    revalidatePath("/dashboard/expenses");
    return { success: true };
}

export async function getTotalByPeriod(from: string, to: string) {
    await requireAuth("expenses:read");
    return expenseService.getTotalByPeriod(new Date(from), new Date(to));
}

export async function getByCategory(from: string, to: string) {
    await requireAuth("expenses:read");
    return expenseService.getByCategory(new Date(from), new Date(to));
}
