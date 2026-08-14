"use server";

import { getCurrentUser, hasPermission } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { loanService } from "@/services/loan-service";
import { revalidatePath } from "next/cache";
import { serializePrisma } from "@/lib/utils";

const MAX_PROOF_SIZE = 8 * 1024 * 1024;

export async function getLoans() {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "loans.view")) {
        throw new Error("No tienes permisos para ver préstamos");
    }

    return serializePrisma(await loanService.getLoans());
}

export async function getLoanFormData() {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "loans.view")) {
        throw new Error("No tienes permisos para ver préstamos");
    }

    const [warehouses, products, expedientes] = await Promise.all([
        prisma.warehouse.findMany({
            where: { type: "DEPOSIT", isActive: true, deletedAt: null },
            orderBy: { name: "asc" },
            select: { id: true, name: true, code: true },
        }),
        prisma.product.findMany({
            where: { deletedAt: null },
            orderBy: { name: "asc" },
            select: { id: true, name: true, sku: true, unit: true },
        }),
        hasPermission(user, "expedientes.view")
            ? prisma.expediente.findMany({
                where: { status: "ABIERTO", deletedAt: null },
                orderBy: { number: "asc" },
                select: { id: true, number: true },
            })
            : Promise.resolve([]),
    ]);

    const stock = await prisma.warehouseStock.findMany({
        where: { quantity: { gt: 0 }, warehouse: { type: "DEPOSIT", isActive: true, deletedAt: null } },
        select: { warehouseId: true, productId: true, quantity: true },
    });

    return serializePrisma({ warehouses, products, expedientes, stock });
}

export async function createLoanAction(formData: FormData) {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "loans.manage")) {
        return { error: "No tienes permisos para registrar préstamos" };
    }

    const warehouseId = String(formData.get("warehouseId") || "");
    const responsibleName = String(formData.get("responsibleName") || "").trim();
    const responsibleDni = String(formData.get("responsibleDni") || "").trim();
    const destination = String(formData.get("destination") || "").trim();
    const notes = String(formData.get("notes") || "").trim();
    const expedienteId = String(formData.get("expedienteId") || "").trim();
    const proof = formData.get("proof") as File | null;
    let items: Array<{ productId: string; quantity: number }>;

    try {
        items = JSON.parse(String(formData.get("items") || "[]"));
    } catch {
        return { error: "Los productos seleccionados no son válidos" };
    }

    if (!warehouseId || !responsibleName || !responsibleDni || !destination) {
        return { error: "Completa el depósito, responsable, DNI y destino" };
    }
    if (!proof || proof.size === 0) return { error: "La foto del comprobante es obligatoria" };
    if (proof.size > MAX_PROOF_SIZE) return { error: "La foto no puede superar los 8 MB" };
    if (!["image/jpeg", "image/png", "image/webp"].includes(proof.type)) {
        return { error: "La foto debe estar en formato JPG, PNG o WEBP" };
    }
    if (!Array.isArray(items) || items.length === 0 || items.some((item) => !item.productId || !Number.isInteger(item.quantity) || item.quantity <= 0)) {
        return { error: "Selecciona al menos un producto con una cantidad válida" };
    }

    try {
        const buffer = Buffer.from(await proof.arrayBuffer());
        const upload = await import("@/app/actions/cloudinary");
        const result = await upload.uploadImage(`data:${proof.type};base64,${buffer.toString("base64")}`, "loanProofs");
        if (!result.success || !result.url) return { error: result.error || "No se pudo subir el comprobante" };

        await loanService.createLoan({
            warehouseId,
            responsibleName,
            responsibleDni,
            destination,
            notes,
            proofUrl: result.url,
            createdById: user.id,
            expedienteId: expedienteId || undefined,
            items,
        });
    } catch (error) {
        console.error("Error creating loan:", error);
        return { error: error instanceof Error ? error.message : "Error al registrar el préstamo" };
    }

    revalidatePath("/dashboard/loans");
    revalidatePath("/dashboard/warehouses");
    revalidatePath(`/dashboard/warehouses/${warehouseId}`);
    revalidatePath("/dashboard/movements");
    return { success: true };
}
