import prisma from "@/lib/prisma";
import { Prisma, PurchaseOrderStatus } from "@prisma/client";
import { createImportedProductSku, normalizeImportedValue } from "@/services/purchase-workbook-parser";

function findImportedMatch(entries: Map<string, string>, value: string) {
    const normalized = normalizeImportedValue(value);
    const exact = entries.get(normalized);
    if (exact) return exact;

    const ignoredWords = new Set(["SA", "SAS", "SRL", "DE", "EL", "LA", "Y"]);
    const targetTokens = new Set(normalized.split(" ").filter(token => token.length > 2 && !ignoredWords.has(token)));
    if (targetTokens.size < 2) return undefined;

    let best: { id: string; score: number } | undefined;
    for (const [candidate, id] of entries) {
        const candidateTokens = new Set(candidate.split(" ").filter(token => token.length > 2 && !ignoredWords.has(token)));
        const shared = [...targetTokens].filter(token => candidateTokens.has(token)).length;
        const score = shared / Math.max(targetTokens.size, candidateTokens.size);
        if (score >= 0.7 && (!best || score > best.score)) best = { id, score };
    }
    return best?.id;
}

function importedProductKey(name: string, brand?: string) {
    return `${normalizeImportedValue(name)}::${normalizeImportedValue(brand || "")}`;
}

export const purchaseService = {
    // ==================== PURCHASE ORDER CRUD ====================

    /**
     * Get all purchase orders with filters
     */
    async getPurchaseOrders(filters?: {
        status?: PurchaseOrderStatus;
        supplierId?: string;
        warehouseId?: string;
    }) {
        const where: Prisma.PurchaseOrderWhereInput = {
            deletedAt: null,
        };

        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.supplierId) {
            where.supplierId = filters.supplierId;
        }
        if (filters?.warehouseId) {
            where.warehouseId = filters.warehouseId;
        }

        const orders = await prisma.purchaseOrder.findMany({
            where,
            include: {
                supplier: true,
                warehouse: true,
                expediente: {
                    select: { id: true, number: true, year: true, description: true },
                },
                createdBy: {
                    select: {
                        id: true,
                        email: true,
                        username: true,
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

        return orders.map(order => ({
            ...order,
            totalAmount: Number(order.totalAmount),
        }));
    },

    /**
     * Get a single purchase order with full details
     */
    async getPurchaseOrder(id: string) {
        const order = await prisma.purchaseOrder.findUnique({
            where: { id, deletedAt: null },
            include: {
                supplier: true,
                warehouse: true,
                createdBy: {
                    select: {
                        id: true,
                        email: true,
                        username: true,
                        firstName: true,
                        lastName: true,
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
                    orderBy: {
                        product: {
                            name: "asc",
                        },
                    },
                },
            },
        });

        if (!order) return null;

        return {
            ...order,
            totalAmount: Number(order.totalAmount),
            items: order.items.map(item => ({
                ...item,
                unitPrice: Number(item.unitPrice),
                product: {
                    ...item.product,
                    price: Number(item.product.price),
                }
            }))
        };
    },

    async getReceivablePurchasesByExpediente(expedienteId: string) {
        const orders = await prisma.purchaseOrder.findMany({
            where: {
                expedienteId,
                deletedAt: null,
                status: { not: "CANCELLED" },
            },
            include: {
                supplier: true,
                warehouse: true,
                receipts: {
                    where: { deletedAt: null, status: "ACTIVE" },
                    select: {
                        id: true,
                        receiptNumber: true,
                        date: true,
                        imageUrl: true,
                    },
                    orderBy: { date: "desc" },
                },
                items: {
                    include: { product: true },
                    orderBy: { product: { name: "asc" } },
                },
            },
            orderBy: { createdAt: "asc" },
        });

        return orders
            .map(order => ({
                id: order.id,
                orderNumber: order.orderNumber,
                supplier: order.supplier,
                warehouse: order.warehouse,
                receipts: order.receipts.map(receipt => ({
                    id: receipt.id,
                    receiptNumber: receipt.receiptNumber,
                    date: receipt.date,
                    imageUrl: receipt.imageUrl,
                })),
                status: order.status,
                items: order.items
                    .map(item => ({
                        id: item.id,
                        purchaseOrderItemId: item.id,
                        productId: item.productId,
                        productName: item.product.name,
                        brand: item.product.brand,
                        sku: item.product.sku,
                        orderedQty: item.quantity,
                        receivedQty: item.receivedQty,
                        pendingQty: Math.max(item.quantity - item.receivedQty, 0),
                        unitPrice: Number(item.unitPrice),
                    }))
                    .filter(item => item.pendingQty > 0),
            }))
            .filter(order => order.items.length > 0);
    },

    async createPurchaseOrder(data: {
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
        const { items, expedienteId, ...orderData } = data;
        if (!orderData.subject.trim() || !orderData.causative.trim() || !orderData.responsible.trim()) {
            throw new Error("Asunto, causante y responsable son obligatorios");
        }

        // Calculate total amount
        const totalAmount = items.reduce(
            (sum, item) => sum + item.quantity * item.unitPrice,
            0
        );

        // Generate order number
        const count = await prisma.purchaseOrder.count();
        const orderNumber = `OC-${String(count + 1).padStart(6, "0")}`;

        const order = await prisma.purchaseOrder.create({
            data: {
                ...orderData,
                orderNumber,
                totalAmount,
                status: "DRAFT",
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
                supplier: true,
                warehouse: true,
            },
        });

        return {
            ...order,
            totalAmount: Number(order.totalAmount),
            items: order.items.map(item => ({
                ...item,
                unitPrice: Number(item.unitPrice),
                product: {
                    ...item.product,
                    price: Number(item.product.price),
                }
            }))
        };
    },

    async createPurchaseOrdersFromImport(data: {
        warehouseId: string;
        expedienteId: string;
        createdById: string;
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
        subject: string;
        causative: string;
        responsible: string;
    }) {
        return prisma.$transaction(async (tx) => {
            const expediente = await tx.expediente.findFirst({
                where: { id: data.expedienteId, status: "ABIERTO", deletedAt: null },
            });
            if (!expediente) throw new Error("El expediente no existe o no está abierto");

            const warehouse = await tx.warehouse.findFirst({
                where: { id: data.warehouseId, isActive: true, deletedAt: null },
            });
            if (!warehouse) throw new Error("El almacén no existe o está inactivo");
            if (!data.subject.trim() || !data.causative.trim() || !data.responsible.trim()) {
                throw new Error("Asunto, causante y responsable son obligatorios");
            }

            const suppliers = await tx.supplier.findMany({ where: { deletedAt: null } });
            const products = await tx.product.findMany({ where: { deletedAt: null } });
            const supplierIds = new Map<string, string>();
            const productIds = new Map<string, string>();
            const usedSupplierCodes = new Set(suppliers.map(supplier => supplier.code));
            const usedProductSkus = new Set(products.map(product => product.sku));

            for (const supplier of suppliers) {
                supplierIds.set(normalizeImportedValue(supplier.name), supplier.id);
            }
            for (const product of products) {
                productIds.set(importedProductKey(product.name, product.brand || ""), product.id);
            }

            let orderSequence = await tx.purchaseOrder.count();
            const createdOrders = [];

            for (const group of data.groups) {
                const supplierName = group.supplierName.trim();
                if (!supplierName || group.items.length === 0) continue;

                let supplierId = findImportedMatch(supplierIds, supplierName);
                if (!supplierId) {
                    const baseCode = `IMP-${normalizeImportedValue(supplierName).replace(/\s+/g, "-").slice(0, 35) || "PROVEEDOR"}`;
                    let code = baseCode;
                    let suffix = 1;
                    while (usedSupplierCodes.has(code)) {
                        code = `${baseCode}-${suffix++}`;
                    }
                    const supplier = await tx.supplier.create({
                        data: {
                            name: supplierName,
                            code,
                            notes: "Creado automáticamente desde un cuadro comparativo",
                        },
                    });
                    supplierId = supplier.id;
                    supplierIds.set(normalizeImportedValue(supplierName), supplierId);
                    usedSupplierCodes.add(code);
                }

                const orderItems = [];
                for (const item of group.items) {
                    if (!item.productName || item.quantity <= 0 || item.unitPrice < 0) {
                        throw new Error(`El producto ${item.productName || "sin nombre"} tiene datos inválidos`);
                    }

                    let productId = item.productId;
                    if (productId) {
                        const existingProduct = products.find(product => product.id === productId);
                        if (!existingProduct || (item.brand?.trim() && normalizeImportedValue(existingProduct.brand || "") !== normalizeImportedValue(item.brand))) {
                            productId = undefined;
                        }
                    }

                    if (!productId) {
                        // Product descriptions often differ only by a critical
                        // measurement (for example 4 L vs 20 L). Never use fuzzy
                        // matching here; an unresolved product must be created or
                        // reviewed, not silently assigned to another presentation.
                        productId = productIds.get(importedProductKey(item.productName, item.brand));
                        if (!productId && !item.brand?.trim()) {
                            productId = productIds.get(importedProductKey(item.productName));
                        }
                    }

                    if (!productId) {
                        const baseSku = createImportedProductSku(item.productName);
                        let sku = baseSku;
                        let suffix = 1;
                        while (usedProductSkus.has(sku)) {
                            sku = `${baseSku}-${suffix++}`;
                        }
                        const product = await tx.product.create({
                            data: {
                                sku,
                                name: item.productName,
                                brand: item.brand?.trim() || null,
                                price: item.unitPrice,
                                supplierId,
                            },
                        });
                        productId = product.id;
                        productIds.set(importedProductKey(item.productName, item.brand), productId);
                        usedProductSkus.add(sku);
                    } else if (item.brand?.trim()) {
                        await tx.product.update({
                            where: { id: productId },
                            data: { brand: item.brand.trim() },
                        });
                    }

                    orderItems.push({
                        productId,
                        quantity: Math.round(item.quantity),
                        unitPrice: item.unitPrice,
                    });
                }

                const totalAmount = orderItems.reduce(
                    (sum, item) => sum + item.quantity * item.unitPrice,
                    0,
                );
                orderSequence += 1;
                const order = await tx.purchaseOrder.create({
                    data: {
                        orderNumber: `OC-${String(orderSequence).padStart(6, "0")}`,
                        supplierId,
                        warehouseId: data.warehouseId,
                        createdById: data.createdById,
                        expedienteId: data.expedienteId,
                        subject: data.subject.trim(),
                        causative: data.causative.trim(),
                        responsible: data.responsible.trim(),
                        totalAmount,
                        status: "DRAFT",
                        notes: data.sourceFileName
                            ? `Importada desde ${data.sourceFileName}`
                            : "Importada desde cuadro comparativo",
                        items: { create: orderItems },
                    },
                    include: { supplier: true, items: true },
                });
                createdOrders.push(order);
            }

            return createdOrders;
        }, {
            maxWait: 10000,
            timeout: 30000,
        });
    },

    /**
     * Update purchase order
     */
    async updatePurchaseOrder(
        id: string,
        data: {
            expectedDate?: Date;
            notes?: string;
            status?: PurchaseOrderStatus;
        }
    ) {
        const order = await prisma.purchaseOrder.update({
            where: { id },
            data,
        });
        return {
            ...order,
            totalAmount: Number(order.totalAmount),
        };
    },

    /**
     * Update order document URLs
     */
    async updateOrderDocument(
        id: string,
        docType: "invoice" | "creditNote" | "debitNote",
        url: string | null
    ) {
        const updateData: Record<string, string | null> = {};
        
        switch (docType) {
            case "invoice":
                updateData.invoiceUrl = url;
                break;
            case "creditNote":
                updateData.creditNoteUrl = url;
                break;
            case "debitNote":
                updateData.debitNoteUrl = url;
                break;
        }

        const order = await prisma.purchaseOrder.update({
            where: { id },
            data: updateData,
        });
        
        return order;
    },



    /**
     * Cancel purchase order
     */
    async cancelPurchaseOrder(id: string) {
        const order = await prisma.purchaseOrder.findUnique({
            where: { id },
            include: {
                items: true,
            },
        });

        if (!order) throw new Error("Orden de compra no encontrada");
        if (order.status === "RECEIVED") {
            throw new Error("No se puede cancelar orden ya recibida");
        }
        if (order.items.some((item) => item.receivedQty > 0)) {
            throw new Error("No se puede cancelar orden con artículos recibidos");
        }

        const cancelledOrder = await prisma.purchaseOrder.update({
            where: { id },
            data: { status: "CANCELLED" },
        });
        return {
            ...cancelledOrder,
            totalAmount: Number(cancelledOrder.totalAmount),
        };
    },

    /**
     * Mark order as pending (submitted to supplier)
     */
    async submitPurchaseOrder(id: string) {
        const order = await prisma.purchaseOrder.findUnique({
            where: { id },
        });

        if (!order) throw new Error("Orden de compra no encontrada");
        if (order.status !== "DRAFT") {
            throw new Error("Solo se pueden enviar órdenes en borrador");
        }

        const submittedOrder = await prisma.purchaseOrder.update({
            where: { id },
            data: { status: "RECEIVED" },
        });
        return {
            ...submittedOrder,
            totalAmount: Number(submittedOrder.totalAmount),
        };
    },

    /**
     * Get purchase order statistics
     */
    async getPurchaseStats() {
        const [totalOrders, totalSpent, receivedOrders, draftOrders] = await Promise.all([
            prisma.purchaseOrder.count({
                where: { deletedAt: null }
            }),
            prisma.purchaseOrder.aggregate({
                where: {
                    status: "RECEIVED",
                    deletedAt: null,
                },
                _sum: {
                    totalAmount: true,
                },
            }),
            prisma.purchaseOrder.count({
                where: { status: "RECEIVED", deletedAt: null },
            }),
            prisma.purchaseOrder.count({
                where: { status: "DRAFT", deletedAt: null },
            }),
        ]);

        return {
            totalOrders,
            totalSpent: Number(totalSpent._sum.totalAmount || 0),
            receivedOrders,
            draftOrders,
        };
    },
};
