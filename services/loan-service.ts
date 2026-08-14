import prisma from "@/lib/prisma";

type LoanItemInput = {
    productId: string;
    quantity: number;
};

export const loanService = {
    async getLoans() {
        return prisma.loan.findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: "desc" },
            include: {
                warehouse: { select: { id: true, name: true, code: true } },
                createdBy: { select: { id: true, firstName: true, lastName: true, username: true, email: true } },
                expediente: { select: { id: true, number: true } },
                items: {
                    include: { product: { select: { id: true, sku: true, name: true, unit: true } } },
                    orderBy: { createdAt: "asc" },
                },
            },
        });
    },

    async createLoan(data: {
        warehouseId: string;
        responsibleName: string;
        responsibleDni: string;
        destination: string;
        notes?: string;
        proofUrl: string;
        createdById: string;
        expedienteId?: string;
        items: LoanItemInput[];
    }) {
        const items = Array.from(
            data.items.reduce((map, item) => {
                map.set(item.productId, (map.get(item.productId) || 0) + item.quantity);
                return map;
            }, new Map<string, number>()),
            ([productId, quantity]) => ({ productId, quantity })
        );

        return prisma.$transaction(async (tx) => {
            const warehouse = await tx.warehouse.findUnique({
                where: { id: data.warehouseId },
                select: { id: true, type: true, isActive: true, deletedAt: true },
            });
            if (!warehouse || warehouse.deletedAt || !warehouse.isActive || warehouse.type !== "DEPOSIT") {
                throw new Error("El depósito seleccionado no está disponible");
            }

            const loan = await tx.loan.create({
                data: {
                    number: `PRE-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
                    warehouseId: data.warehouseId,
                    responsibleName: data.responsibleName,
                    responsibleDni: data.responsibleDni,
                    destination: data.destination,
                    notes: data.notes || undefined,
                    proofUrl: data.proofUrl,
                    createdById: data.createdById,
                    expedienteId: data.expedienteId || undefined,
                },
            });

            for (const item of items) {
                const stockUpdate = await tx.warehouseStock.updateMany({
                    where: {
                        warehouseId: data.warehouseId,
                        productId: item.productId,
                        quantity: { gte: item.quantity },
                    },
                    data: { quantity: { decrement: item.quantity } },
                });

                if (stockUpdate.count !== 1) {
                    throw new Error("Stock insuficiente para uno de los productos seleccionados");
                }

                await tx.loanItem.create({
                    data: {
                        loanId: loan.id,
                        productId: item.productId,
                        quantity: item.quantity,
                    },
                });

                await tx.stockMovement.create({
                    data: {
                        productId: item.productId,
                        warehouseId: data.warehouseId,
                        type: "OUT",
                        quantity: item.quantity,
                        userId: data.createdById,
                        reason: `Préstamo ${loan.number} - ${data.destination}`,
                        sourceType: "LOAN",
                        sourceId: loan.id,
                        loanId: loan.id,
                        expedienteId: data.expedienteId || undefined,
                    },
                });
            }

            return loan;
        });
    },
};
