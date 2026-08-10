import prisma from "@/lib/prisma";
import { Prisma, DeliveryStatus } from "@prisma/client";

export const deliveryService = {
    /**
     * Get all deliveries with filters
     */
    async getDeliveries(filters?: {
        status?: DeliveryStatus;
        institutionId?: string;
        warehouseId?: string;
    }) {
        const where: Prisma.DeliveryWhereInput = {
            deletedAt: null,
        };

        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.institutionId) {
            where.institutionId = filters.institutionId;
        }
        if (filters?.warehouseId) {
            where.warehouseId = filters.warehouseId;
        }

        return await prisma.delivery.findMany({
            where,
            select: {
                id: true,
                deliveryNumber: true,
                status: true,
                deliveryDate: true,
                receivedBy: true,
                notes: true,
                createdAt: true,
                institution: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                warehouse: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
                deliveredBy: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                _count: {
                    select: {
                        items: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    },

    /**
     * Get a single delivery
     */
    async getDelivery(id: string) {
        return await prisma.delivery.findUnique({
            where: { id, deletedAt: null },
            include: {
                institution: true,
                warehouse: true,
                createdBy: {
                    select: {
                        id: true,
                        email: true,
                        username: true,
                    },
                },
                items: {
                    include: {
                        product: {
                            include: {
                                category: true,
                            },
                        },
                    },
                },
            },
        });
    },

    /**
     * Create a new delivery
     */
    async createDelivery(data: {
        institutionId: string;
        warehouseId: string;
        createdById: string;
        expedienteId?: string;
        deliveryDate?: Date;
        receivedBy?: string;
        notes?: string;
        items: Array<{
            productId: string;
            quantity: number;
        }>;
    }) {
        const { items, expedienteId, ...deliveryData } = data;

        // Generate delivery number
        const count = await prisma.delivery.count();
        const deliveryNumber = `ENT-${String(count + 1).padStart(6, "0")}`;

        return await prisma.delivery.create({
            data: {
                ...deliveryData,
                deliveryNumber,
                expedienteId,
                items: {
                    create: items,
                },
            },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                institution: true,
                warehouse: true,
            },
        });
    },

    /**
     * Update delivery
     */
    async updateDelivery(
        id: string,
        data: {
            deliveryDate?: Date;
            receivedBy?: string;
            notes?: string;
            status?: DeliveryStatus;
        }
    ) {
        return await prisma.delivery.update({
            where: { id },
            data,
        });
    },

    /**
     * Confirm delivery (transition from DRAFT to CONFIRMED)
     */
    async confirmDelivery(id: string) {
        const delivery = await prisma.delivery.findUnique({
            where: { id },
        });

        if (!delivery) throw new Error("Entrega no encontrada");
        if (delivery.status !== "DRAFT") {
            throw new Error("Solo se pueden confirmar entregas en borrador");
        }

        return await prisma.delivery.update({
            where: { id },
            data: { status: "CONFIRMED" },
        });
    },

    /**
     * Mark delivery as delivered and update stock
     */
    async markAsDelivered(deliveryId: string, userId: string, proofUrl: string) {
        return await prisma.$transaction(async (tx) => {
            const delivery = await tx.delivery.findUnique({
                where: { id: deliveryId },
                include: {
                    items: true,
                },
            });

            if (!delivery) throw new Error("Entrega no encontrada");
            if (!proofUrl) throw new Error("La foto de recepción es obligatoria");
            if (delivery.status === "DELIVERED" || delivery.status === "CANCELLED") {
                throw new Error(`No se puede marcar una entrega ${delivery.status.toLowerCase()} como entregada`);
            }

            // Update stock for each item
            for (const item of delivery.items) {
                const quantityToDeliver = item.quantity - item.disaffectedQuantity;
                if (quantityToDeliver <= 0) continue;

                // Reduce warehouse stock
                const warehouseStock = await tx.warehouseStock.findUnique({
                    where: {
                        warehouseId_productId: {
                            warehouseId: delivery.warehouseId,
                            productId: item.productId,
                        },
                    },
                });

                if (!warehouseStock || warehouseStock.quantity < quantityToDeliver) {
                    throw new Error(`Stock insuficiente para el producto ${item.productId}`);
                }

                await tx.warehouseStock.update({
                    where: {
                        warehouseId_productId: {
                            warehouseId: delivery.warehouseId,
                            productId: item.productId,
                        },
                    },
                    data: {
                        quantity: {
                            decrement: quantityToDeliver,
                        },
                    },
                });

                // Create stock movement
                await tx.stockMovement.create({
                    data: {
                        productId: item.productId,
                        warehouseId: delivery.warehouseId,
                        type: "OUT",
                        quantity: quantityToDeliver,
                        userId,
                        reason: `Entrega ${delivery.deliveryNumber} a institución`,
                        sourceType: "DELIVERY",
                        sourceId: delivery.id,
                        expedienteId: delivery.expedienteId,
                    },
                });
            }

            // Update delivery status
            return await tx.delivery.update({
                where: { id: deliveryId },
                data: {
                    status: "DELIVERED",
                    deliveryDate: new Date(),
                    deliveryProofUrl: proofUrl,
                    deliveredById: userId,
                },
                include: {
                    items: {
                        include: {
                            product: true,
                        },
                    },
                },
            });
        });
    },

    /**
     * Registers leftover quantities and returns them to the source warehouse
     * when the delivery already consumed stock.
     */
    async disaffectItems(
        deliveryId: string,
        userId: string,
        items: Array<{ itemId: string; quantity: number }>
    ) {
        return await prisma.$transaction(async (tx) => {
            const delivery = await tx.delivery.findUnique({
                where: { id: deliveryId },
                include: { items: true },
            });

            if (!delivery) throw new Error("Entrega no encontrada");
            if (delivery.status === "CANCELLED") {
                throw new Error("No se puede desafectar una entrega cancelada");
            }
            if (items.length === 0) throw new Error("Seleccione al menos un sobrante");

            for (const requested of items) {
                if (!Number.isInteger(requested.quantity) || requested.quantity <= 0) {
                    throw new Error("Las cantidades desafectadas deben ser enteros positivos");
                }

                const item = delivery.items.find((entry) => entry.id === requested.itemId);
                if (!item) throw new Error("Ítem de entrega no encontrado");

                const available = item.quantity - item.disaffectedQuantity;
                if (requested.quantity > available) {
                    throw new Error(`La cantidad desafectada supera el saldo de ${item.productId}`);
                }

                if (delivery.status === "DELIVERED") {
                    await tx.warehouseStock.upsert({
                        where: {
                            warehouseId_productId: {
                                warehouseId: delivery.warehouseId,
                                productId: item.productId,
                            },
                        },
                        create: {
                            warehouseId: delivery.warehouseId,
                            productId: item.productId,
                            quantity: requested.quantity,
                        },
                        update: { quantity: { increment: requested.quantity } },
                    });

                    await tx.stockMovement.create({
                        data: {
                            productId: item.productId,
                            warehouseId: delivery.warehouseId,
                            type: "IN",
                            quantity: requested.quantity,
                            userId,
                            reason: `Desafectación de sobrantes de ${delivery.deliveryNumber}`,
                            sourceType: "DELIVERY_DISAFFECTION",
                            sourceId: delivery.id,
                            expedienteId: delivery.expedienteId,
                        },
                    });
                }

                await tx.deliveryItem.update({
                    where: { id: item.id },
                    data: { disaffectedQuantity: { increment: requested.quantity } },
                });
            }

            return tx.delivery.findUnique({
                where: { id: deliveryId },
                include: { items: { include: { product: true } } },
            });
        });
    },

    async reviewDisaffection(deliveryId: string) {
        const delivery = await prisma.delivery.findUnique({ where: { id: deliveryId } });
        if (!delivery) throw new Error("Entrega no encontrada");
        if (delivery.status !== "DELIVERED") {
            throw new Error("La revisión de sobrantes sólo se puede cerrar después de entregar");
        }

        return prisma.delivery.update({
            where: { id: deliveryId },
            data: { disaffectionReviewed: true },
        });
    },

    /**
     * Cancel delivery
     */
    async cancelDelivery(id: string) {
        const delivery = await prisma.delivery.findUnique({
            where: { id },
        });

        if (!delivery) throw new Error("Entrega no encontrada");
        if (delivery.status === "DELIVERED") {
            throw new Error("No se puede cancelar una entrega ya entregada");
        }

        return await prisma.delivery.update({
            where: { id },
            data: { status: "CANCELLED" },
        });
    },

    /**
     * Get delivery statistics
     */
    async getDeliveryStats() {
        const [totalDeliveries, deliveredCount, pendingCount, draftCount] = await Promise.all([
            prisma.delivery.count({
                where: { deletedAt: null },
            }),
            prisma.delivery.count({
                where: { status: "DELIVERED", deletedAt: null },
            }),
            prisma.delivery.count({
                where: { status: "CONFIRMED", deletedAt: null },
            }),
            prisma.delivery.count({
                where: { status: "DRAFT", deletedAt: null },
            }),
        ]);

        return {
            totalDeliveries,
            deliveredCount,
            pendingCount,
            draftCount,
        };
    },
};
