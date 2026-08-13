import { notFound, redirect } from "next/navigation";
import { getWarehouse, getWarehouseStock, getWarehouses } from "@/app/actions/warehouses";
import { getExpedientes } from "@/app/actions/expedientes";
import { WarehouseForm } from "@/components/warehouses/warehouse-form";
import { TransferForm } from "@/components/warehouses/transfer-form";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Package, MapPin, ArrowLeft, AlertTriangle, ArrowRight, Edit } from "lucide-react";
import Link from "next/link";

export default async function WarehouseDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const warehouse = await getWarehouse(id);

    if (!warehouse) {
        notFound();
    }

    const warehouses = await getWarehouses();
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    const stock = warehouse.stockItems || [];

    let expedientes: any[] = [];
    try {
        expedientes = await getExpedientes({ status: "ABIERTO" });
    } catch (e) {
        // user lacks expediente permissions
    }

    const canManage = hasPermission(user, "warehouses.manage");

    const lowStockItems = stock.filter(
        (item) => item.quantity <= item.product.minStock
    );

    const totalProducts = stock.filter((item) => item.quantity > 0).length;
    const totalQuantity = stock.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">
                <Link href="/dashboard/warehouses" className="self-start sm:self-center mt-1 sm:mt-0">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{warehouse.name}</h1>
                        <Badge variant={warehouse.isActive ? "default" : "secondary"}>
                            {warehouse.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground font-mono text-sm mt-1">
                        {warehouse.code}
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    {canManage && (
                        <>
                            <TransferForm
                                warehouses={warehouses}
                                expedientes={expedientes}
                                userId={user.id}
                                defaultFromWarehouseId={warehouse.id}
                                trigger={
                                    <Button variant="outline" className="w-full sm:w-auto">
                                        <ArrowRight className="mr-2 h-4 w-4" />
                                        <span className="sm:hidden">Transferir</span>
                                        <span className="hidden sm:inline">Transferir Stock</span>
                                    </Button>
                                }
                            />
                            <WarehouseForm warehouse={JSON.parse(JSON.stringify(warehouse))} trigger={
                                <Button className="w-full sm:w-auto">
                                    <Edit className="mr-2 h-4 w-4" />
                                    <span className="sm:hidden">Editar</span>
                                    <span className="hidden sm:inline">Editar</span>
                                </Button>
                            } />
                        </>
                    )}
                </div>
            </div>

            {/* Warehouse Info */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Información</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {warehouse.description && (
                            <div>
                                <p className="text-sm text-muted-foreground">Descripción</p>
                                <p className="text-sm">{warehouse.description}</p>
                            </div>
                        )}
                        {warehouse.address && (
                            <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Dirección</p>
                                    <p className="text-sm">{warehouse.address}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Estadísticas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Productos</span>
                            <span className="text-2xl font-bold">{totalProducts}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Cantidad Total</span>
                            <span className="text-2xl font-bold">{totalQuantity}</span>
                        </div>
                        {lowStockItems.length > 0 && (
                            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="text-sm">{lowStockItems.length} productos con stock bajo</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Stock Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Stock Actual</CardTitle>
                    <CardDescription>
                        Niveles de stock actuales para este depósito
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {stock.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Package className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No hay stock en este depósito</h3>
                            <p className="text-sm text-muted-foreground">
                                Transfiere productos a este depósito para comenzar
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Vista de tabla para desktop */}
                            <div className="hidden md:block rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Código</TableHead>
                                            <TableHead>Producto</TableHead>
                                            <TableHead>Marca</TableHead>
                                            <TableHead>Categoría</TableHead>
                                            <TableHead>Cantidad</TableHead>
                                            <TableHead>Stock Mínimo</TableHead>
                                            <TableHead>Estado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {stock.map((item) => {
                                            const isLowStock = item.quantity <= item.product.minStock;
                                            const isOutOfStock = item.quantity === 0;

                                            return (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-mono text-sm">
                                                        {item.product.sku}
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {item.product.name}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {item.product.brand || "-"}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {item.product.category?.name || "-"}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary">{item.quantity}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {item.product.minStock}
                                                    </TableCell>
                                                    <TableCell>
                                                        {isOutOfStock ? (
                                                            <Badge variant="destructive">Sin Stock</Badge>
                                                        ) : isLowStock ? (
                                                            <Badge variant="outline" className="border-orange-500 text-orange-600">
                                                                Stock Bajo
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline">En Stock</Badge>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Vista de cards para móviles */}
                            <div className="md:hidden space-y-4">
                                {stock.map((item) => {
                                    const isLowStock = item.quantity <= item.product.minStock;
                                    const isOutOfStock = item.quantity === 0;

                                    return (
                                        <Card key={item.id}>
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <h4 className="font-medium">{item.product.name}</h4>
                                                        <p className="text-sm text-muted-foreground">Marca: {item.product.brand || "-"}</p>
                                                        <p className="text-sm text-muted-foreground font-mono">
                                                            Código: {item.product.sku}
                                                        </p>
                                                    </div>
                                                    {isOutOfStock ? (
                                                        <Badge variant="destructive">Sin Stock</Badge>
                                                    ) : isLowStock ? (
                                                        <Badge variant="outline" className="border-orange-500 text-orange-600">
                                                            Stock Bajo
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline">En Stock</Badge>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <p className="text-muted-foreground">Categoría</p>
                                                        <p>{item.product.category?.name || "-"}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground">Cantidad</p>
                                                        <Badge variant="secondary" className="mt-1">{item.quantity}</Badge>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <p className="text-muted-foreground">Stock Mínimo</p>
                                                        <p>{item.product.minStock}</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
