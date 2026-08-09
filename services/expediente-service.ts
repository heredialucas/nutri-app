import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const expedienteService = {
    // ==================== CATEGORÍAS DE EXPEDIENTE ====================

    async getExpedienteCategories() {
        return await prisma.expedienteCategory.findMany({
            where: { deletedAt: null },
            orderBy: { name: "asc" },
            include: {
                _count: {
                    select: { expedientes: true },
                },
            },
        });
    },

    async createExpedienteCategory(name: string, description?: string) {
        return await prisma.expedienteCategory.create({
            data: { name, description },
        });
    },

    async updateExpedienteCategory(id: string, name: string, description?: string) {
        return await prisma.expedienteCategory.update({
            where: { id },
            data: { name, description },
        });
    },

    async deleteExpedienteCategory(id: string) {
        return await prisma.expedienteCategory.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
    },

    // ==================== EXPEDIENTES ====================

    /**
     * Get all expedientes with optional filters
     */
    async getExpedientes(filters?: {
        status?: string;
    }) {
        const where: Prisma.ExpedienteWhereInput = {
            deletedAt: null,
        };

        if (filters?.status) {
            where.status = filters.status;
        }

        return await prisma.expediente.findMany({
            where,
            include: {
                category: true,
                    _count: {
                        select: {
                            purchases: { where: { deletedAt: null } },
                            deliveries: { where: { deletedAt: null } },
                            transfers: { where: { deletedAt: null } },
                            movements: { where: { deletedAt: null } },
                        },
                    },
            },
            orderBy: { createdAt: "desc" },
        });
    },

    /**
     * Get a single expediente with full deep relations (The "Full" view)
     */
    async getExpediente(id: string) {
        return await prisma.expediente.findFirst({
            where: { id, deletedAt: null },
            include: {
                category: true,
                purchases: {
                    where: { deletedAt: null },
                    include: {
                        supplier: true,
                        items: {
                            include: {
                                product: true
                            }
                        },
                        receipts: { where: { deletedAt: null } }
                    },
                    orderBy: { createdAt: 'desc' }
                },
                deliveries: {
                    where: { deletedAt: null },
                    include: {
                        institution: true,
                        items: {
                            include: {
                                product: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                },
                transfers: {
                    where: { deletedAt: null },
                    include: {
                        fromWarehouse: true,
                        toWarehouse: true,
                        product: true
                    },
                    orderBy: { createdAt: 'desc' }
                },
                movements: {
                    where: { deletedAt: null },
                    include: {
                        product: true,
                        warehouse: true,
                        user: {
                            select: {
                                id: true,
                                email: true,
                                username: true,
                                firstName: true,
                                lastName: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                },
                receipts: {
                    where: { deletedAt: null },
                    include: {
                        purchaseOrder: {
                            include: {
                                warehouse: true
                            }
                        },
                        warehouse: true,
                        items: {
                            include: {
                                product: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            },
        });
    },

    /**
     * Create a new expediente
     */
    async createExpediente(data: {
        number?: string;
        year?: number;
        type?: string;
        origin?: string;
        description?: string;
        status?: string;
        categoryId?: string;
    }) {
        // Use provided number or generate one (e.g. EXP-000001)
        let number = data.number;
        if (!number) {
            const count = await prisma.expediente.count();
            number = `EXP-${String(count + 1).padStart(6, "0")}`;
        }

        return await prisma.expediente.create({
            data: {
                number,
                year: data.year,
                type: data.type,
                origin: data.origin,
                description: data.description,
                status: data.status || "ABIERTO",
                categoryId: data.categoryId,
            },
        });
    },

    /**
     * Delete an expediente with cascade soft-delete on all related records and stock reversal.
     * Everything happens inside a $transaction.
     */
    async deleteExpediente(id: string) {
        return await prisma.$transaction(async (tx) => {
            // 1. Get expediente with all its relations
            const expediente = await tx.expediente.findUnique({
                where: { id },
                include: {
                    purchases: true,
                    deliveries: true,
                    receipts: true,
                    movements: true,
                    transfers: true,
                },
            });

            if (!expediente) {
                throw new Error("Expediente no encontrado");
            }

            // 2. Soft-delete all related PurchaseOrders
            if (expediente.purchases.length > 0) {
                await tx.purchaseOrder.updateMany({
                    where: { expedienteId: id },
                    data: { deletedAt: new Date() },
                });
            }

            // 3. Soft-delete all related Deliveries
            if (expediente.deliveries.length > 0) {
                await tx.delivery.updateMany({
                    where: { expedienteId: id },
                    data: { deletedAt: new Date() },
                });
            }

            // 4. Soft-delete all related PurchaseReceipts
            if (expediente.receipts.length > 0) {
                await tx.purchaseReceipt.updateMany({
                    where: { expedienteId: id },
                    data: { deletedAt: new Date() },
                });
            }

            // 5. Soft-delete all related WarehouseTransfers
            if (expediente.transfers.length > 0) {
                await tx.warehouseTransfer.updateMany({
                    where: { expedienteId: id },
                    data: { deletedAt: new Date() },
                });
            }

            // 6. Reverse stock for each StockMovement, then soft-delete them
            if (expediente.movements.length > 0) {
                const stockDeltas = new Map<string, { warehouseId: string; productId: string; delta: number }>();
                for (const movement of expediente.movements) {
                    if (!movement.warehouseId) continue;
                    const key = `${movement.warehouseId}:${movement.productId}`;
                    const current = stockDeltas.get(key) || {
                        warehouseId: movement.warehouseId,
                        productId: movement.productId,
                        delta: 0,
                    };
                    current.delta += movement.type === "OUT" ? movement.quantity : -movement.quantity;
                    stockDeltas.set(key, current);
                }

                for (const { warehouseId, productId, delta } of stockDeltas.values()) {
                    const currentStock = await tx.warehouseStock.findUnique({
                        where: { warehouseId_productId: { warehouseId, productId } },
                    });
                    const nextQuantity = Math.max((currentStock?.quantity || 0) + delta, 0);
                    await tx.warehouseStock.upsert({
                        where: { warehouseId_productId: { warehouseId, productId } },
                        create: { warehouseId, productId, quantity: nextQuantity },
                        update: { quantity: nextQuantity },
                    });
                }

                await tx.stockMovement.updateMany({
                    where: { expedienteId: id },
                    data: { deletedAt: new Date() },
                });
            }

            // 7. Soft-delete the Expediente itself
            await tx.expediente.update({
                where: { id },
                data: { deletedAt: new Date() },
            });

            return { success: true };
        }, { maxWait: 10000, timeout: 30000 });
    },

    /**
     * Update an expediente
     */
    async updateExpediente(
        id: string,
        data: {
            number?: string;
            year?: number;
            type?: string;
            origin?: string;
            description?: string;
            status?: string;
            categoryId?: string;
        }
    ) {
        return await prisma.expediente.update({
            where: { id },
            data,
        });
    },
};
