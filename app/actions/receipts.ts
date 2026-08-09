"use server";

import { receiptService } from "@/services/receipt-service";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { serializePrisma } from "@/lib/utils";

async function verifyPermission(permission: string) {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, permission)) {
        throw new Error("No tienes permisos para esta acción");
    }
}

export async function getReceipts(filters?: { expedienteId?: string; purchaseOrderId?: string }) {
    await verifyPermission("receipts.view");
    const result = await receiptService.getReceipts(filters);
    return serializePrisma(result);
}

export async function getReceipt(id: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error("No autenticado");
    const result = await receiptService.getReceipt(id);
    return serializePrisma(result);
}

export async function createReceipt(data: {
    purchaseOrderId?: string;
    warehouseId?: string;
    receiptNumber: string;
    date: Date;
    imageUrl?: string;
    userId: string;
    expedienteId?: string;
    supplierId?: string;
    items: Array<{
        itemId?: string;
        productId: string;
        quantity: number;
        unitPrice?: number;
    }>;
}) {
    await verifyPermission("receipts.manage");
    const result = await receiptService.createReceipt(data);
    revalidatePath("/dashboard/receipts");
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/movements");
    if (data.purchaseOrderId) {
        revalidatePath(`/dashboard/purchases/${data.purchaseOrderId}`);
        revalidatePath("/dashboard/purchases");
    }
    
    // Revalidate the expediente path if the receipt is linked to one
    if (result.expedienteId) {
        revalidatePath(`/dashboard/expedientes/${result.expedienteId}`);
    }
    
    return serializePrisma(result);
}

export async function createAccumulatedReceipt(data: {
    purchaseOrderId: string;
    expedienteId: string;
    receiptNumber: string;
    date: Date;
    imageUrl?: string;
    items: Array<{
        purchaseOrderItemId: string;
        productId: string;
        quantity: number;
    }>;
}) {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "receipts.manage")) {
        throw new Error("No tienes permisos para registrar ingresos");
    }

    const result = await receiptService.createAccumulatedReceipt({
        ...data,
        userId: user.id,
    });
    revalidatePath("/dashboard/receipts");
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/movements");
    revalidatePath(`/dashboard/purchases/${data.purchaseOrderId}`);
    revalidatePath("/dashboard/purchases");
    revalidatePath(`/dashboard/expedientes/${data.expedienteId}`);
    return serializePrisma(result);
}

export async function updateReceipt(id: string, data: {
    receiptNumber?: string;
    date?: Date;
    imageUrl?: string;
    warehouseId?: string;
    purchaseOrderId?: string;
    expedienteId?: string;
    supplierId?: string;
    userId: string;
    items?: Array<{
        productId: string;
        quantity: number;
        unitPrice?: number;
    }>;
}) {
    await verifyPermission("receipts.manage");
    const result = await receiptService.updateReceipt(id, data);
    
    revalidatePath("/dashboard/receipts");
    revalidatePath(`/dashboard/receipts/${id}`);
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/movements");
    
    // Revalidate the expediente path if the receipt is linked to one
    if (result.expedienteId) {
        revalidatePath(`/dashboard/expedientes/${result.expedienteId}`);
    }
    
    return serializePrisma(result);
}

export async function completeReceipt(id: string) {
    await verifyPermission("receipts.manage");
    const result = await receiptService.completeReceipt(id);
    revalidatePath("/dashboard/receipts");
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/purchases");
    revalidatePath("/dashboard/expedientes");
    return result;
}

export async function deleteReceipt(id: string) {
    await verifyPermission("receipts.manage");
    const user = await getCurrentUser();
    if (!user) throw new Error("No autorizado");

    // Get the receipt before deleting it to know what to revalidate
    const receipt = await receiptService.getReceipt(id);
    
    const result = await receiptService.deleteReceipt(id, user.id);
    
    revalidatePath("/dashboard/receipts");
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/movements");
    
    if (receipt?.purchaseOrderId) {
        revalidatePath(`/dashboard/purchases/${receipt.purchaseOrderId}`);
        revalidatePath("/dashboard/purchases");
    }
    
    if (receipt?.expedienteId) {
        revalidatePath(`/dashboard/expedientes/${receipt.expedienteId}`);
    }
    
    return serializePrisma(result);
}
