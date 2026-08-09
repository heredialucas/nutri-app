import { getCurrentUser, hasPermission, isSuperAdmin } from "@/lib/auth";
import { getStockMovements } from "@/app/actions/traceability";
import { getWarehouses } from "@/app/actions/warehouses";
import { getProducts } from "@/app/actions/inventory";
import { UnauthorizedAccess } from "@/components/unauthorized-access";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Activity, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { MovementAction } from "@/components/movements/movement-action";

export const metadata = {
    title: "Movimientos de Stock | Control de Inventario",
    description: "Trazabilidad completa de todos los movimientos de inventario",
};

export default async function MovementsPage() {
    const user = await getCurrentUser();

    // Check basic view permission for movements
    if (!user || !hasPermission(user, "movements.view")) {
        return <UnauthorizedAccess action="ver" resource="movimientos de stock" />;
    }

    const movements = await getStockMovements();
    const warehouses = await getWarehouses();
    const products = await getProducts();
    const canManage = isSuperAdmin(user);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Movimientos de Stock</h1>
                    <p className="text-muted-foreground text-sm">
                        Trazabilidad completa de todos los movimientos de inventario
                    </p>
                </div>
                <Activity className="h-8 w-8 text-muted-foreground hidden sm:block" />
            </div>

            <Card>
                <CardContent className="pt-6">
                    <div className="grid gap-4 md:grid-cols-3 mb-6">
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Total de Movimientos</p>
                            <p className="text-2xl font-bold">{movements.length}</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Entradas</p>
                            <p className="text-2xl font-bold text-green-600">
                                {movements.filter((m) => m.type === "IN").length}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Salidas</p>
                            <p className="text-2xl font-bold text-red-600">
                                {movements.filter((m) => m.type === "OUT").length}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {movements.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No se encontraron movimientos</h3>
                        <p className="text-sm text-muted-foreground">
                            Los movimientos de stock aparecerán aquí
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Mobile Cards */}
                    <div className="block md:hidden space-y-4">
                        {movements.map((movement) => (
                            <Card key={movement.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="space-y-1">
                                            <div className="font-medium">{movement.product.name}</div>
                                            <div className="font-mono text-sm text-muted-foreground">{movement.product.sku}</div>
                                        </div>
                                        <Badge variant={movement.type === "IN" ? "default" : "secondary"}>
                                            {movement.type === "IN" ? (
                                                <ArrowUpRight className="w-3 h-3 mr-1" />
                                            ) : (
                                                <ArrowDownRight className="w-3 h-3 mr-1" />
                                            )}
                                            {movement.type === "IN" ? "Entrada" : "Salida"}
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Cantidad:</span>
                                            <span className="ml-2 font-medium">{movement.quantity}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Almacén:</span>
                                            <span className="ml-2">{movement.warehouse?.name || "N/A"}</span>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-muted-foreground">Usuario:</span>
                                            <span className="ml-2">{movement.user.email}</span>
                                        </div>
                                        {movement.reason && (
                                            <div className="col-span-2">
                                                <span className="text-muted-foreground">Motivo:</span>
                                                <span className="ml-2">{movement.reason}</span>
                                            </div>
                                        )}
                                        {movement.sourceType === "RECEIPT" && (
                                            <Link href={`/dashboard/receipts/${movement.sourceId}`} className="col-span-2 font-medium text-primary hover:underline">
                                                Ver remito de origen
                                            </Link>
                                        )}
                                        <div className="col-span-2 text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(movement.createdAt), { addSuffix: true, locale: es })}
                                        </div>
                                        <div className="col-span-2 flex justify-end">
                                            <MovementAction id={movement.id} canManage={canManage} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden md:block rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Producto</TableHead>
                                    <TableHead>Cantidad</TableHead>
                                    <TableHead>Almacén</TableHead>
                                    <TableHead>Usuario</TableHead>
                                    <TableHead>Motivo</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    {canManage && <TableHead className="text-right">Acciones</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {movements.map((movement) => (
                                    <TableRow key={movement.id}>
                                        <TableCell>
                                            <Badge variant={movement.type === "IN" ? "default" : "secondary"}>
                                                {movement.type === "IN" ? (
                                                    <ArrowUpRight className="w-3 h-3 mr-1" />
                                                ) : (
                                                    <ArrowDownRight className="w-3 h-3 mr-1" />
                                                )}
                                                {movement.type === "IN" ? "Entrada" : "Salida"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{movement.product.name}</p>
                                                <p className="text-xs text-muted-foreground font-mono">
                                                    {movement.product.sku}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">{movement.quantity}</TableCell>
                                        <TableCell className="text-sm">
                                            {movement.warehouse?.name || "N/A"}
                                        </TableCell>
                                        <TableCell className="text-sm">{movement.user.email}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                                            <div>{movement.reason || "-"}</div>
                                            {movement.sourceType === "RECEIPT" && (
                                                <Link href={`/dashboard/receipts/${movement.sourceId}`} className="text-xs font-medium text-primary hover:underline">
                                                    Ver remito
                                                </Link>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {formatDistanceToNow(new Date(movement.createdAt), { addSuffix: true, locale: es })}
                                        </TableCell>
                                        {canManage && (
                                            <TableCell className="text-right">
                                                <MovementAction id={movement.id} canManage={canManage} />
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </>
            )}
        </div>
    );
}
