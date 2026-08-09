import prisma from "@/lib/prisma";
import { Prisma, PurchaseOrderStatus, PurchaseReceiptStatus } from "@prisma/client";

export const receiptService = {
    /**
     * Get all purchase receipts
     */
    async getReceipts(filters?: { expedienteId?: string; purchaseOrderId?: string }) {
        const where: Prisma.PurchaseReceiptWhereInput = { deletedAt: null };

        if (filters?.expedienteId) {
            where.expedienteId = filters.expedienteId;
        }

        if (filters?.purchaseOrderId) {
            where.purchaseOrderId = filters.purchaseOrderId;
        }

        const receipts = await prisma.purchaseReceipt.findMany({
            where,
            include: {
                purchaseOrder: {
                    include: {
                        supplier: true,
                        warehouse: true,
                    }
                },
                expediente: true,
                warehouse: true,
                supplier: true,
                _count: {
                    select: {
                        items: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return receipts.map(receipt => ({
            ...receipt,
            totalAmount: Number(receipt.totalAmount),
            purchaseOrder: receipt.purchaseOrder ? {
                ...receipt.purchaseOrder,
                totalAmount: Number(receipt.purchaseOrder.totalAmount),
            } : null,
        }));
    },

    /**
     * Get a single receipt
     */
    async getReceipt(id: string) {
        const receipt = await prisma.purchaseReceipt.findUnique({
            where: { id, deletedAt: null },
            include: {
                purchaseOrder: {
                    include: {
                        supplier: true,
                        warehouse: true,
                    }
                },
                expediente: true,
                warehouse: true,
                supplier: true,
                items: {
                    include: {
                        product: true,
                        purchaseOrderItem: true,
                    }
                }
            },
        });

        if (!receipt) return null;

        return {
            ...receipt,
            totalAmount: Number(receipt.totalAmount),
            purchaseOrder: receipt.purchaseOrder ? {
                ...receipt.purchaseOrder,
                totalAmount: Number(receipt.purchaseOrder.totalAmount),
            } : null,
            items: receipt.items.map(item => ({
                ...item,
                product: {
                    ...item.product,
                    price: Number(item.product.price),
                }
            }))
        };
    },

    /**
     * Create a Purchase Receipt and handle all stock updates and movement generation.
     */
    async createReceipt(data: {
        purchaseOrderId?: string;
        warehouseId?: string;
        receiptNumber: string;
        date: Date;
        imageUrl?: string;
        userId: string;
        expedienteId?: string;
        supplierId?: string;
        items: Array<{
            itemId?: string;
            productId: string;
            quantity: number;
            unitPrice?: number;
        }>;
    }) {
        const { purchaseOrderId, warehouseId, receiptNumber, date, imageUrl, userId, expedienteId, supplierId, items } = data;

        return await prisma.$transaction(async (tx) => {
            // Check if receipt group is already fully closed
            const existing = await tx.purchaseReceipt.findMany({
                where: { receiptNumber },
                select: { status: true },
            });
            if (existing.length > 0 && existing.every(r => r.status === "COMPLETED")) {
                throw new Error(`El remito ${receiptNumber} ya está cerrado. No se pueden agregar más ingresos.`);
            }

            let finalWarehouseId = warehouseId;
            let receiptTotalAmount = 0;
            let order = null;

            // 1. If linked to a PO, get info and validate
            if (purchaseOrderId) {
                order = await tx.purchaseOrder.findUnique({
                    where: { id: purchaseOrderId },
                    include: { items: true },
                });

                if (!order) throw new Error("Orden de compra no encontrada");
                finalWarehouseId = order.warehouseId;

                for (const received of items) {
                    if (received.itemId) {
                        const orderItem = order.items.find((item) => item.id === received.itemId);
                        if (orderItem) {
                            const remainingQty = orderItem.quantity - orderItem.receivedQty;
                            if (received.quantity > remainingQty) {
                                throw new Error(`No se pueden recibir ${received.quantity} unidades. Solo quedan ${remainingQty}.`);
                            }
                            receiptTotalAmount += received.quantity * Number(orderItem.unitPrice);
                        }
                    }
                }
            } else {
                // If direct entry, we need a warehouse and we calculate total based on provided unitPrice or current product price
                if (!finalWarehouseId) throw new Error("Debe seleccionar un depósito para el ingreso directo");
                
                const productIds = items.map(i => i.productId);
                const products = await tx.product.findMany({
                    where: { id: { in: productIds } }
                });

                for (const received of items) {
                    const product = products.find(p => p.id === received.productId);
                    const unitPrice = received.unitPrice ?? (product ? Number(product.price) : 0);
                    receiptTotalAmount += received.quantity * unitPrice;
                }
            }

            // 2. Create Purchase Receipt Record
            const receipt = await tx.purchaseReceipt.create({
                data: {
                    purchaseOrderId: purchaseOrderId || null,
                    warehouseId: purchaseOrderId ? null : finalWarehouseId,
                    receiptNumber,
                    date,
                    imageUrl,
                    totalAmount: 0,
                    expedienteId: expedienteId || order?.expedienteId || null,
                    supplierId: supplierId || order?.supplierId || null,
                    items: {
                        create: items.map(item => {
                            const product = order?.items.find(oi => oi.productId === item.productId);
                            const unitPrice = item.unitPrice ?? (product ? Number(product.unitPrice) : 0);
                            return {
                                productId: item.productId,
                                quantity: item.quantity,
                                unitPrice: unitPrice,
                            };
                        })
                    }
                },
                include: {
                    items: true
                }
            });

            const calculatedTotal = receipt.items.reduce((sum, item) => {
                return sum + (item.quantity * Number(item.unitPrice));
            }, 0);

            await tx.purchaseReceipt.update({
                where: { id: receipt.id },
                data: { totalAmount: calculatedTotal },
            });

            // 3. Create price history records and process stock
            for (const received of items) {
                // Update PO Item if applicable
                if (purchaseOrderId && received.itemId) {
                    await tx.purchaseOrderItem.update({
                        where: { id: received.itemId },
                        data: { receivedQty: { increment: received.quantity } },
                    });
                }

                // Find the created receipt item to link price history
                const receiptItem = receipt.items.find(ri => ri.productId === received.productId);
                
                // Create price history record
                if (receiptItem) {
                    const product = await tx.product.findUnique({ where: { id: received.productId } });
                    const unitPrice = received.unitPrice ?? (product ? Number(product.price) : 0);
                    const finalSupplierId = supplierId || order?.supplierId || null;
                    
                    if (finalSupplierId && unitPrice > 0) {
                        await tx.productPriceHistory.create({
                            data: {
                                productId: received.productId,
                                receiptItemId: receiptItem.id,
                                supplierId: finalSupplierId,
                                unitPrice: unitPrice,
                                quantity: received.quantity,
                                receiptDate: date,
                            }
                        });
                    }
                }

                // Update Warehouse Stock
                await tx.warehouseStock.upsert({
                    where: {
                        warehouseId_productId: {
                            warehouseId: finalWarehouseId!,
                            productId: received.productId,
                        },
                    },
                    create: {
                        warehouseId: finalWarehouseId!,
                        productId: received.productId,
                        quantity: received.quantity,
                    },
                    update: {
                        quantity: { increment: received.quantity },
                    },
                });

                // Create Stock Movement
                await tx.stockMovement.create({
                    data: {
                        productId: received.productId,
                        warehouseId: finalWarehouseId,
                        type: "IN",
                        quantity: received.quantity,
                        reason: purchaseOrderId 
                            ? `Recepción de orden ${order?.orderNumber} (Remito ${receiptNumber})`
                            : `Ingreso directo de stock (Remito ${receiptNumber})`,
                        userId,
                        sourceType: "RECEIPT",
                        sourceId: receipt.id,
                        expedienteId: expedienteId || order?.expedienteId || null,
                    },
                });
            }

            // 4. Update PO status if applicable
            if (purchaseOrderId) {
                const updatedItems = await tx.purchaseOrderItem.findMany({
                    where: { purchaseOrderId },
                });

                const hasReceived = updatedItems.some(item => item.receivedQty > 0);

                await tx.purchaseOrder.update({
                    where: { id: purchaseOrderId },
                    data: {
                        status: hasReceived ? "RECEIVED" : order?.status || "DRAFT",
                        receivedDate: hasReceived ? new Date() : order?.receivedDate,
                    },
                });
            }

            const receiptWithDetails = await tx.purchaseReceipt.findUnique({
                where: { id: receipt.id },
                include: {
                    purchaseOrder: true,
                    expediente: true,
                    warehouse: true,
                    supplier: true,
                }
            });

            if (!receiptWithDetails) return receipt;

            return {
                ...receiptWithDetails,
                totalAmount: Number(receiptWithDetails.totalAmount),
                purchaseOrder: receiptWithDetails.purchaseOrder ? {
                    ...receiptWithDetails.purchaseOrder,
                    totalAmount: Number(receiptWithDetails.purchaseOrder.totalAmount),
                } : null,
            };
        });
    },

    async createAccumulatedReceipt(data: {
        purchaseOrderId: string;
        expedienteId: string;
        receiptNumber: string;
        date: Date;
        imageUrl?: string;
        userId: string;
        items: Array<{
            purchaseOrderItemId: string;
            productId: string;
            quantity: number;
        }>;
    }) {
        return prisma.$transaction(async (tx) => {
            const order = await tx.purchaseOrder.findUnique({
                where: { id: data.purchaseOrderId },
                include: { items: { include: { product: true } }, supplier: true },
            });
            if (!order || order.deletedAt || order.status === "CANCELLED") {
                throw new Error("La orden de compra no está disponible");
            }
            if (order.expedienteId !== data.expedienteId) {
                throw new Error("La orden no pertenece al expediente seleccionado");
            }
            if (!data.items.length) throw new Error("Selecciona al menos un producto recibido");

            const existingReceipt = await tx.purchaseReceipt.findFirst({
                where: {
                    receiptNumber: data.receiptNumber,
                    purchaseOrderId: data.purchaseOrderId,
                    expedienteId: data.expedienteId,
                    deletedAt: null,
                },
                include: { items: true },
            });
            if (existingReceipt?.status === "COMPLETED") {
                throw new Error("Este remito ya está cerrado y no admite nuevos ingresos");
            }

            const receivedByItem = new Map<string, number>();
            for (const item of data.items) {
                if (item.quantity <= 0) throw new Error("Las cantidades recibidas deben ser mayores que cero");
                const orderItem = order.items.find(candidate => candidate.id === item.purchaseOrderItemId);
                if (!orderItem || orderItem.productId !== item.productId) {
                    throw new Error("Uno de los productos no pertenece a la orden seleccionada");
                }
                const alreadySelected = receivedByItem.get(item.purchaseOrderItemId) || 0;
                const pendingQty = orderItem.quantity - orderItem.receivedQty - alreadySelected;
                if (item.quantity > pendingQty) {
                    throw new Error(`No se pueden recibir ${item.quantity} unidades de ${orderItem.product.name}. Solo quedan ${pendingQty}.`);
                }
                receivedByItem.set(item.purchaseOrderItemId, alreadySelected + item.quantity);
            }

            const incomingTotal = data.items.reduce((sum, item) => {
                const orderItem = order.items.find(candidate => candidate.id === item.purchaseOrderItemId)!;
                return sum + item.quantity * Number(orderItem.unitPrice);
            }, 0);

            const receipt = existingReceipt
                ? await tx.purchaseReceipt.update({
                    where: { id: existingReceipt.id },
                    data: {
                        date: data.date,
                        imageUrl: data.imageUrl || existingReceipt.imageUrl,
                        totalAmount: Number(existingReceipt.totalAmount) + incomingTotal,
                    },
                    include: { items: true },
                })
                : await tx.purchaseReceipt.create({
                    data: {
                        purchaseOrderId: order.id,
                        warehouseId: null,
                        receiptNumber: data.receiptNumber,
                        date: data.date,
                        imageUrl: data.imageUrl,
                        totalAmount: incomingTotal,
                        expedienteId: order.expedienteId,
                        supplierId: order.supplierId,
                        items: {
                            create: [],
                        },
                    },
                    include: { items: true },
                });

            for (const item of data.items) {
                const orderItem = order.items.find(candidate => candidate.id === item.purchaseOrderItemId)!;
                const currentReceiptItem = receipt.items.find(candidate => candidate.purchaseOrderItemId === item.purchaseOrderItemId);
                const receiptItem = currentReceiptItem
                    ? await tx.purchaseReceiptItem.update({
                        where: { id: currentReceiptItem.id },
                        data: { quantity: { increment: item.quantity } },
                    })
                    : await tx.purchaseReceiptItem.create({
                        data: {
                            receiptId: receipt.id,
                            purchaseOrderItemId: orderItem.id,
                            productId: orderItem.productId,
                            quantity: item.quantity,
                            unitPrice: orderItem.unitPrice,
                        },
                    });

                await tx.purchaseOrderItem.update({
                    where: { id: orderItem.id },
                    data: { receivedQty: { increment: item.quantity } },
                });

                if (!currentReceiptItem) {
                    await tx.productPriceHistory.create({
                        data: {
                            productId: orderItem.productId,
                            receiptItemId: receiptItem.id,
                            supplierId: order.supplierId,
                            unitPrice: orderItem.unitPrice,
                            quantity: item.quantity,
                            receiptDate: data.date,
                        },
                    });
                } else {
                    const history = await tx.productPriceHistory.findUnique({
                        where: { receiptItemId: receiptItem.id },
                    });
                    if (history) {
                        await tx.productPriceHistory.update({
                            where: { receiptItemId: receiptItem.id },
                            data: { quantity: { increment: item.quantity }, receiptDate: data.date },
                        });
                    }
                }

                await tx.warehouseStock.upsert({
                    where: {
                        warehouseId_productId: {
                            warehouseId: order.warehouseId,
                            productId: orderItem.productId,
                        },
                    },
                    create: { warehouseId: order.warehouseId, productId: orderItem.productId, quantity: item.quantity },
                    update: { quantity: { increment: item.quantity } },
                });

                await tx.stockMovement.create({
                    data: {
                        productId: orderItem.productId,
                        warehouseId: order.warehouseId,
                        type: "IN",
                        quantity: item.quantity,
                        reason: `Recepción ${data.receiptNumber} · ${order.orderNumber}`,
                        userId: data.userId,
                        sourceType: "RECEIPT",
                        sourceId: receipt.id,
                        expedienteId: data.expedienteId,
                    },
                });
            }

            const updatedItems = await tx.purchaseOrderItem.findMany({ where: { purchaseOrderId: order.id } });
            const allReceived = updatedItems.every(item => item.receivedQty >= item.quantity);
            const hasReceived = updatedItems.some(item => item.receivedQty > 0);
            await tx.purchaseOrder.update({
                where: { id: order.id },
                data: {
                    status: allReceived ? "RECEIVED" : hasReceived ? "PARTIALLY_RECEIVED" : "DRAFT",
                    receivedDate: hasReceived ? new Date() : null,
                },
            });

            if (allReceived) {
                await tx.purchaseReceipt.update({
                    where: { id: receipt.id },
                    data: { status: "COMPLETED" },
                });
            }

            return tx.purchaseReceipt.findUnique({
                where: { id: receipt.id },
                include: { purchaseOrder: { include: { supplier: true, warehouse: true } }, expediente: true, items: { include: { product: true } } },
            });
        }, { maxWait: 10000, timeout: 30000 });
    },

    /**
     * Update an existing receipt
     */
    async updateReceipt(id: string, data: {
        receiptNumber?: string;
        date?: Date;
        imageUrl?: string;
        warehouseId?: string;
        purchaseOrderId?: string;
        expedienteId?: string;
        supplierId?: string;
        items?: Array<{
            productId: string;
            quantity: number;
            unitPrice?: number;
        }>;
        userId: string;
    }) {
        const { receiptNumber, date, imageUrl, warehouseId, purchaseOrderId, expedienteId, supplierId, items, userId } = data;

        return await prisma.$transaction(async (tx) => {
            const oldReceipt = await tx.purchaseReceipt.findUnique({
                where: { id },
                include: { items: true }
            });

            if (!oldReceipt) throw new Error("Remito no encontrado");

            // 1. Calculate deltas for each product
            const deltas = new Map<string, { productId: string, delta: number }>();
            
            if (items) {
                // Subtract old quantities
                for (const oldItem of oldReceipt.items) {
                    deltas.set(oldItem.productId, { 
                        productId: oldItem.productId, 
                        delta: -oldItem.quantity 
                    });
                }
                
                // Add new quantities
                for (const newItem of items) {
                    const entry = deltas.get(newItem.productId) || { productId: newItem.productId, delta: 0 };
                    deltas.set(newItem.productId, { 
                        productId: newItem.productId, 
                        delta: entry.delta + newItem.quantity 
                    });
                }

                // 2. Delete old receipt items and apply new ones in the database record
                await tx.purchaseReceiptItem.deleteMany({
                    where: { receiptId: id }
                });
            }

            // 3. Calculate new total amount using item's own unitPrice
            let receiptTotalAmount = Number(oldReceipt.totalAmount);
            if (items) {
                receiptTotalAmount = 0;
                for (const item of items) {
                    const unitPrice = item.unitPrice ?? 0;
                    receiptTotalAmount += item.quantity * unitPrice;
                }
            }

            // 4. Update Receipt Record
            const updatedReceipt = await tx.purchaseReceipt.update({
                where: { id },
                data: {
                    receiptNumber: receiptNumber ?? oldReceipt.receiptNumber,
                    date: date ?? oldReceipt.date,
                    imageUrl: imageUrl ?? oldReceipt.imageUrl,
                    warehouseId: warehouseId ?? oldReceipt.warehouseId,
                    purchaseOrderId: purchaseOrderId !== undefined ? (purchaseOrderId === "none" ? null : purchaseOrderId) : oldReceipt.purchaseOrderId,
                    expedienteId: expedienteId !== undefined ? (expedienteId === "none" ? null : expedienteId) : oldReceipt.expedienteId,
                    supplierId: supplierId !== undefined ? (supplierId === "none" ? null : supplierId) : oldReceipt.supplierId,
                    totalAmount: receiptTotalAmount,
                    items: items ? {
                        create: items.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice ?? 0,
                        }))
                    } : undefined
                }
            });

            // 5. Apply deltas to stock and create movements
            if (items) {
                const finalWarehouseId = warehouseId ?? oldReceipt.warehouseId;
                
                for (const [productId, { delta }] of deltas.entries()) {
                    // If no change, skip stock updates and movements
                    if (delta === 0) continue;

                    // Validar stock suficiente si es decremento
                    if (delta < 0) {
                        const ws = await tx.warehouseStock.findUnique({
                            where: {
                                warehouseId_productId: {
                                    warehouseId: finalWarehouseId!,
                                    productId,
                                },
                            },
                        });
                        const currentStock = ws?.quantity || 0;
                        if (currentStock < -delta) {
                            throw new Error(
                                `Stock insuficiente al editar remito. Producto: ${productId}. Stock actual: ${currentStock}, necesario: ${-delta}`
                            );
                        }
                    }

                    // Update Warehouse Stock (can be negative if decrementing)
                    await tx.warehouseStock.upsert({
                        where: {
                            warehouseId_productId: {
                                warehouseId: finalWarehouseId!,
                                productId: productId,
                            },
                        },
                        create: {
                            warehouseId: finalWarehouseId!,
                            productId: productId,
                            quantity: delta,
                        },
                        update: {
                            quantity: { increment: delta },
                        },
                    });

                    // Create movement for the delta adjustment
                    await tx.stockMovement.create({
                        data: {
                            productId: productId,
                            warehouseId: finalWarehouseId,
                            type: "ADJUSTMENT",
                            quantity: delta, // This is the net change (+50 or -20 etc.)
                            reason: `Edición de remito ${updatedReceipt.receiptNumber}`,
                            userId,
                            sourceType: "RECEIPT",
                            sourceId: updatedReceipt.id,
                            expedienteId: updatedReceipt.expedienteId,
                        },
                    });
                }
            }

            return {
                ...updatedReceipt,
                totalAmount: Number(updatedReceipt.totalAmount),
            };
        });
    },

    /**
     * Delete a receipt and revert all its effects (stock, PO status, etc.)
     */
    async deleteReceipt(id: string, userId: string) {
        return await prisma.$transaction(async (tx) => {
            // 1. Get receipt with items and PO info
            const receipt = await tx.purchaseReceipt.findUnique({
                where: { id },
                include: { 
                    items: true,
                    purchaseOrder: {
                        include: { items: true }
                    }
                }
            });

            if (!receipt) throw new Error("Remito no encontrado");

            const finalWarehouseId = receipt.warehouseId || receipt.purchaseOrder?.warehouseId;
            if (!finalWarehouseId) throw new Error("No se pudo determinar el depósito del remito");

            // 2. Revert stock and create "removal" movements
            for (const item of receipt.items) {
                // Validar stock suficiente antes de decrementar
                const currentWs = await tx.warehouseStock.findUnique({
                    where: {
                        warehouseId_productId: {
                            warehouseId: finalWarehouseId,
                            productId: item.productId,
                        },
                    },
                });
                const currentStock = currentWs?.quantity || 0;
                if (currentStock < item.quantity) {
                    throw new Error(
                        `Stock insuficiente al eliminar remito. Producto: ${item.productId}. Stock actual: ${currentStock}, necesario: ${item.quantity}`
                    );
                }

                // Decrease Warehouse Stock
                await tx.warehouseStock.update({
                    where: {
                        warehouseId_productId: {
                            warehouseId: finalWarehouseId,
                            productId: item.productId,
                        },
                    },
                    data: {
                        quantity: { decrement: item.quantity },
                    },
                });

                // If linked to PO, decrement receivedQty
                if (receipt.purchaseOrderId) {
                    // Find the matching PO item. 
                    // Note: This assumes one PO item per product in the receipt, which is typical.
                    // If there are multiple PO items for the same product, this might need refinement.
                    const poItem = receipt.purchaseOrder?.items.find(poi => poi.productId === item.productId);
                    if (poItem) {
                        await tx.purchaseOrderItem.update({
                            where: { id: poItem.id },
                            data: { receivedQty: { decrement: item.quantity } },
                        });
                    }
                }

                // Create Stock Movement (Adjustment/Removal)
                await tx.stockMovement.create({
                    data: {
                        productId: item.productId,
                        warehouseId: finalWarehouseId,
                        type: "OUT",
                        quantity: item.quantity,
                        reason: `Eliminación de remito ${receipt.receiptNumber}`,
                        userId,
                        sourceType: "RECEIPT",
                        sourceId: receipt.id,
                        expedienteId: receipt.expedienteId,
                    },
                });
            }

            // 3. Update PO status if applicable
            if (receipt.purchaseOrderId) {
                const updatedItems = await tx.purchaseOrderItem.findMany({
                    where: { purchaseOrderId: receipt.purchaseOrderId },
                });

                const allReceived = updatedItems.every(item => item.receivedQty === item.quantity && item.quantity > 0);
                const hasReceived = updatedItems.some(item => item.receivedQty > 0);

                await tx.purchaseOrder.update({
                    where: { id: receipt.purchaseOrderId },
                    data: {
                        status: hasReceived ? "RECEIVED" : "DRAFT",
                        receivedDate: hasReceived ? new Date() : null,
                    },
                });
            }

            // 4. Delete the receipt (items will be deleted via Cascade if configured, but let's be explicit if not)
            // The schema says: receipt PurchaseReceipt @relation(fields: [receiptId], references: [id], onDelete: Cascade)
            // So deleting the receipt will delete its items.
            await tx.purchaseReceipt.delete({
                where: { id }
            });

            return { success: true };
        });
    },

    /**
     * Close one physical receipt. Later additions to a closed receipt are rejected.
     */
    async completeReceipt(id: string) {
        const receipt = await prisma.purchaseReceipt.findUnique({
            where: { id },
        });

        if (!receipt) throw new Error("Remito no encontrado");
        if (receipt.status === "COMPLETED") return { count: 0 };

        await prisma.purchaseReceipt.update({
            where: { id: receipt.id },
            data: { status: "COMPLETED" },
        });

        return { count: 1 };
    },

    /**
     * Get items for a receipt group (all receipts sharing the same receiptNumber)
     */
    async getGroupItems(receiptNumber: string) {
        const receipts = await prisma.purchaseReceipt.findMany({
            where: { receiptNumber, deletedAt: null },
            include: {
                items: {
                    include: { product: true }
                }
            }
        });

        return receipts.flatMap(r => r.items.map(item => ({
            productId: item.productId,
            name: item.product.name,
            sku: item.product.sku,
            quantity: item.quantity,
            price: Number(item.unitPrice),
        })));
    },

    /**
     * Get group status for a receipt number
     */
    async getReceiptGroupStatus(receiptNumber: string) {
        const receipts = await prisma.purchaseReceipt.findMany({
            where: { receiptNumber, deletedAt: null },
            select: { status: true },
        });

        const allCompleted = receipts.every(r => r.status === "COMPLETED");
        return { allCompleted, total: receipts.length };
    },
};
