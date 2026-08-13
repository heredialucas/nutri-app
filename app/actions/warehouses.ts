"use server";

import { warehouseService } from "@/services/warehouse-service";
import { inventoryService } from "@/services/inventory-service";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { TransferStatus } from "@prisma/client";

// ==================== WAREHOUSE CRUD ====================

export async function getWarehouses(type?: "DEPOSIT" | "OFFICE") {
    const user = await getCurrentUser();
    if (!user) {
        return [];
    }

    try {
        return await warehouseService.getWarehouses(type);
    } catch (error) {
        console.error("Error obteniendo depósitos:", error);
        throw new Error("Error al obtener depósitos");
    }
}

export async function getWarehouse(id: string) {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "warehouses.view")) {
        throw new Error("No tienes permisos para ver depósitos");
    }

    try {
        return await warehouseService.getWarehouse(id);
    } catch (error) {
        console.error("Error obteniendo depósito:", error);
        throw new Error("Error al obtener depósito");
    }
}

export async function createWarehouse(data: {
    name: string;
    code: string;
    description?: string;
    address?: string;
    type?: "DEPOSIT" | "OFFICE";
}) {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "warehouses.manage")) {
        throw new Error("No tienes permisos para crear depósitos");
    }

    try {
        const warehouse = await warehouseService.createWarehouse(data);
        revalidatePath("/dashboard/warehouses");
        return warehouse;
    } catch (error: any) {
        console.error("Error creating warehouse:", error);
        if (error.code === "P2002") {
            throw new Error("Warehouse name or code already exists");
        }
        throw new Error("Error al crear depósito");
    }
}

export async function updateWarehouse(
    id: string,
    data: {
        name?: string;
        code?: string;
        description?: string;
        address?: string;
        type?: "DEPOSIT" | "OFFICE";
    }
) {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "warehouses.manage")) {
        throw new Error("No tienes permisos para editar depósitos");
    }

    try {
        const warehouse = await warehouseService.updateWarehouse(id, data);
        revalidatePath("/dashboard/warehouses");
        revalidatePath(`/dashboard/warehouses/${id}`);
        return warehouse;
    } catch (error: any) {
        console.error("Error updating warehouse:", error);
        if (error.code === "P2002") {
            throw new Error("Warehouse name or code already exists");
        }
        throw new Error("Error al actualizar depósito");
    }
}

export async function toggleWarehouseStatus(id: string) {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "warehouses.manage")) {
        throw new Error("No tienes permisos para cambiar estado de depósitos");
    }

    try {
        const warehouse = await warehouseService.toggleWarehouseStatus(id);
        revalidatePath("/dashboard/warehouses");
        revalidatePath(`/dashboard/warehouses/${id}`);
        return warehouse;
    } catch (error) {
        console.error("Error toggling warehouse status:", error);
        throw new Error("Error al actualizar estado del depósito");
    }
}

export async function deleteWarehouse(id: string) {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "warehouses.manage")) {
        throw new Error("No tienes permisos para eliminar depósitos");
    }

    try {
        await warehouseService.deleteWarehouse(id);
        revalidatePath("/dashboard/warehouses");
    } catch (error: any) {
        console.error("Error deleting warehouse:", error);
        throw new Error(error.message || "Error al eliminar depósito");
    }
}

// ==================== WAREHOUSE STOCK ====================

export async function getWarehouseStock(warehouseId: string) {
    try {
        return await warehouseService.getWarehouseStock(warehouseId);
    } catch (error) {
        console.error("Error getting warehouse stock:", error);
        throw new Error("Error al obtener stock del depósito");
    }
}

export async function getProductStockByWarehouse(productId: string) {
    try {
        return await warehouseService.getProductStockByWarehouse(productId);
    } catch (error) {
        console.error("Error getting product stock by warehouse:", error);
        throw new Error("Error al obtener stock del producto");
    }
}

export async function getWarehouseProducts(warehouseId: string) {
    try {
        if (warehouseId === "unassigned") {
            const products = await inventoryService.getProducts();
            return products.map(p => ({
                id: p.id,
                name: p.name,
                brand: p.brand,
                sku: p.sku,
                quantity: p.stock,
                price: p.price?.toString() || "0",
                unit: p.unit,
                categoryId: p.categoryId,
            }));
        }

        const stockItems = await warehouseService.getWarehouseStock(warehouseId);
        return stockItems
            .filter(item => item.quantity > 0)
            .map(item => ({
                id: item.product.id,
                name: item.product.name,
                brand: item.product.brand,
                sku: item.product.sku,
                quantity: item.quantity,
                price: item.product.price?.toString() || "0",
                unit: item.product.unit,
                categoryId: item.product.categoryId,
                category: item.product.category ? {
                    id: item.product.category.id,
                    name: item.product.category.name,
                } : null,
            }));
    } catch (error) {
        console.error("Error obteniendo productos del depósito:", error);
        throw new Error("Error al obtener productos del depósito");
    }
}

// ==================== WAREHOUSE TRANSFERS ====================

export async function getTransfers(filters?: {
    status?: TransferStatus;
    warehouseId?: string;
    productId?: string;
}) {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "transfers.view")) {
        throw new Error("No tienes permisos para ver transferencias");
    }

    try {
        // Solo obtenemos transferencias reales entre depósitos
        const transfers = await warehouseService.getTransfers(filters);

        return transfers.map(t => ({
            id: t.id,
            type: "TRANSFER" as const,
            quantity: t.quantity,
            status: t.status,
            notes: t.notes,
            createdAt: t.createdAt,
            completedAt: t.completedAt,
            fromWarehouse: {
                id: t.fromWarehouse.id,
                name: t.fromWarehouse.name,
                code: t.fromWarehouse.code,
            },
            toWarehouse: {
                id: t.toWarehouse.id,
                name: t.toWarehouse.name,
                code: t.toWarehouse.code,
            },
            product: {
                id: t.product.id,
                name: t.product.name,
                sku: t.product.sku,
            },
            user: t.user,
        }));
    } catch (error) {
        console.error("Error obteniendo transferencias:", error);
        throw new Error("Error al obtener transferencias");
    }
}

export async function getTransfer(id: string) {
    try {
        return await warehouseService.getTransfer(id);
    } catch (error) {
        console.error("Error obteniendo transferencia:", error);
        throw new Error("Error al obtener transferencia");
    }
}

export async function createTransfer(data: {
    fromWarehouseId: string;
    toWarehouseId: string;
    productId: string;
    quantity: number;
    userId: string;
    expedienteId?: string;
    notes?: string;
}) {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "transfers.manage")) {
        throw new Error("No tienes permisos para crear transferencias");
    }

    try {
        await warehouseService.createTransfer(data);
        revalidatePath("/dashboard/warehouses/transfers");
        revalidatePath(`/dashboard/warehouses/${data.fromWarehouseId}`);
        revalidatePath(`/dashboard/warehouses/${data.toWarehouseId}`);
        revalidatePath("/dashboard/warehouses");
        return { success: true };
    } catch (error: any) {
        console.error("Error creating transfer:", error);
        throw new Error(error.message || "Error al crear transferencia");
    }
}

export async function markTransferInTransit(transferId: string) {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "transfers.manage")) {
        throw new Error("No tienes permisos para modificar transferencias");
    }

    try {
        const transfer = await warehouseService.markTransferInTransit(transferId);
        revalidatePath("/dashboard/warehouses/transfers");
        return transfer;
    } catch (error: any) {
        console.error("Error marking transfer in transit:", error);
        throw new Error(error.message || "Error al actualizar transferencia");
    }
}

export async function completeTransfer(transferId: string, userId: string) {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "transfers.manage")) {
        throw new Error("No tienes permisos para completar transferencias");
    }

    try {
        const transfer = await warehouseService.completeTransfer(transferId, userId);
        revalidatePath("/dashboard/warehouses/transfers");
        revalidatePath("/dashboard/warehouses");
        return transfer;
    } catch (error: any) {
        console.error("Error completing transfer:", error);
        throw new Error(error.message || "Error al completar transferencia");
    }
}

export async function cancelTransfer(transferId: string, userId: string) {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "transfers.manage")) {
        throw new Error("No tienes permisos para cancelar transferencias");
    }

    try {
        const transfer = await warehouseService.cancelTransfer(transferId, userId);
        revalidatePath("/dashboard/warehouses/transfers");
        return transfer;
    } catch (error: any) {
        console.error("Error cancelling transfer:", error);
        throw new Error(error.message || "Error al cancelar transferencia");
    }
}

export async function addStockToWarehouse(data: {
    warehouseId: string;
    productId: string;
    quantity: number;
    userId: string;
    expedienteId?: string;
    notes?: string;
    isNewStock?: boolean;
}) {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "transfers.manage")) {
        throw new Error("No tienes permisos para agregar stock");
    }

    try {
        await warehouseService.updateWarehouseStock(data.warehouseId, data.productId, data.quantity);

        if (data.isNewStock) {
            await inventoryService.registerMovement({
                productId: data.productId,
                warehouseId: data.warehouseId,
                type: "IN",
                quantity: data.quantity,
                userId: data.userId,
                reason: data.notes || "Ingreso de Mercadería (Nuevo Stock)",
                sourceType: "ADJUSTMENT",
                sourceId: data.productId,
                expedienteId: data.expedienteId,
            });
        } else {
            await inventoryService.registerStockAssignment({
                productId: data.productId,
                warehouseId: data.warehouseId,
                quantity: data.quantity,
                userId: data.userId,
                reason: data.notes || "Asignación desde Sin Asignar",
                expedienteId: data.expedienteId,
            });
        }

        revalidatePath(`/dashboard/warehouses/${data.warehouseId}`);
        revalidatePath("/dashboard/warehouses/transfers");
        revalidatePath("/dashboard/warehouses");
        return { success: true };
    } catch (error: any) {
        console.error("Error adding stock:", error);
        throw new Error(error.message || "Error al agregar stock");
    }
}

// ==================== ANALYTICS ====================

export async function getLowStockItems(warehouseId: string) {
    try {
        return await warehouseService.getLowStockItems(warehouseId);
    } catch (error) {
        console.error("Error getting low stock items:", error);
        throw new Error("Error al obtener items con stock bajo");
    }
}

export async function getWarehouseStats(warehouseId: string) {
    try {
        return await warehouseService.getWarehouseStats(warehouseId);
    } catch (error) {
        console.error("Error getting warehouse stats:", error);
        throw new Error("Error al obtener estadísticas del depósito");
    }
}
