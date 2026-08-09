"use server";

import prisma from "@/lib/prisma";
import { inventoryService } from "@/services/inventory-service";
import { getCurrentUser, hasPermission, isSuperAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { serializePrisma } from "@/lib/utils";

/**
 * Extrae el publicId de una URL de Cloudinary
 */
function extractPublicIdFromCloudinaryUrl(url: string): string | null {
    try {
        const urlParts = url.split('/upload/');
        if (urlParts.length < 2) return null;

        const pathAfterUpload = urlParts[1];
        const pathSegments = pathAfterUpload.split('/');

        // Buscar el inicio de la carpeta (después de versión o transformaciones)
        const folderIndex = pathSegments.findIndex(
            seg => seg === 'inventory-control' || (!seg.startsWith('v') && !seg.includes(','))
        );

        if (folderIndex === -1) return null;

        // Tomar desde la carpeta hasta el final
        const relevantSegments = pathSegments.slice(folderIndex);
        const fileName = relevantSegments[relevantSegments.length - 1];
        const fileNameWithoutExt = fileName.split('.')[0];
        relevantSegments[relevantSegments.length - 1] = fileNameWithoutExt;

        return relevantSegments.join('/');
    } catch (error) {
        console.error('Error extracting publicId:', error);
        return null;
    }
}

export async function getProducts() {
    const products = await inventoryService.getProducts();
    return products.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
    }));
}

export async function getProductsWithWarehouseStock() {
    const products = await inventoryService.getAllProductsIncludingDeleted();
    
    const warehouses = await prisma.warehouse.findMany({
        where: { deletedAt: null },
        orderBy: { name: "asc" },
    });
    
    const stockItems = await prisma.warehouseStock.findMany({
        include: {
            warehouse: {
                select: { id: true, name: true, type: true },
            },
        },
    });
    
    // Fetch active movement counts per product+warehouse
    const allStockMovementKeys = stockItems.map(i => ({
        productId: i.productId,
        warehouseId: i.warehouseId,
    }));
    const movementKeySet = new Set(allStockMovementKeys.map(k => `${k.productId}:${k.warehouseId}`));
    
    // Obtener todos los movimientos activos agrupados por product+warehouse
    const activeMovements = await prisma.stockMovement.groupBy({
        by: ["productId", "warehouseId"],
        where: {
            deletedAt: null,
            warehouseId: { not: null },
            OR: Array.from(movementKeySet).map(key => {
                const [pid, wid] = key.split(":");
                return { productId: pid, warehouseId: wid };
            }),
        },
        _count: true,
    });
    
    const movementMap = new Map<string, number>();
    for (const m of activeMovements) {
        if (m.warehouseId) {
            movementMap.set(`${m.productId}:${m.warehouseId}`, m._count);
        }
    }
    
    const stockByProduct = new Map<string, Array<{ warehouseId: string; warehouseName: string; warehouseType: string; quantity: number; hasActiveMovements: boolean }>>();
    
    for (const item of stockItems) {
        const existing = stockByProduct.get(item.productId) || [];
        const key = `${item.productId}:${item.warehouseId}`;
        existing.push({
            warehouseId: item.warehouseId,
            warehouseName: item.warehouse.name,
            warehouseType: item.warehouse.type,
            quantity: item.quantity,
            hasActiveMovements: (movementMap.get(key) || 0) > 0,
        });
        stockByProduct.set(item.productId, existing);
    }
    
    return {
        products: products.map((p) => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            price: p.price,
            minStock: p.minStock,
            unit: p.unit,
            categoryName: p.category?.name || null,
            totalStock: p.stock,
            stockByWarehouse: stockByProduct.get(p.id) || [],
            isDeleted: p.isDeleted,
        })),
        warehouses: warehouses.map((w) => ({
            id: w.id,
            name: w.name,
            type: w.type,
        })),
    };
}

export async function updateMinStockAction(productId: string, minStock: number) {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "adminProducts.manage")) {
        return { error: "No tienes permisos para realizar esta acción" };
    }

    try {
        await prisma.product.update({
            where: { id: productId },
            data: { minStock },
        });
        revalidatePath("/dashboard/administracion/productos");
        return { success: true };
    } catch (error) {
        console.error("Error updating minStock:", error);
        return { error: "Error al actualizar stock mínimo" };
    }
}

export async function createProductAction(formData: FormData) {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "inventory.manage")) {
        return { error: "No tienes permisos para realizar esta acción" };
    }

    const sku = formData.get("sku") as string;
    const name = formData.get("name") as string;
    const price = parseFloat(formData.get("price") as string) || 0;
    const minStock = parseInt(formData.get("minStock") as string) || 0;
    const categoryId = formData.get("categoryId") as string;

    // Lógica de Stock Inicial
    const initialStock = parseInt(formData.get("initialStock") as string) || 0;
    const initialWarehouseId = formData.get("initialWarehouseId") as string;
    const unit = formData.get("unit") as string || "U";

    // Manejar archivo de imagen - es un File object, no una string
    const receiptImageFile = formData.get("receiptImageUrl") as File | null;
    let receiptImageUrl: string | undefined = undefined;

    if (!name || isNaN(price) || isNaN(minStock)) {
        return { error: "Datos inválidos" };
    }

    // Validación: El stock inicial es obligatorio y debe ser positivo
    if (initialStock <= 0) {
        return { error: "El stock inicial debe ser mayor a 0" };
    }
    if (!initialWarehouseId) {
        return { error: "Debe seleccionar un depósito para el stock inicial" };
    }

    try {
        // Si hay un archivo de imagen, convertirlo a base64 y subirlo
        if (receiptImageFile && receiptImageFile.size > 0) {
            const arrayBuffer = await receiptImageFile.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64 = buffer.toString('base64');
            const dataUrl = `data:${receiptImageFile.type};base64,${base64}`;

            // Importar dinámicamente la función de upload
            const { uploadImage } = await import('./cloudinary');
            const uploadResult = await uploadImage(dataUrl, 'products');

            if (uploadResult.success && uploadResult.url) {
                receiptImageUrl = uploadResult.url;
            }
        }

        await inventoryService.createProductWithInitialStock({
            sku,
            name,
            price,
            unit,
            minStock,
            categoryId: categoryId || undefined,
            initialStock,
            warehouseId: initialWarehouseId || undefined,
            userId: user.id,
        });
    } catch (error) {
        console.error("Error creating product:", error);
        return { error: "Error al crear producto" };
    }

    // redirect() debe estar FUERA del try-catch: Next.js lanza NEXT_REDIRECT
    // internamente y si es capturado por catch, la navegación falla.
    revalidatePath("/dashboard/inventory");
    if (initialWarehouseId) {
        revalidatePath("/dashboard/warehouses");
        revalidatePath(`/dashboard/warehouses/${initialWarehouseId}`);
    }
    redirect("/dashboard/inventory");
}

export async function quickCreateProductAction(data: {
    sku: string;
    name: string;
    price: number;
    categoryId?: string;
    newCategoryName?: string;
    unit?: string;
}) {
    const user = await getCurrentUser();
    if (!user) {
        return { error: "Debes iniciar sesión" };
    }
    // Allow if has inventory.manage OR (purchases.manage AND suppliers.manage) OR receipts.manage
    const canManage = hasPermission(user, "inventory.manage") || 
        (hasPermission(user, "purchases.manage") && hasPermission(user, "suppliers.manage")) ||
        hasPermission(user, "receipts.manage");
    if (!canManage) {
        return { error: "No tienes permisos para realizar esta acción" };
    }

    try {
        // 1. Validar si el SKU ya existe ANTES de intentar crear
        const existingProduct = await prisma.product.findUnique({
            where: { sku: data.sku }
        });

        if (existingProduct) {
            return { error: `El código SKU "${data.sku}" ya pertenece al producto: ${existingProduct.name}.` };
        }

        let finalCategoryId = data.categoryId;

        // 2. Crear categoría si es nueva
        if (data.newCategoryName) {
            const category = await inventoryService.createCategory(data.newCategoryName);
            finalCategoryId = category.id;
        }

        // 3. Crear el producto
        const product = await inventoryService.createProduct({
            sku: data.sku,
            name: data.name,
            price: data.price,
            categoryId: finalCategoryId,
            minStock: 0,
        });

        revalidatePath("/dashboard/inventory");
        return { 
            success: true, 
            product: serializePrisma(product)
        };
    } catch (error: any) {
        console.error("Error in quickCreateProductAction:", error);
        return { error: "Error interno al intentar crear el producto. Revisa los datos." };
    }
}

export async function updateProductAction(id: string, formData: FormData) {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "inventory.manage")) {
        return { error: "No tienes permisos para realizar esta acción" };
    }

    const name = formData.get("name") as string;
    const price = parseFloat(formData.get("price") as string) || 0;
    const minStock = parseInt(formData.get("minStock") as string) || 0;
    const categoryId = formData.get("categoryId") as string;
    const unit = formData.get("unit") as string || "U";

    // Campos de compra ya no se actualizan directamente en el producto.
    // Solo se permite actualizar detalles de catálogo (nombre, precio, etc).

    try {
        // No image upload logic here anymore, since products don't store receiptImageUrl directly.

        await inventoryService.updateProduct(id, {
            name,
            price: isNaN(price) ? undefined : price,
            minStock: isNaN(minStock) ? undefined : minStock,
            categoryId: categoryId || undefined,
            unit,
        });

        const newStock = parseInt(formData.get("stock") as string);
        if (!isNaN(newStock)) {
            const product = await inventoryService.getProduct(id);
            if (product && product.stock !== newStock) {
                const diff = newStock - product.stock;
                // ADJUSTMENT suma quantity con signo: positivo agrega, negativo resta
                await inventoryService.registerMovement({
                    productId: id,
                    type: "ADJUSTMENT",
                    quantity: diff,
                    userId: user.id,
                    reason: "Corrección manual desde Edición de Producto",
                    sourceType: "ADJUSTMENT",
                    sourceId: id,
                });
            }
        }
    } catch (error) {
        console.error("Error updating product:", error);
        return { error: "Error al actualizar producto" };
    }

    // redirect() debe estar FUERA del try-catch
    revalidatePath(`/dashboard/inventory/${id}`);
    revalidatePath("/dashboard/inventory");
    redirect("/dashboard/inventory");
}

export async function restockProductAction(formData: FormData) {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "inventory.manage")) {
        return { error: "No tienes permisos para realizar esta acción" };
    }

    const productId = formData.get("productId") as string;
    const quantity = parseInt(formData.get("quantity") as string);
    const warehouseId = formData.get("warehouseId") as string;
    const reason = formData.get("reason") as string || "Reingreso manual de stock";

    if (!productId || isNaN(quantity) || quantity <= 0) {
        return { error: "ID de producto o cantidad inválida" };
    }

    // Manejar archivo de imagen
    const receiptImageFile = formData.get("receiptImageUrl") as File | null;
    let receiptImageUrl: string | undefined = undefined;

    try {
        if (receiptImageFile && receiptImageFile.size > 0) {
            const arrayBuffer = await receiptImageFile.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64 = buffer.toString('base64');
            const dataUrl = `data:${receiptImageFile.type};base64,${base64}`;

            const { uploadImage } = await import('./cloudinary');
            const uploadResult = await uploadImage(dataUrl, 'products');

            if (uploadResult.success && uploadResult.url) {
                receiptImageUrl = uploadResult.url;
            }
        }

        await inventoryService.registerMovement({
            productId,
            warehouseId: warehouseId || undefined,
            type: "IN",
            quantity,
            userId: user.id,
            reason,
            sourceType: "ADJUSTMENT",
            sourceId: productId,
        });
    } catch (error) {
        console.error("Error restocking product:", error);
        return { error: "Error al reingresar stock" };
    }

    revalidatePath("/dashboard/inventory");
    revalidatePath(`/dashboard/inventory/${productId}`);
    revalidatePath("/dashboard/movements");
    return { success: true };
}

export async function deleteProductAction(id: string) {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "adminProducts.manage")) {
        return { error: "No tienes permisos para eliminar" };
    }

    try {
        await inventoryService.deleteProduct(id);
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Error al eliminar producto" };
    }

    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/administracion/productos");
    revalidatePath("/dashboard/movements");
    revalidatePath("/dashboard/reports");
    return { success: true };
}

export async function restoreProductAction(id: string) {
    const user = await getCurrentUser();
    if (!user || !isSuperAdmin(user)) {
        return { error: "Solo el administrador principal puede restaurar productos" };
    }

    try {
        await inventoryService.restoreProduct(id);
        revalidatePath("/dashboard/inventory");
        revalidatePath("/dashboard/administracion/productos");
        revalidatePath("/dashboard/movements");
        revalidatePath("/dashboard/reports");
        return { success: true };
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Error al restaurar producto" };
    }
}

export async function createCategoryAction(formData: FormData) {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "inventory.manage") || !hasPermission(user, "categories.manage")) {
        return { error: "No tienes permisos para gestionar categorías" };
    }

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    if (!name) {
        return { error: "El nombre es requerido" };
    }

    try {
        await inventoryService.createCategory(name, description);
    } catch (error) {
        return { error: "Error al crear categoría" };
    }

    revalidatePath("/dashboard/inventory/create");
    revalidatePath("/dashboard/categories");
    return { success: true };
}

export async function updateCategoryAction(id: string, formData: FormData) {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "inventory.manage") || !hasPermission(user, "categories.manage")) {
        return { error: "No tienes permisos para gestionar categorías" };
    }

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    if (!name) {
        return { error: "El nombre es requerido" };
    }

    try {
        await inventoryService.updateCategory(id, name, description);
    } catch (error) {
        return { error: "Error al actualizar categoría" };
    }

    revalidatePath("/dashboard/categories");
    return { success: true };
}

export async function deleteCategoryAction(id: string) {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "inventory.manage") || !hasPermission(user, "categories.manage")) {
        return { error: "No tienes permisos para eliminar categorías" };
    }

    try {
        await inventoryService.deleteCategory(id);
    } catch (error) {
        return { error: "Error al eliminar categoría" };
    }

    revalidatePath("/dashboard/categories");
    return { success: true };
}

export async function clearWarehouseStockAction(productId: string, warehouseId: string) {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "adminProducts.manage")) {
        return { error: "No tienes permisos para limpiar stock" };
    }

    try {
        const result = await inventoryService.clearWarehouseStock(productId, warehouseId, user.id);
        revalidatePath("/dashboard/administracion/productos");
        return { success: true, message: result.message };
    } catch (error: any) {
        console.error("Error clearing warehouse stock:", error);
        return { error: error.message || "Error al limpiar stock" };
    }
}
