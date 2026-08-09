import prisma from "@/lib/prisma";

const statusTranslations: Record<string, string> = {
    CANCELLED: "CANCELADO",
    DELIVERED: "ENTREGADO",
    PENDING: "PENDIENTE",
    CONFIRMED: "CONFIRMADO",
    DRAFT: "BORRADOR",
    IN_TRANSIT: "EN_TRANSITO",
    COMPLETED: "COMPLETADO",
    APPROVED: "APROBADO",
    REJECTED: "RECHAZADO",
    // Add more as needed
};

function translateStatus(status: string): string {
    return statusTranslations[status] || status;
}

export const analyticsService = {
    /**
     * Get dashboard overview statistics
     */
    async getDashboardStats() {
        const [
            totalProducts,
            totalWarehouses,
            totalSuppliers,
            totalInstitutions,
            recentMovements,
            pendingTransfers,
            pendingPurchases,
            pendingDeliveries,
        ] = await Promise.all([
            // Total products
            prisma.product.count({ where: { deletedAt: null } }),

            // Total warehouses
            prisma.warehouse.count({ where: { isActive: true } }),

            // Total suppliers
            prisma.supplier.count({ where: { isActive: true } }),

            // Total institutions
            prisma.institution.count({ where: { isActive: true } }),

            // Recent movements (last 7 days)
            prisma.stockMovement.count({
                where: {
                    deletedAt: null,
                    product: { deletedAt: null },
                    createdAt: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    },
                },
            }),

            // Transferencias pendientes
            prisma.warehouseTransfer.count({
                where: {
                    status: {
                        in: ["PENDING", "IN_TRANSIT"],
                    },
                },
            }),

            // Purchase orders pending (draft only)
            prisma.purchaseOrder.count({
                where: {
                    status: "DRAFT",
                },
            }),

            // Pending deliveries
            prisma.delivery.count({
                where: {
                    status: {
                        in: ["DRAFT", "CONFIRMED"],
                    },
                },
            }),
        ]);

        // Calculate total stock value (only items with stock > 0)
        const warehouseStock = await prisma.warehouseStock.findMany({
            where: { quantity: { gt: 0 }, product: { deletedAt: null } },
            include: {
                product: {
                    select: { price: true },
                },
            },
        });

        const totalStockValue = warehouseStock.reduce(
            (sum, ws) => sum + ws.quantity * Number(ws.product.price || 0),
            0
        );

        return {
            totalProducts,
            totalWarehouses,
            totalSuppliers,
            totalInstitutions,
            recentMovements,
            pendingTransfers,
            pendingPurchases,
            pendingDeliveries,
            totalStockValue,
        };
    },

    /**
     * Obtener reporte de stock por categoría
     */
    async getStockByCategory() {
        const warehouseStock = await prisma.warehouseStock.findMany({
            where: { quantity: { gt: 0 }, product: { deletedAt: null } },
            include: {
                product: {
                    include: { category: true },
                },
            },
        });

        const byCategory: Record<string, { products: Set<string>; totalStock: number; totalValue: number }> = {};

        for (const ws of warehouseStock) {
            const catName = ws.product.category?.name || "Sin categoría";
            if (!byCategory[catName]) {
                byCategory[catName] = { products: new Set(), totalStock: 0, totalValue: 0 };
            }
            byCategory[catName].products.add(ws.productId);
            byCategory[catName].totalStock += ws.quantity;
            byCategory[catName].totalValue += ws.quantity * Number(ws.product.price || 0);
        }

        return Object.entries(byCategory).map(([categoryName, data]) => ({
            categoryName,
            productCount: data.products.size,
            totalStock: data.totalStock,
            totalValue: data.totalValue,
        }));
    },

    /**
     * Get stock report by warehouse
     */
    async getStockByWarehouse() {
        const warehouses = await prisma.warehouse.findMany({
            where: { isActive: true },
            include: {
                stockItems: {
                    where: { quantity: { gt: 0 }, product: { deletedAt: null } },
                    include: {
                        product: {
                            select: {
                                price: true,
                            },
                        },
                    },
                },
            },
        });

        return warehouses.map((warehouse) => ({
            warehouseName: warehouse.name,
            warehouseCode: warehouse.code,
            productCount: warehouse.stockItems.length,
            totalStock: warehouse.stockItems.reduce((sum, item) => sum + item.quantity, 0),
            totalValue: warehouse.stockItems.reduce(
                (sum, item) => sum + item.quantity * Number(item.product.price || 0),
                0
            ),
        }));
    },

    /**
     * Get movement statistics
     */
    async getMovementStats(days: number = 30) {
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const movements = await prisma.stockMovement.findMany({
            where: {
                deletedAt: null,
                product: { deletedAt: null },
                createdAt: {
                    gte: startDate,
                },
            },
            select: {
                type: true,
                quantity: true,
                createdAt: true,
            },
        });

        const inMovements = movements.filter((m) => m.type === "IN");
        const outMovements = movements.filter((m) => m.type === "OUT");

        return {
            totalMovements: movements.length,
            inCount: inMovements.length,
            outCount: outMovements.length,
            totalIn: inMovements.reduce((sum, m) => sum + m.quantity, 0),
            totalOut: outMovements.reduce((sum, m) => sum + m.quantity, 0),
        };
    },

    /**
     * Get top products by movement
     */
    async getTopProductsByMovement(limit: number = 10, days: number = 30) {
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const movements = await prisma.stockMovement.groupBy({
            by: ["productId"],
            where: {
                deletedAt: null,
                product: { deletedAt: null },
                createdAt: {
                    gte: startDate,
                },
                sourceType: {
                    not: "TRANSFER",
                },
            },
            _sum: {
                quantity: true,
            },
            _count: {
                id: true,
            },
            orderBy: {
                _count: {
                    id: "desc",
                },
            },
            take: limit,
        });

        const productsData = await Promise.all(
            movements.map(async (m) => {
                const product = await prisma.product.findFirst({
                    where: { id: m.productId, deletedAt: null },
                    include: {
                        warehouseStock: true,
                    },
                });

                const currentStock = product?.warehouseStock.reduce((sum, ws) => sum + ws.quantity, 0) || 0;

                return {
                    productName: product?.name || "Unknown",
                    productSku: product?.sku || "",
                    currentStock,
                    movementCount: m._count.id,
                    totalQuantity: m._sum.quantity || 0,
                };
            })
        );

        return productsData;
    },

    /**
     * Get low stock products
     */
    async getLowStockProducts() {
        const products = await prisma.product.findMany({
            where: { deletedAt: null },
            include: {
                category: true,
                warehouseStock: true,
            },
        });

        return products
            .map((p) => {
                const totalStock = p.warehouseStock.reduce((sum, ws) => sum + ws.quantity, 0);
                return {
                    id: p.id,
                    name: p.name,
                    sku: p.sku,
                    currentStock: totalStock,
                    minStock: p.minStock,
                    category: p.category?.name || "Uncategorized",
                    status: totalStock === 0 ? "out_of_stock" : totalStock < p.minStock ? "low_stock" : "ok",
                };
            })
            .filter((p) => p.status !== "ok")
            .sort((a, b) => a.currentStock - b.currentStock);
    },

    /**
     * Get recent activity
     */
    async getRecentActivity(limit: number = 10) {
        const [movements, transfers, purchases, deliveries] = await Promise.all([
            prisma.stockMovement.findMany({
                where: { deletedAt: null, product: { deletedAt: null } },
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    product: {
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
            }),
            prisma.warehouseTransfer.findMany({
                where: { deletedAt: null, product: { deletedAt: null } },
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    product: {
                        select: {
                            name: true,
                        },
                    },
                },
            }),
            prisma.purchaseOrder.findMany({
                where: { deletedAt: null },
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    supplier: {
                        select: {
                            name: true,
                        },
                    },
                },
            }),
            prisma.delivery.findMany({
                where: { deletedAt: null },
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    institution: {
                        select: {
                            name: true,
                        },
                    },
                },
            }),
        ]);

        // Combine and sort all activities
        const activities = [
            ...movements.map((m) => ({
                type: "movimiento" as const,
                description: `${m.type === "IN" ? "ENTRADA" : "SALIDA"} movimiento: ${m.product.name} (${m.quantity})`,
                date: m.createdAt,
                user: m.user.email,
            })),
            ...transfers.map((t) => ({
                type: "transferencia" as const,
                description: `Transferencia: ${t.product.name} (${t.quantity}) - ${translateStatus(t.status)}`,
                date: t.createdAt,
                user: null,
            })),
            ...purchases.map((p) => ({
                type: "compra" as const,
                description: `Compra de ${p.supplier.name} - ${translateStatus(p.status)}`,
                date: p.createdAt,
                user: null,
            })),
            ...deliveries.map((d) => ({
                type: "entrega" as const,
                description: `Entrega a ${d.institution.name} - ${translateStatus(d.status)}`,
                date: d.createdAt,
                user: null,
            })),
        ]
            .sort((a, b) => b.date.getTime() - a.date.getTime())
            .slice(0, limit);

        return activities;
    },
};
