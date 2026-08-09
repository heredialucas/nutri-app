import prisma from "@/lib/prisma";
import { Prisma, TransferStatus } from "@prisma/client";

export const warehouseService = {
    // ==================== CRUD DE DEPÓSITOS ====================

    /**
     * Obtener todos los depósitos con resumen de stock
     */
    async getWarehouses(type?: "DEPOSIT" | "OFFICE") {
        const where: any = { deletedAt: null };
        if (type) {
            where.type = type;
        }
        return await prisma.warehouse.findMany({
            where,
            orderBy: { name: "asc" },
            include: {
                _count: {
                    select: {
                        stockItems: { where: { quantity: { gt: 0 } } },
                        transfersFrom: true,
                        transfersTo: true,
                    },
                },
            },
        });
    },

    /**
     * Obtener un depósito individual con información detallada
     */
    async getWarehouse(id: string) {
        return await prisma.warehouse.findUnique({
            where: { id, deletedAt: null },
            include: {
                stockItems: {
                    where: {
                        quantity: { gt: 0 },
                        product: {
                            deletedAt: null,
                        },
                    },
                    include: {
                        product: {
                            include: {
                                category: true,
                            },
                        },
                    },
                    orderBy: {
                        product: {
                            name: "asc",
                        },
                    },
                },
                _count: {
                    select: {
                        transfersFrom: true,
                        transfersTo: true,
                        stockMovements: true,
                    },
                },
            },
        });
    },

    /**
     * Create a new warehouse
     */
    async createWarehouse(data: {
        name: string;
        code: string;
        description?: string;
        address?: string;
        type?: "DEPOSIT" | "OFFICE";
    }) {
        return await prisma.warehouse.create({
            data,
        });
    },

    /**
     * Update warehouse information
     */
    async updateWarehouse(
        id: string,
        data: {
            name?: string;
            code?: string;
            description?: string;
            address?: string;
            type?: "DEPOSIT" | "OFFICE";
        }
    ) {
        return await prisma.warehouse.update({
            where: { id },
            data,
        });
    },

    /**
     * Toggle warehouse active status
     */
    async toggleWarehouseStatus(id: string) {
        const warehouse = await prisma.warehouse.findUnique({
            where: { id },
            select: { isActive: true },
        });

        if (!warehouse) throw new Error("Depósito no encontrado");

        return await prisma.warehouse.update({
            where: { id },
            data: { isActive: !warehouse.isActive },
        });
    },

    /**
     * Delete warehouse (only if empty)
     */
    async deleteWarehouse(id: string) {
        // Verificar si el depósito tiene stock
        const stockCount = await prisma.warehouseStock.count({
            where: { warehouseId: id, quantity: { gt: 0 } },
        });

        if (stockCount > 0) {
            throw new Error(
                "No se puede eliminar depósito con stock existente. Transfiera o remueva el stock primero."
            );
        }

        return await prisma.warehouse.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    },

    // ==================== WAREHOUSE STOCK ====================

    /**
     * Get stock for a specific warehouse
     */
    async getWarehouseStock(warehouseId: string) {
        return await prisma.warehouseStock.findMany({
            where: { warehouseId },
            include: {
                product: {
                    include: {
                        category: true,
                    },
                },
                warehouse: true,
            },
            orderBy: {
                product: {
                    name: "asc",
                },
            },
        });
    },

    /**
     * Get stock for a specific product across all warehouses
     */
    async getProductStockByWarehouse(productId: string) {
        return await prisma.warehouseStock.findMany({
            where: { productId },
            include: {
                warehouse: true,
            },
            orderBy: {
                warehouse: {
                    name: "asc",
                },
            },
        });
    },

    /**
     * Get or create warehouse stock entry
     */
    async getOrCreateWarehouseStock(warehouseId: string, productId: string) {
        const existing = await prisma.warehouseStock.findUnique({
            where: {
                warehouseId_productId: {
                    warehouseId,
                    productId,
                },
            },
        });

        if (existing) return existing;

        return await prisma.warehouseStock.create({
            data: {
                warehouseId,
                productId,
                quantity: 0,
            },
        });
    },

    /**
     * Update stock in a warehouse
     * This is typically called as part of a transaction
     */
    async updateWarehouseStock(
        warehouseId: string,
        productId: string,
        quantityChange: number,
        tx?: Prisma.TransactionClient
    ) {
        const client = tx || prisma;

        // Obtener o crear la entrada de stock del depósito
        const stockEntry = await client.warehouseStock.upsert({
            where: {
                warehouseId_productId: {
                    warehouseId,
                    productId,
                },
            },
            create: {
                warehouseId,
                productId,
                quantity: Math.max(0, quantityChange),
            },
            update: {
                quantity: {
                    increment: quantityChange,
                },
            },
        });

        // Asegurar que el stock no sea negativo
        if (stockEntry.quantity + quantityChange < 0) {
            throw new Error("Stock insuficiente en depósito");
        }

        return stockEntry;
    },

    /**
     * Calculate total stock for a product across all warehouses
     */
    async calculateProductTotalStock(productId: string) {
        const result = await prisma.warehouseStock.aggregate({
            where: { productId },
            _sum: {
                quantity: true,
            },
        });

        return result._sum.quantity || 0;
    },

    // ==================== WAREHOUSE TRANSFERS ====================

    /**
     * Get all transfers with filters
     */
    async getTransfers(filters?: {
        status?: TransferStatus;
        warehouseId?: string;
        productId?: string;
    }) {
        const where: Prisma.WarehouseTransferWhereInput = {
            deletedAt: null,
            product: { deletedAt: null },
        };

        if (filters?.status) {
            where.status = filters.status;
        }

        if (filters?.warehouseId) {
            where.OR = [
                { fromWarehouseId: filters.warehouseId },
                { toWarehouseId: filters.warehouseId },
            ];
        }

        if (filters?.productId) {
            where.productId = filters.productId;
        }

        return await prisma.warehouseTransfer.findMany({
            where,
            include: {
                fromWarehouse: true,
                toWarehouse: true,
                product: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        username: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    },

    /**
     * Get a single transfer
     */
    async getTransfer(id: string) {
        return await prisma.warehouseTransfer.findUnique({
            where: { id },
            include: {
                fromWarehouse: true,
                toWarehouse: true,
                product: {
                    include: {
                        category: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        email: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
    },

    /**
     * Create a new transfer
     * This removes stock from origin warehouse immediately
     */
    async createTransfer(data: {
        fromWarehouseId: string;
        toWarehouseId: string;
        productId: string;
        quantity: number;
        userId: string;
        expedienteId?: string;
        notes?: string;
    }) {
        const { fromWarehouseId, toWarehouseId, productId, quantity, userId, expedienteId, notes } = data;

        if (fromWarehouseId === toWarehouseId) {
            throw new Error("Los depósitos de origen y destino deben ser diferentes");
        }

        if (quantity <= 0) {
            throw new Error("La cantidad debe ser mayor a 0");
        }

        return await prisma.$transaction(async (tx) => {
            const sourceStock = await tx.warehouseStock.findUnique({
                where: {
                    warehouseId_productId: {
                        warehouseId: fromWarehouseId,
                        productId,
                    },
                },
            });

            if (!sourceStock || sourceStock.quantity < quantity) {
                throw new Error("Stock insuficiente en depósito origen");
            }

            // Deducir stock del depósito origen
            await tx.warehouseStock.update({
                where: {
                    warehouseId_productId: {
                        warehouseId: fromWarehouseId,
                        productId,
                    },
                },
                data: {
                    quantity: { decrement: quantity },
                },
            });

            // Agregar stock al depósito destino
            await tx.warehouseStock.upsert({
                where: {
                    warehouseId_productId: {
                        warehouseId: toWarehouseId,
                        productId,
                    },
                },
                create: {
                    warehouseId: toWarehouseId,
                    productId,
                    quantity,
                },
                update: {
                    quantity: { increment: quantity },
                },
            });

            // Crear registro de transferencia (COMPLETED directamente)
            const transfer = await tx.warehouseTransfer.create({
                data: {
                    fromWarehouseId,
                    toWarehouseId,
                    productId,
                    quantity,
                    userId,
                    expedienteId,
                    notes,
                    status: "COMPLETED",
                    completedAt: new Date(),
                },
            });

            // Movimiento de salida desde origen
            await tx.stockMovement.create({
                data: {
                    productId,
                    warehouseId: fromWarehouseId,
                    type: "OUT",
                    quantity,
                    userId,
                    reason: `Transferencia a depósito completada`,
                    sourceType: "TRANSFER",
                    sourceId: transfer.id,
                    expedienteId,
                },
            });

            // Movimiento de entrada a destino
            await tx.stockMovement.create({
                data: {
                    productId,
                    warehouseId: toWarehouseId,
                    type: "IN",
                    quantity,
                    userId,
                    reason: `Transferencia desde depósito completada`,
                    sourceType: "TRANSFER",
                    sourceId: transfer.id,
                    expedienteId,
                },
            });

            return transfer;
        });
    },

    /**
     * Update transfer status to IN_TRANSIT
     */
    async markTransferInTransit(transferId: string) {
        const transfer = await prisma.warehouseTransfer.findUnique({
            where: { id: transferId },
        });

        if (!transfer) throw new Error("Transferencia no encontrada");
        if (transfer.status !== "PENDING") {
            throw new Error("Solo las transferencias pendientes pueden marcarse como en tránsito");
        }

        return await prisma.warehouseTransfer.update({
            where: { id: transferId },
            data: { status: "IN_TRANSIT" },
        });
    },

    /**
     * Complete a transfer
     * This adds stock to destination warehouse
     */
    async completeTransfer(transferId: string, userId: string) {
        return await prisma.$transaction(async (tx) => {
            const transfer = await tx.warehouseTransfer.findUnique({
                where: { id: transferId },
            });

            if (!transfer) throw new Error("Transferencia no encontrada");
            if (transfer.status === "COMPLETED") {
                throw new Error("La transferencia ya está completada");
            }
            if (transfer.status === "CANCELLED") {
                throw new Error("No se puede completar una transferencia cancelada");
            }

            // Agregar stock al depósito destino
            await tx.warehouseStock.upsert({
                where: {
                    warehouseId_productId: {
                        warehouseId: transfer.toWarehouseId,
                        productId: transfer.productId,
                    },
                },
                create: {
                    warehouseId: transfer.toWarehouseId,
                    productId: transfer.productId,
                    quantity: transfer.quantity,
                },
                update: {
                    quantity: {
                        increment: transfer.quantity,
                    },
                },
            });

            // Crear movimiento de stock para destino (IN)
            await tx.stockMovement.create({
                data: {
                    productId: transfer.productId,
                    warehouseId: transfer.toWarehouseId,
                    type: "IN",
                    quantity: transfer.quantity,
                    userId,
                    reason: `Transferencia desde depósito completada`,
                    sourceType: "TRANSFER",
                    sourceId: transfer.id,
                    expedienteId: transfer.expedienteId,
                },
            });



            // Marcar transferencia como completada
            return await tx.warehouseTransfer.update({
                where: { id: transferId },
                data: {
                    status: "COMPLETED",
                    completedAt: new Date(),
                },
            });
        });
    },

    /**
     * Cancel a transfer
     * This returns stock to source warehouse
     */
    async cancelTransfer(transferId: string, userId: string) {
        return await prisma.$transaction(async (tx) => {
            const transfer = await tx.warehouseTransfer.findUnique({
                where: { id: transferId },
            });

            if (!transfer) throw new Error("Transferencia no encontrada");
            if (transfer.status === "CANCELLED") {
                throw new Error("La transferencia ya está cancelada");
            }

            if (transfer.status === "COMPLETED") {
                // Reversión completa: descuenta del destino, devuelve al origen
                await tx.warehouseStock.update({
                    where: {
                        warehouseId_productId: {
                            warehouseId: transfer.toWarehouseId,
                            productId: transfer.productId,
                        },
                    },
                    data: {
                        quantity: { decrement: transfer.quantity },
                    },
                });

                await tx.warehouseStock.update({
                    where: {
                        warehouseId_productId: {
                            warehouseId: transfer.fromWarehouseId,
                            productId: transfer.productId,
                        },
                    },
                    data: {
                        quantity: { increment: transfer.quantity },
                    },
                });

                await tx.stockMovement.create({
                    data: {
                        productId: transfer.productId,
                        warehouseId: transfer.toWarehouseId,
                        type: "OUT",
                        quantity: transfer.quantity,
                        userId,
                        reason: `Transferencia cancelada - stock retirado del destino`,
                        sourceType: "TRANSFER",
                        sourceId: transfer.id,
                        expedienteId: transfer.expedienteId,
                    },
                });

                await tx.stockMovement.create({
                    data: {
                        productId: transfer.productId,
                        warehouseId: transfer.fromWarehouseId,
                        type: "IN",
                        quantity: transfer.quantity,
                        userId,
                        reason: `Transferencia cancelada - stock devuelto al origen`,
                        sourceType: "TRANSFER",
                        sourceId: transfer.id,
                        expedienteId: transfer.expedienteId,
                    },
                });
            } else {
                // PENDING / IN_TRANSIT: solo devolver stock al origen
                await tx.warehouseStock.update({
                    where: {
                        warehouseId_productId: {
                            warehouseId: transfer.fromWarehouseId,
                            productId: transfer.productId,
                        },
                    },
                    data: {
                        quantity: { increment: transfer.quantity },
                    },
                });

                await tx.stockMovement.create({
                    data: {
                        productId: transfer.productId,
                        warehouseId: transfer.fromWarehouseId,
                        type: "IN",
                        quantity: transfer.quantity,
                        userId,
                        reason: `Transferencia cancelada - stock devuelto`,
                        sourceType: "TRANSFER",
                        sourceId: transfer.id,
                        expedienteId: transfer.expedienteId,
                    },
                });
            }

            return await tx.warehouseTransfer.update({
                where: { id: transferId },
                data: {
                    status: "CANCELLED",
                },
            });
        });
    },

    // ==================== ANALYTICS ====================

    /**
     * Get low stock items in a warehouse
     */
    async getLowStockItems(warehouseId: string) {
        const stockItems = await prisma.warehouseStock.findMany({
            where: { warehouseId },
            include: {
                product: true,
            },
        });

        return stockItems.filter((item) => item.quantity <= item.product.minStock);
    },

    /**
     * Get warehouse statistics
     */
    async getWarehouseStats(warehouseId: string) {
        const [totalProducts, totalQuantity, lowStockCount, pendingTransfersOut, pendingTransfersIn] =
            await Promise.all([
                prisma.warehouseStock.count({
                    where: { warehouseId, quantity: { gt: 0 } },
                }),
                prisma.warehouseStock.aggregate({
                    where: { warehouseId },
                    _sum: { quantity: true },
                }),
                prisma.warehouseStock.count({
                    where: {
                        warehouseId,
                        quantity: {
                            lte: prisma.warehouseStock.fields.quantity,
                        },
                    },
                }),
                prisma.warehouseTransfer.count({
                    where: {
                        fromWarehouseId: warehouseId,
                        status: { in: ["PENDING", "IN_TRANSIT"] },
                    },
                }),
                prisma.warehouseTransfer.count({
                    where: {
                        toWarehouseId: warehouseId,
                        status: { in: ["PENDING", "IN_TRANSIT"] },
                    },
                }),
            ]);

        return {
            totalProducts,
            totalQuantity: totalQuantity._sum.quantity || 0,
            lowStockCount,
            pendingTransfersOut,
            pendingTransfersIn,
        };
    },
};
