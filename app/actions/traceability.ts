"use server";

import { traceabilityService } from "@/services/traceability-service";
import { inventoryService } from "@/services/inventory-service";
import { getCurrentUser, isSuperAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getStockMovements(filters?: {
    productId?: string;
    warehouseId?: string;
    userId?: string;
    type?: "IN" | "OUT";
    startDate?: Date;
    endDate?: Date;
    reason?: string;
}) {
    try {
        return await traceabilityService.getStockMovements(filters);
    } catch (error) {
        console.error("Error getting stock movements:", error);
        throw new Error("Failed to fetch stock movements");
    }
}

export async function getProductHistory(productId: string) {
    try {
        return await traceabilityService.getProductHistory(productId);
    } catch (error) {
        console.error("Error getting product history:", error);
        throw new Error("Failed to fetch product history");
    }
}

export async function getWarehouseActivity(warehouseId: string, limit: number = 50) {
    try {
        return await traceabilityService.getWarehouseActivity(warehouseId, limit);
    } catch (error) {
        console.error("Error getting warehouse activity:", error);
        throw new Error("Failed to fetch warehouse activity");
    }
}

export async function getUserActivity(userId: string, limit: number = 50) {
    try {
        return await traceabilityService.getUserActivity(userId, limit);
    } catch (error) {
        console.error("Error getting user activity:", error);
        throw new Error("Failed to fetch user activity");
    }
}

export async function exportMovementsForAudit(filters?: {
    startDate?: Date;
    endDate?: Date;
    warehouseId?: string;
}) {
    try {
        return await traceabilityService.exportMovementsForAudit(filters);
    } catch (error) {
        console.error("Error exporting movements:", error);
        throw new Error("Failed to export movements for audit");
    }
}

export async function deleteMovementAction(id: string) {
    const user = await getCurrentUser();
    if (!user || !isSuperAdmin(user)) {
        return { error: "Solo admin@gmail.com puede eliminar movimientos" };
    }

    try {
        await inventoryService.deleteMovement(id);
        revalidatePath("/dashboard/movements");
        revalidatePath("/dashboard/reports");
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Error al eliminar movimiento" };
    }
}

export async function restoreMovementAction(id: string) {
    const user = await getCurrentUser();
    if (!user || !isSuperAdmin(user)) {
        return { error: "Solo admin@gmail.com puede restaurar movimientos" };
    }

    try {
        await inventoryService.restoreMovement(id);
        revalidatePath("/dashboard/movements");
        revalidatePath("/dashboard/reports");
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Error al restaurar movimiento" };
    }
}
