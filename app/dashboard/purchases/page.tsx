import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getPurchaseOrders } from "@/app/actions/purchases";
import { UnauthorizedAccess } from "@/components/unauthorized-access";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ShoppingCart, Eye, PackageCheck } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const getPurchaseOrderStatusLabel = (status: string) => {
    switch (status) {
        case "RECEIVED":
            return "Recibida completa";
        case "PARTIALLY_RECEIVED":
            return "Recibida parcial";
        case "DRAFT":
            return "Pendiente de recepción";
        case "CANCELLED":
            return "Cancelada";
        default:
            return status;
    }
};

export const metadata = {
    title: "Órdenes de Compra | Control de Inventario",
    description: "Gestionar órdenes de compra y recepción",
};

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    RECEIVED: "default",
    PARTIALLY_RECEIVED: "outline",
    DRAFT: "secondary",
    CANCELLED: "destructive",
};

export default async function PurchasesPage() {
    const user = await getCurrentUser();

    if (!user || !hasPermission(user, "purchases.view")) {
        return <UnauthorizedAccess action="ver" resource="órdenes de compra" />;
    }

    const allOrders = await getPurchaseOrders();
    const receivedOrders = allOrders.filter((o) => o.status === "RECEIVED" || o.status === "PARTIALLY_RECEIVED");
    const canManage = hasPermission(user, "purchases.manage");

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Órdenes de Compra</h1>
                    <p className="text-muted-foreground">
                        Gestionar órdenes de compra y recepción de inventario
                    </p>
                </div>
                {canManage && (
                    <Button asChild>
                        <Link href="/dashboard/purchases/new">
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Nueva Orden de Compra
                        </Link>
                    </Button>
                )}
            </div>

            <Tabs defaultValue="all" className="w-full">
                <div className="overflow-x-auto">
                    <TabsList className="inline-flex w-max">
                        <TabsTrigger value="all">Todas ({allOrders.length})</TabsTrigger>
                        <TabsTrigger value="received">Recepción ({receivedOrders.length})</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="all" className="mt-6">
                    <PurchaseOrderTable orders={allOrders} />
                </TabsContent>
                <TabsContent value="received" className="mt-6">
                    <PurchaseOrderTable orders={receivedOrders} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function PurchaseOrderTable({ orders }: { orders: any[] }) {
    if (orders.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No se encontraron órdenes de compra</h3>
                    <p className="text-sm text-muted-foreground">
                        Crea una orden de compra para comenzar a recibir inventario
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            {/* Mobile Cards */}
            <div className="block md:hidden space-y-4">
                {orders.map((order) => (
                    <Card key={order.id}>
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <span className="font-mono font-medium text-lg">
                                        {order.orderNumber}
                                    </span>
                                    <div className="text-sm text-muted-foreground">
                                        {order.supplier.name}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {order.warehouse.name}
                                    </div>
                                </div>
                                <Badge variant={statusColors[order.status]}>
                                    {getPurchaseOrderStatusLabel(order.status)}
                                </Badge>
                            </div>
                            <div className="mt-4 flex items-center justify-between text-sm">
                                <div>
                                    <Badge variant="secondary">{order._count.items} artículos</Badge>
                                </div>
                                <div className="font-medium">
                                    ${Number(order.totalAmount).toFixed(2)}
                                </div>
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: es })}
                            </div>
                            <div className="flex gap-2 mt-3 pt-3 border-t">
                                <Button variant="outline" size="sm" asChild className="flex-1">
                                    <Link href={`/dashboard/purchases/${order.id}`}>
                                        <Eye className="h-4 w-4 mr-1" />
                                        Ver
                                    </Link>
                                </Button>
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
                            <TableHead>Número de Orden</TableHead>
                            <TableHead>Proveedor</TableHead>
                            <TableHead>Almacén</TableHead>
                            <TableHead>Artículos</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Creado</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.map((order) => (
                            <TableRow key={order.id}>
                                <TableCell className="font-mono font-medium">
                                    <Link
                                        href={`/dashboard/purchases/${order.id}`}
                                        className="hover:underline"
                                    >
                                        {order.orderNumber}
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    <Link
                                        href={`/dashboard/suppliers/${order.supplier.id}`}
                                        className="hover:underline"
                                    >
                                        {order.supplier.name}
                                    </Link>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {order.warehouse.name}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary">{order._count.items}</Badge>
                                </TableCell>
                                <TableCell className="font-medium">
                                    ${Number(order.totalAmount).toFixed(2)}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={statusColors[order.status]}>
                                        {getPurchaseOrderStatusLabel(order.status)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: es })}
                                </TableCell>
                                <TableCell>
                                    <Link href={`/dashboard/purchases/${order.id}`}>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </>
    );
}
