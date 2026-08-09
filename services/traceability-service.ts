import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const traceabilityService = {
    /**
     * Get stock movements with advanced filters
     */
    async getStockMovements(filters?: {
        productId?: string;
        warehouseId?: string;
        userId?: string;
        type?: "IN" | "OUT";
        startDate?: Date;
        endDate?: Date;
        reason?: string;
    }) {
        const where: Prisma.StockMovementWhereInput = { deletedAt: null };

        if (filters?.productId) {
            where.productId = filters.productId;
        }
        if (filters?.warehouseId) {
            where.warehouseId = filters.warehouseId;
        }
        if (filters?.userId) {
            where.userId = filters.userId;
        }
        if (filters?.type) {
            where.type = filters.type;
        }
        if (filters?.reason) {
            where.reason = {
                contains: filters.reason,
                mode: "insensitive",
            };
        }
        if (filters?.startDate || filters?.endDate) {
            where.createdAt = {};
            if (filters.startDate) {
                where.createdAt.gte = filters.startDate;
            }
            if (filters.endDate) {
                where.createdAt.lte = filters.endDate;
            }
        }

        return await prisma.stockMovement.findMany({
            where,
            include: {
                product: {
                    select: {
                        name: true,
                        sku: true,
                    },
                },
                warehouse: {
                    select: {
                        name: true,
                        code: true,
                    },
                },
                user: {
                    select: {
                        email: true,
                        username: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
    },

    /**
     * Get complete history for a product
     */
    async getProductHistory(productId: string) {
        const [movements, transfers, purchaseItems, deliveryItems, product] = await Promise.all([
            // Stock movements
            prisma.stockMovement.findMany({
                where: { productId, deletedAt: null },
                include: {
                    warehouse: {
                        select: {
                            name: true,
                        },
                    },
                    user: {
                        select: {
                            email: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            }),

            // Transferencias de depósito
            prisma.warehouseTransfer.findMany({
                where: { productId, deletedAt: null },
                include: {
                    fromWarehouse: {
                        select: {
                            name: true,
                        },
                    },
                    toWarehouse: {
                        select: {
                            name: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            }),

            // Purchase order items
            prisma.purchaseOrderItem.findMany({
                where: { productId, purchaseOrder: { deletedAt: null } },
                include: {
                    purchaseOrder: {
                        include: {
                            supplier: {
                                select: {
                                    name: true,
                                },
                            },
                            warehouse: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            }),

            // Delivery items
            prisma.deliveryItem.findMany({
                where: { productId, delivery: { deletedAt: null } },
                include: {
                    delivery: {
                        include: {
                            institution: {
                                select: {
                                    name: true,
                                },
                            },
                            warehouse: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            }),

            // Product info
            prisma.product.findUnique({
                where: { id: productId },
                include: {
                    category: {
                        select: {
                            name: true,
                        },
                    },
                },
            }),
        ]);

        // Combine all events into a timeline
        const timeline = [
            ...movements.map((m) => ({
                type: "movement" as const,
                date: m.createdAt,
                description: `Movimiento ${m.type}: ${m.quantity} unidades`,
                warehouse: m.warehouse?.name,
                user: m.user.email,
                reason: m.reason,
                quantity: m.quantity,
                movementType: m.type,
            })),
            ...transfers.map((t) => ({
                type: "transfer" as const,
                date: t.createdAt,
                description: `Transferencia: ${t.quantity} unidades de ${t.fromWarehouse.name} a ${t.toWarehouse.name}`,
                warehouse: null,
                user: null,
                reason: `Estado de transferencia: ${t.status}`,
                quantity: t.quantity,
                movementType: null,
            })),
            ...purchaseItems.map((p) => ({
                type: "purchase" as const,
                date: p.purchaseOrder.createdAt,
                description: `Compra de ${p.purchaseOrder.supplier.name}: ${p.quantity} unidades`,
                warehouse: p.purchaseOrder.warehouse.name,
                user: null,
                reason: `Orden ${p.purchaseOrder.orderNumber}`,
                quantity: p.quantity,
                movementType: "IN" as const,
            })),
            ...deliveryItems.map((d) => ({
                type: "delivery" as const,
                date: d.delivery.createdAt,
                description: `Entrega a ${d.delivery.institution.name}: ${d.quantity} unidades`,
                warehouse: d.delivery.warehouse.name,
                user: null,
                reason: `Entrega ${d.delivery.deliveryNumber}`,
                quantity: d.quantity,
                movementType: "OUT" as const,
            })),
        ].sort((a, b) => b.date.getTime() - a.date.getTime());

        return {
            product,
            timeline,
            stats: {
                totalMovements: movements.length,
                totalTransfers: transfers.length,
                totalPurchases: purchaseItems.length,
                totalDeliveries: deliveryItems.length,
                totalIn: movements
                    .filter((m) => m.type === "IN")
                    .reduce((sum, m) => sum + m.quantity, 0) + purchaseItems.reduce((sum, p) => sum + p.quantity, 0),
                totalOut: movements
                    .filter((m) => m.type === "OUT")
                    .reduce((sum, m) => sum + m.quantity, 0) + deliveryItems.reduce((sum, d) => sum + d.quantity, 0),
            },
        };
    },

    /**
     * Get warehouse activity log
     */
    async getWarehouseActivity(warehouseId: string, limit: number = 50) {
        const [movements, transfersFrom, transfersTo, purchases, deliveries] = await Promise.all([
            prisma.stockMovement.findMany({
                where: { warehouseId },
                take: limit,
                include: {
                    product: {
                        select: {
                            name: true,
                            sku: true,
                        },
                    },
                    user: {
                        select: {
                            email: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            }),

            prisma.warehouseTransfer.findMany({
                where: { fromWarehouseId: warehouseId },
                take: limit,
                include: {
                    product: {
                        select: {
                            name: true,
                        },
                    },
                    toWarehouse: {
                        select: {
                            name: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            }),

            prisma.warehouseTransfer.findMany({
                where: { toWarehouseId: warehouseId },
                take: limit,
                include: {
                    product: {
                        select: {
                            name: true,
                        },
                    },
                    fromWarehouse: {
                        select: {
                            name: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            }),

            prisma.purchaseOrder.findMany({
                where: { warehouseId },
                take: limit,
                include: {
                    supplier: {
                        select: {
                            name: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            }),

            prisma.delivery.findMany({
                where: { warehouseId },
                take: limit,
                include: {
                    institution: {
                        select: {
                            name: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            }),
        ]);

        const activity = [
            ...movements.map((m) => ({
                type: "movement" as const,
                date: m.createdAt,
                description: `${m.type}: ${m.product.name} (${m.quantity} unidades)`,
                user: m.user.email,
            })),
            ...transfersFrom.map((t) => ({
                type: "transfer_out" as const,
                date: t.createdAt,
                description: `Transferencia a ${t.toWarehouse.name}: ${t.product.name} (${t.quantity} unidades)`,
                user: null,
            })),
            ...transfersTo.map((t) => ({
                type: "transfer_in" as const,
                date: t.createdAt,
                description: `Transferencia desde ${t.fromWarehouse.name}: ${t.product.name} (${t.quantity} unidades)`,
                user: null,
            })),
            ...purchases.map((p) => ({
                type: "purchase" as const,
                date: p.createdAt,
                description: `Compra de ${p.supplier.name}: ${p.orderNumber}`,
                user: null,
            })),
            ...deliveries.map((d) => ({
                type: "delivery" as const,
                date: d.createdAt,
                description: `Entrega a ${d.institution.name}: ${d.deliveryNumber}`,
                user: null,
            })),
        ]
            .sort((a, b) => b.date.getTime() - a.date.getTime())
            .slice(0, limit);

        return activity;
    },

    /**
     * Get user activity log
     */
    async getUserActivity(userId: string, limit: number = 50) {
        const [movements, transfers, purchases, deliveries] = await Promise.all([
            prisma.stockMovement.findMany({
                where: { userId },
                take: limit,
                include: {
                    product: {
                        select: {
                            name: true,
                        },
                    },
                    warehouse: {
                        select: {
                            name: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            }),

            prisma.warehouseTransfer.findMany({
                where: { userId: userId },
                take: limit,
                include: {
                    product: {
                        select: {
                            name: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            }),

            prisma.purchaseOrder.findMany({
                where: { createdById: userId },
                take: limit,
                include: {
                    supplier: {
                        select: {
                            name: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            }),

            prisma.delivery.findMany({
                where: { createdById: userId },
                take: limit,
                include: {
                    institution: {
                        select: {
                            name: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            }),
        ]);

        const activity = [
            ...movements.map((m) => ({
                type: "movement" as const,
                date: m.createdAt,
                description: `${m.type === "IN" ? "Entrada" : "Salida"}: ${m.product.name} en ${m.warehouse?.name || "N/A"}`,
            })),
            ...transfers.map((t) => ({
                type: "transfer" as const,
                date: t.createdAt,
                description: `Transferencia creada: ${t.product.name} (${t.quantity} unidades)`,
            })),
            ...purchases.map((p) => ({
                type: "purchase" as const,
                date: p.createdAt,
                description: `Orden de compra creada de ${p.supplier.name}`,
            })),
            ...deliveries.map((d) => ({
                type: "delivery" as const,
                date: d.createdAt,
                description: `Entrega creada a ${d.institution.name}`,
            })),
        ]
            .sort((a, b) => b.date.getTime() - a.date.getTime())
            .slice(0, limit);

        return activity;
    },

    /**
     * Export movements data for audit
     */
    async exportMovementsForAudit(filters?: {
        startDate?: Date;
        endDate?: Date;
        warehouseId?: string;
    }) {
        const where: Prisma.StockMovementWhereInput = { deletedAt: null, product: { deletedAt: null } };

        if (filters?.startDate || filters?.endDate) {
            where.createdAt = {};
            if (filters.startDate) {
                where.createdAt.gte = filters.startDate;
            }
            if (filters.endDate) {
                where.createdAt.lte = filters.endDate;
            }
        }

        if (filters?.warehouseId) {
            where.warehouseId = filters.warehouseId;
        }

        const movements = await prisma.stockMovement.findMany({
            where,
            include: {
                product: {
                    select: {
                        name: true,
                        sku: true,
                    },
                },
                warehouse: {
                    select: {
                        name: true,
                    },
                },
                user: {
                    select: {
                        email: true,
                        username: true,
                    },
                },
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        return movements.map((m) => ({
            date: m.createdAt.toISOString(),
            type: m.type,
            product: m.product.name,
            sku: m.product.sku,
            quantity: m.quantity,
            warehouse: m.warehouse?.name || "N/A",
            user: m.user.email,
            reason: m.reason || "N/A",
        }));
    },
};
