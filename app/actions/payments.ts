"use server";

import { paymentService } from "@/services/payment-service";
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

export async function getPayments(filters?: { patientId?: string; from?: string; to?: string; method?: string }) {
    await requireAuth("payments:read");

    const queryFilters: Record<string, any> = {};
    if (filters?.patientId) queryFilters.patientId = filters.patientId;
    if (filters?.method) queryFilters.method = filters.method;
    if (filters?.from) queryFilters.from = new Date(filters.from);
    if (filters?.to) queryFilters.to = new Date(filters.to);

    const payments = await paymentService.list(queryFilters);
    return serializePrisma(payments);
}

export async function getPaymentById(id: string) {
    await requireAuth("payments:read");
    const payment = await paymentService.getById(id);
    if (!payment) throw new Error("Pago no encontrado");
    return serializePrisma(payment);
}

export async function createPayment(data: {
    patientId: string;
    amount: number;
    method: string;
    description?: string;
    date?: string;
    notes?: string;
}) {
    await requireAuth("payments:create");

    if (!data.patientId) throw new Error("El paciente es obligatorio");
    if (!data.amount || data.amount <= 0) throw new Error("El monto debe ser mayor a 0");
    if (!data.method?.trim()) throw new Error("El método de pago es obligatorio");

    const payment = await paymentService.create({
        ...data,
        date: data.date ? new Date(data.date) : undefined,
    });

    revalidatePath("/dashboard/payments");
    revalidatePath(`/dashboard/patients/${data.patientId}`);
    return serializePrisma(payment);
}

export async function updatePayment(id: string, data: {
    amount?: number;
    method?: string;
    description?: string;
    date?: string;
    notes?: string;
}) {
    await requireAuth("payments:update");

    const updateData: Record<string, any> = {};
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.method !== undefined) updateData.method = data.method;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.notes !== undefined) updateData.notes = data.notes;

    const payment = await paymentService.update(id, updateData);
    revalidatePath("/dashboard/payments");
    return serializePrisma(payment);
}

export async function deletePayment(id: string) {
    await requireAuth("payments:delete");
    await paymentService.delete(id);
    revalidatePath("/dashboard/payments");
    return { success: true };
}

export async function getTotalByPatient(patientId: string) {
    await requireAuth("payments:read");
    return paymentService.getTotalByPatient(patientId);
}

export async function getTotalByPeriod(from: string, to: string) {
    await requireAuth("payments:read");
    return paymentService.getTotalByPeriod(new Date(from), new Date(to));
}
