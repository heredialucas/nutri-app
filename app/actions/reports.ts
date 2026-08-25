"use server";

import { reportService } from "@/services/report-service";
import { getCurrentUser, hasPermission, isPatientUser } from "@/lib/auth";
import { serializePrisma } from "@/lib/utils";

async function requireAuth(permission?: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error("No autenticado");
    if (permission && !hasPermission(user, permission)) {
        throw new Error("No tienes permisos para esta acción");
    }
    return user;
}

export async function getDashboardSummary() {
    const user = await requireAuth();
    if (isPatientUser(user)) throw new Error("Esta función es solo para profesionales");

    const summary = await reportService.getDashboardSummary(user.id);
    return summary;
}

export async function getPatientEvolution(patientId: string) {
    await requireAuth("patients:read");
    const evolution = await reportService.getPatientEvolution(patientId);
    return serializePrisma(evolution);
}

export async function getMonthlyRevenue(months?: number) {
    await requireAuth("reports:read");
    const revenue = await reportService.getMonthlyRevenue(months);
    return revenue;
}
