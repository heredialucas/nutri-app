"use server";

import { deliveryService } from "@/services/delivery-service";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { DeliveryStatus } from "@prisma/client";
import { serializePrisma } from "@/lib/utils";
import { uploadImage } from "@/app/actions/cloudinary";

export async function getDeliveries(filters?: {
    status?: DeliveryStatus;
    institutionId?: string;
    warehouseId?: string;
}) {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "deliveries.view")) {
        return [];
    }

    try {
        const deliveries = await deliveryService.getDeliveries(filters);
        return serializePrisma(deliveries);
    } catch (error) {
        console.error("Error getting deliveries:", error);
        throw new Error("Failed to fetch deliveries");
    }
}

export async function getDelivery(id: string) {
    try {
        const delivery = await deliveryService.getDelivery(id);
        if (!delivery) return null;
        
        // Serialize Decimal fields
        return serializePrisma(delivery);
    } catch (error) {
        console.error("Error getting delivery:", error);
        throw new Error("Failed to fetch delivery");
    }
}

export async function createDelivery(data: {
    institutionId: string;
    warehouseId: string;
    createdById: string;
    deliveryDate?: Date;
    receivedBy?: string;
    notes?: string;
    items: Array<{
        productId: string;
        quantity: number;
    }>;
    expedienteId?: string;
}) {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "deliveries.manage")) {
        throw new Error("No tienes permisos para crear entregas");
    }

    try {
        const delivery = await deliveryService.createDelivery(data);
        revalidatePath("/dashboard/deliveries");
        
        // Serialize Decimal fields to avoid "Only plain objects can be passed to Client Components" error
        return serializePrisma(delivery);
    } catch (error: any) {
        console.error("Error creating delivery:", error);
        throw new Error(error.message || "Failed to create delivery");
    }
}

export async function confirmDelivery(id: string) {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "deliveries.manage")) {
        throw new Error("No tienes permisos para confirmar entregas");
    }

    try {
        const delivery = await deliveryService.confirmDelivery(id);
        revalidatePath("/dashboard/deliveries");
        revalidatePath(`/dashboard/deliveries/${id}`);
        
        // Serialize response if needed (confirmDelivery may not include items)
        return delivery;
    } catch (error: any) {
        console.error("Error confirming delivery:", error);
        throw new Error(error.message || "Failed to confirm delivery");
    }
}

export async function markAsDeliveredWithProof(formData: FormData) {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "deliveries.manage")) {
        throw new Error("No tienes permisos para marcar entregas como entregadas");
    }

    const deliveryId = String(formData.get("deliveryId") || "");
    const photo = formData.get("photo");

    if (!deliveryId || !(photo instanceof File) || photo.size === 0) {
        throw new Error("Debes adjuntar una foto de recepción");
    }
    if (!photo.type.startsWith("image/")) {
        throw new Error("El archivo debe ser una imagen");
    }
    if (photo.size > 8 * 1024 * 1024) {
        throw new Error("La foto no puede superar los 8 MB");
    }

    try {
        const buffer = Buffer.from(await photo.arrayBuffer());
        const uploadResult = await uploadImage(
            `data:${photo.type};base64,${buffer.toString("base64")}`,
            "patientDocuments"
        );

        if (!uploadResult.success || !uploadResult.url) {
            throw new Error(uploadResult.error || "No se pudo subir la foto");
        }

        const delivery = await deliveryService.markAsDelivered(deliveryId, user.id, uploadResult.url);
        revalidatePath("/dashboard/deliveries");
        revalidatePath(`/dashboard/deliveries/${deliveryId}`);
        return serializePrisma(delivery);
    } catch (error: any) {
        console.error("Error marking delivery with proof:", error);
        throw new Error(error.message || "No se pudo finalizar la entrega");
    }
}

export async function disaffectDeliveryItems(
    deliveryId: string,
    items: Array<{ itemId: string; quantity: number }>
) {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "deliveries.manage")) {
        throw new Error("No tienes permisos para desafectar sobrantes");
    }

    try {
        const delivery = await deliveryService.disaffectItems(deliveryId, user.id, items);
        revalidatePath("/dashboard/deliveries");
        revalidatePath(`/dashboard/deliveries/${deliveryId}`);
        if (delivery?.expedienteId) {
            revalidatePath(`/dashboard/expedientes/${delivery.expedienteId}`);
        }
        return serializePrisma(delivery);
    } catch (error: any) {
        console.error("Error disaffecting delivery items:", error);
        throw new Error(error.message || "No se pudieron desafectar los sobrantes");
    }
}

export async function reviewDeliveryDisaffection(deliveryId: string) {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "deliveries.manage")) {
        throw new Error("No tienes permisos para cerrar la revisión de sobrantes");
    }

    try {
        const delivery = await deliveryService.reviewDisaffection(deliveryId);
        revalidatePath(`/dashboard/deliveries/${deliveryId}`);
        if (delivery.expedienteId) {
            revalidatePath(`/dashboard/expedientes/${delivery.expedienteId}`);
        }
        return serializePrisma(delivery);
    } catch (error: any) {
        throw new Error(error.message || "No se pudo cerrar la revisión de sobrantes");
    }
}

export async function cancelDelivery(id: string) {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "deliveries.manage")) {
        throw new Error("No tienes permisos para cancelar entregas");
    }

    try {
        const delivery = await deliveryService.cancelDelivery(id);
        revalidatePath("/dashboard/deliveries");
        revalidatePath(`/dashboard/deliveries/${id}`);
        
        // Serialize response if needed
        return delivery;
    } catch (error: any) {
        console.error("Error cancelling delivery:", error);
        throw new Error(error.message || "Failed to cancel delivery");
    }
}

export async function getDeliveryStats() {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "deliveries.view")) {
        throw new Error("No tienes permisos para ver estadísticas de entregas");
    }

    try {
        return await deliveryService.getDeliveryStats();
    } catch (error) {
        console.error("Error getting delivery stats:", error);
        throw new Error("Failed to fetch delivery statistics");
    }
}
