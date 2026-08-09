"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, AlertTriangle, Package, Trash2, RotateCcw } from "lucide-react";
import { updateMinStockAction, clearWarehouseStockAction, deleteProductAction, restoreProductAction } from "@/app/actions/inventory";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface StockByWarehouse {
    warehouseId: string;
    warehouseName: string;
    warehouseType: string;
    quantity: number;
    hasActiveMovements: boolean;
}

interface Product {
    id: string;
    name: string;
    sku: string;
    price: number;
    minStock: number;
    unit: string;
    categoryName: string | null;
    totalStock: number;
    stockByWarehouse: StockByWarehouse[];
    isDeleted: boolean;
}

interface Warehouse {
    id: string;
    name: string;
    type: string;
}

interface AdminProductListProps {
    products: Product[];
    warehouses: Warehouse[];
    canManage: boolean;
    canRestore: boolean;
}

export function AdminProductList({ products, warehouses, canManage, canRestore }: AdminProductListProps) {
    const [search, setSearch] = useState("");
    const [locationFilter, setLocationFilter] = useState<string>("all");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [minStockValue, setMinStockValue] = useState<number>(0);
    const [loading, setLoading] = useState<string | null>(null);
    const [clearingStock, setClearingStock] = useState<string | null>(null);
    const [deletingProduct, setDeletingProduct] = useState<string | null>(null);
    const [restoringProduct, setRestoringProduct] = useState<string | null>(null);
    const [confirmProduct, setConfirmProduct] = useState<{ id: string; name: string; warehouses: StockByWarehouse[]; totalStock: number } | null>(null);

    const handleClearClick = (product: Product) => {
        setConfirmProduct({
            id: product.id,
            name: product.name,
            warehouses: product.stockByWarehouse,
            totalStock: product.totalStock,
        });
    };

    const handleClearConfirm = async () => {
        if (!confirmProduct || clearingStock) return;
        const { id, warehouses } = confirmProduct;
        setClearingStock(id);
        setConfirmProduct(null);
        try {
            for (const sw of warehouses) {
                if (sw.quantity > 0) {
                    const result = await clearWarehouseStockAction(id, sw.warehouseId);
                    if (result.error) {
                        alert(result.error);
                        break;
                    }
                }
            }
            window.location.reload();
        } catch (error) {
            console.error("Error clearing stock:", error);
        } finally {
            setClearingStock(null);
        }
    };

    const uniqueCategories = Array.from(
        new Set(products.map((p) => p.categoryName).filter(Boolean))
    ) as string[];

    const filtered = products.filter((p) => {
        const matchSearch =
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.sku.toLowerCase().includes(search.toLowerCase()) ||
            p.categoryName?.toLowerCase().includes(search.toLowerCase());

        const hasStockInDeposits = p.stockByWarehouse.some(
            (sw) => sw.warehouseType === "DEPOSIT" && sw.quantity > 0
        );
        const hasStockInOffices = p.stockByWarehouse.some(
            (sw) => sw.warehouseType === "OFFICE" && sw.quantity > 0
        );

        let matchLocation = true;
        if (locationFilter === "deposits") matchLocation = hasStockInDeposits;
        else if (locationFilter === "offices") matchLocation = hasStockInOffices;

        let matchCategory = true;
        if (categoryFilter !== "all") {
            matchCategory = p.categoryName === categoryFilter;
        }

        return matchSearch && matchLocation && matchCategory;
    });

    const activeProducts = filtered.filter((p) => !p.isDeleted);
    const deletedProducts = filtered.filter((p) => p.isDeleted);

    const startEditing = (product: Product) => {
        setEditingId(product.id);
        setMinStockValue(product.minStock);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setMinStockValue(0);
    };

    const saveMinStock = async (productId: string) => {
        if (loading) return;
        setLoading(productId);
        try {
            await updateMinStockAction(productId, minStockValue);
            setEditingId(null);
            window.location.reload();
        } catch (error) {
            console.error("Error saving minStock:", error);
        } finally {
            setLoading(null);
        }
    };

    const handleDeleteProduct = async (product: Product) => {
        if (!confirm(`¿Eliminar lógicamente el producto "${product.name}"? Podrá restaurarse desde la base de datos.`)) return;

        setDeletingProduct(product.id);
        try {
            const result = await deleteProductAction(product.id);
            if (result.error) {
                alert(result.error);
                return;
            }
            window.location.reload();
        } finally {
            setDeletingProduct(null);
        }
    };

    const handleRestoreProduct = async (product: Product) => {
        if (!confirm(`¿Restaurar el producto "${product.name}"?`)) return;

        setRestoringProduct(product.id);
        try {
            const result = await restoreProductAction(product.id);
            if (result.error) {
                alert(result.error);
                return;
            }
            window.location.reload();
        } finally {
            setRestoringProduct(null);
        }
    };

    const getStockByWarehouse = (stockByWarehouse: StockByWarehouse[]) => {
        if (stockByWarehouse.length === 0) return "-";
        
        const withStock = stockByWarehouse.filter((sw) => sw.quantity > 0);
        if (withStock.length === 0) return "-";
        
        return (
            <div className="flex flex-wrap gap-1">
                {withStock.map((sw) => {
                    const isOrphaned = !sw.hasActiveMovements;

                    return (
                        <Badge
                            key={sw.warehouseId}
                            variant={sw.warehouseType === "OFFICE" ? "default" : "outline"}
                            className={`text-[10px] py-0 px-1.5 ${
                                sw.warehouseType === "OFFICE"
                                    ? "bg-green-100 text-green-800 hover:bg-green-100"
                                    : ""
                            } ${isOrphaned ? "border-red-300 bg-red-50 text-red-700" : ""}`}
                        >
                            {sw.warehouseName} ({sw.warehouseType === "OFFICE" ? "Oficina" : "Depósito"})
                            {isOrphaned && (
                                <span className="ml-1 text-red-500" title="Stock sin origen documental">⚠️</span>
                            )}
                        </Badge>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-4 items-center">
                <div className="relative max-w-md flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar productos..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Ubicación" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas las ubicaciones</SelectItem>
                        <SelectItem value="deposits">En Depósitos</SelectItem>
                        <SelectItem value="offices">En Oficinas</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas las categorías</SelectItem>
                        {uniqueCategories.map((cat) => (
                            <SelectItem key={cat} value={cat!}>
                                {cat}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>SKU</TableHead>
                            <TableHead>Producto</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead className="text-center">Total</TableHead>
                            <TableHead>Ubicación</TableHead>
                            <TableHead className="text-center">Mín</TableHead>
                            <TableHead className="text-center">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {activeProducts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    No se encontraron productos
                                </TableCell>
                            </TableRow>
                        ) : (
                            activeProducts.map((product) => (
                                <TableRow key={product.id} className={product.isDeleted ? "opacity-50" : ""}>
                                    <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{product.name}</span>
                                            {product.totalStock <= product.minStock && product.totalStock > 0 && (
                                                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                                            )}
                                            {product.totalStock === 0 && (
                                                <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            ${product.price.toFixed(2)} / {product.unit}
                                        </div>
                                    </TableCell>
                                    <TableCell>{product.categoryName || "-"}</TableCell>
                                    <TableCell className="text-center">
                                        <div
                                            className={`font-semibold ${
                                                product.totalStock === 0
                                                    ? "text-red-600"
                                                    : product.totalStock <= product.minStock
                                                    ? "text-amber-600"
                                                    : "text-green-600"
                                            }`}
                                        >
                                            {product.totalStock}
                                        </div>
                                    </TableCell>
                                    <TableCell>{getStockByWarehouse(product.stockByWarehouse)}</TableCell>
                                    <TableCell className="text-center">
                                        {editingId === product.id ? (
                                            <div className="flex items-center justify-center gap-1">
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    value={minStockValue}
                                                    onChange={(e) => setMinStockValue(parseInt(e.target.value) || 0)}
                                                    className="h-7 w-16 text-center"
                                                />
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => saveMinStock(product.id)}
                                                    disabled={loading === product.id}
                                                >
                                                    ✓
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={cancelEditing}>
                                                    ✕
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center gap-1">
                                                <span>{product.minStock}</span>
                                                {canManage && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 px-1"
                                                        onClick={() => startEditing(product)}
                                                    >
                                                        ✎
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            {canManage && editingId !== product.id && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => startEditing(product)}
                                                >
                                                    Editar Mín
                                                </Button>
                                            )}
                                            {canManage && product.totalStock > 0 && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleClearClick(product)}
                                                    disabled={clearingStock === product.id}
                                                    className="text-red-600 border-red-300 hover:bg-red-50"
                                                >
                                                    {clearingStock === product.id ? "Limpiando..." : "Limpiar stock"}
                                                </Button>
                                            )}
                                            {canManage && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDeleteProduct(product)}
                                                    disabled={deletingProduct === product.id}
                                                    className="text-red-600 border-red-300 hover:bg-red-50"
                                                >
                                                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                                                    {deletingProduct === product.id ? "Eliminando..." : "Eliminar"}
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {deletedProducts.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Productos eliminados ({deletedProducts.length})
                    </h3>
                    <div className="border rounded-md opacity-60">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Producto</TableHead>
                                    <TableHead>Categoría</TableHead>
                                    <TableHead className="text-center">Stock Total</TableHead>
                                    <TableHead>Ubicación</TableHead>
                                    <TableHead className="text-center">Mín</TableHead>
                                    <TableHead className="text-center">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {deletedProducts.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                                        <TableCell>
                                            <span className="line-through">{product.name}</span>
                                        </TableCell>
                                        <TableCell>{product.categoryName || "-"}</TableCell>
                                        <TableCell className="text-center">{product.totalStock}</TableCell>
                                    <TableCell>{getStockByWarehouse(product.stockByWarehouse)}</TableCell>
                                        <TableCell className="text-center">{product.minStock}</TableCell>
                                        <TableCell className="text-center">
                                            {canRestore && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleRestoreProduct(product)}
                                                    disabled={restoringProduct === product.id}
                                                >
                                                    <RotateCcw className="mr-1 h-3.5 w-3.5" />
                                                    {restoringProduct === product.id ? "Restaurando..." : "Restaurar"}
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            <AlertDialog open={!!confirmProduct} onOpenChange={(open) => !open && setConfirmProduct(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Limpiar stock?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se eliminarán todas las <strong>{confirmProduct?.totalStock || 0} unidad(es)</strong> de stock
                            de <strong>{confirmProduct?.name}</strong> en todos los depósitos.
                            Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleClearConfirm();
                            }}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={!!clearingStock}
                        >
                            {clearingStock ? "Limpiando..." : "Sí, limpiar stock"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
