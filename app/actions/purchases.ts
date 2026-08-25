"use server";

import { purchaseService } from "@/services/purchase-service";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { PurchaseOrderStatus } from "@prisma/client";
import { serializePrisma } from "@/lib/utils";

export async function getPurchaseOrders(filters?: {
    status?: PurchaseOrderStatus;
    supplierId?: string;
    warehouseId?: string;
}) {
    const user = await getCurrentUser();
    const canView = hasPermission(user, "purchases.view") || 
                    hasPermission(user, "receipts.view") || 
                    hasPermission(user, "receipts.manage");

    if (!user || !canView) {
        throw new Error("No tienes permisos para ver órdenes de compra");
    }

    try {
        const orders = await purchaseService.getPurchaseOrders(filters);
        return serializePrisma(orders);
    } catch (error) {
        console.error("Error getting purchase orders:", error);
        throw new Error("Failed to fetch purchase orders");
    }
}

export async function getPurchaseOrder(id: string) {
    const user = await getCurrentUser();
    const canView = hasPermission(user, "purchases.view") || 
                    hasPermission(user, "receipts.view") || 
                    hasPermission(user, "receipts.manage");

    if (!user || !canView) {
        throw new Error("No tienes permisos para ver órdenes de compra");
    }

    try {
        const order = await purchaseService.getPurchaseOrder(id);
        return serializePrisma(order);
    } catch (error) {
        console.error("Error getting purchase order:", error);
        throw new Error("Failed to fetch purchase order");
    }
}

export async function getReceivablePurchasesByExpediente(expedienteId: string) {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "receipts.manage")) {
        throw new Error("No tienes permisos para consultar recepciones");
    }

    const orders = await purchaseService.getReceivablePurchasesByExpediente(expedienteId);
    return serializePrisma(orders);
}

export async function createPurchaseOrder(data: {
    supplierId: string;
    warehouseId: string;
    createdById: string;
    expedienteId?: string;
    subject: string;
    causative: string;
    responsible: string;
    expectedDate?: Date;
    notes?: string;
    items: Array<{
        productId: string;
        quantity: number;
        unitPrice: number;
    }>;
}) {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "purchases.manage")) {
        throw new Error("No tienes permisos para crear órdenes de compra");
    }

    try {
        const order = await purchaseService.createPurchaseOrder(data);
        revalidatePath("/dashboard/purchases");
        return serializePrisma(order);
    } catch (error: any) {
        console.error("Error creating purchase order:", error);
        throw new Error(error.message || "Failed to create purchase order");
    }
}

export async function createPurchaseOrdersFromImport(data: {
    warehouseId: string;
    expedienteId: string;
    subject: string;
    causative: string;
    responsible: string;
    sourceFileName?: string;
    groups: Array<{
        supplierName: string;
        items: Array<{
            productId?: string;
            productName: string;
            quantity: number;
            unitPrice: number;
            brand?: string;
        }>;
    }>;
}) {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "purchases.manage")) {
        throw new Error("No tienes permisos para crear órdenes de compra");
    }

    try {
        const orders = await purchaseService.createPurchaseOrdersFromImport({
            ...data,
            createdById: user.id,
        });
        revalidatePath("/dashboard/purchases");
        revalidatePath(`/dashboard/expedientes/${data.expedienteId}`);
        return serializePrisma(orders);
    } catch (error: any) {
        console.error("Error creating imported purchase orders:", error);
        throw new Error(error.message || "Error al crear las órdenes importadas");
    }
}

export async function updatePurchaseOrder(
    id: string,
    data: {
        expectedDate?: Date;
        notes?: string;
        status?: PurchaseOrderStatus;
    }
) {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "purchases.manage")) {
        throw new Error("No tienes permisos para editar órdenes de compra");
    }

    try {
        const order = await purchaseService.updatePurchaseOrder(id, data);
        revalidatePath("/dashboard/purchases");
        revalidatePath(`/dashboard/purchases/${id}`);
        return serializePrisma(order);
    } catch (error: any) {
        console.error("Error updating purchase order:", error);
        throw new Error(error.message || "Failed to update purchase order");
    }
}

// Removed receivePurchaseOrder as it is now handled by Receipts.

export async function cancelPurchaseOrder(id: string) {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "purchases.manage")) {
        throw new Error("No tienes permisos para cancelar órdenes de compra");
    }

    try {
        const order = await purchaseService.cancelPurchaseOrder(id);
        revalidatePath("/dashboard/purchases");
        revalidatePath(`/dashboard/purchases/${id}`);
        return serializePrisma(order);
    } catch (error: any) {
        console.error("Error cancelling purchase order:", error);
        throw new Error(error.message || "Failed to cancel purchase order");
    }
}

export async function submitPurchaseOrder(id: string) {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "purchases.manage")) {
        throw new Error("No tienes permisos para enviar órdenes de compra");
    }

    try {
        const order = await purchaseService.submitPurchaseOrder(id);
        revalidatePath("/dashboard/purchases");
        revalidatePath(`/dashboard/purchases/${id}`);
        return serializePrisma(order);
    } catch (error: any) {
        console.error("Error submitting purchase order:", error);
        throw new Error(error.message || "Failed to submit purchase order");
    }
}

export async function getPurchaseStats() {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "purchases.view")) {
        throw new Error("No tienes permisos para ver estadísticas de compras");
    }

    try {
        return await purchaseService.getPurchaseStats();
    } catch (error) {
        console.error("Error getting purchase stats:", error);
        throw new Error("Failed to fetch purchase statistics");
    }
}

export async function updateOrderDocument(
    orderId: string,
    docType: "invoice" | "creditNote" | "debitNote",
    base64Data: string | null
) {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "purchases.manage")) {
        throw new Error("No tienes permisos para actualizar documentos");
    }

    try {
        let documentUrl: string | null = null;
        
        if (base64Data) {
            // Upload to Cloudinary using orders preset (allows images and PDFs)
            const { uploadImage } = await import("./cloudinary");
            const result = await uploadImage(base64Data, "patientDocuments");
            
            if (result.success && result.url) {
                documentUrl = result.url;
            } else {
                throw new Error(result.error || "Error uploading document");
            }
        }

        // Update the order with the document URL
        await purchaseService.updateOrderDocument(orderId, docType, documentUrl);
        
        revalidatePath(`/dashboard/purchases/${orderId}`);
        return { success: true };
    } catch (error: any) {
        console.error("Error updating document:", error);
        throw new Error(error.message || "Failed to update document");
    }
}
