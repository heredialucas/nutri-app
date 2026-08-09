import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getReceipt, completeReceipt } from "@/app/actions/receipts";
import { UnauthorizedAccess } from "@/components/unauthorized-access";
import { redirect, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Plus, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { revalidatePath } from "next/cache";

export default async function ReceiptDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
        return <UnauthorizedAccess action="ver" resource="recepción" />;
    }

    const receipt = await getReceipt(id);
    if (!receipt) notFound();

    // A receipt is one physical document. Its item quantities are accumulated
    // when the same remito is received in multiple deliveries.
    const groupStatus = { allCompleted: receipt.status === "COMPLETED", total: 1 };
    const groupItems = receipt.items.map((item: any) => ({
        productId: item.productId,
        name: item.product.name,
        sku: item.product.sku,
        quantity: item.quantity,
        price: Number(item.unitPrice),
    }));

    // Aggregate items by productId, summing quantities
    const aggregatedItems = Object.values(
        groupItems.reduce<Record<string, { productId: string; name: string; sku: string; quantity: number }>>((acc, item) => {
            if (!acc[item.productId]) acc[item.productId] = { productId: item.productId, name: item.name, sku: item.sku, quantity: 0 };
            acc[item.productId].quantity += item.quantity;
            return acc;
        }, {})
    );
    const groupTotalAmount = groupItems.reduce((sum, item) => sum + item.quantity * item.price, 0);

    async function closeReceipt() {
        "use server";
        await completeReceipt(id);
        revalidatePath(`/dashboard/receipts/${id}`);
    }

    const canManage = hasPermission(user, "receipts.manage");
    const isGroupActive = !groupStatus.allCompleted;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 sm:gap-4">
                    {receipt.expedienteId && hasPermission(user, "expedientes.view") ? (
                        <Link href={`/dashboard/expedientes/${receipt.expedienteId}`} className="self-start sm:self-center mt-1 sm:mt-0">
                            <Button variant="ghost" size="icon" className="shrink-0">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                    ) : hasPermission(user, "inventory.view") ? (
                        <Link href="/dashboard/inventory" className="self-start sm:self-center mt-1 sm:mt-0">
                            <Button variant="ghost" size="icon" className="shrink-0">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                    ) : null}
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">
                                Remito {receipt.receiptNumber}
                            </h1>
                            <Badge variant={isGroupActive ? "outline" : "default"}>
                                {isGroupActive ? "En Proceso" : "Completado"}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm">
                            {format(new Date(receipt.date), "dd/MM/yyyy", { locale: es })}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {canManage && isGroupActive && (
                        <form action={closeReceipt}>
                            <Button
                                variant="default"
                                className="w-full sm:w-auto"
                                title="Cierra este remito. Luego no se podrán agregar nuevas cantidades."
                            >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Marcar Completado
                            </Button>
                        </form>
                    )}
                    {canManage && (
                        <Link href="/dashboard/receipts/new">
                            <Button variant="outline" className="w-full sm:w-auto">
                                <Plus className="mr-2 h-4 w-4" />
                                <span className="sm:hidden">Editar</span>
                                <span className="hidden sm:inline">Agregar ingreso</span>
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Información General</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Orden de Compra</span>
                            <span className="font-medium text-right">{receipt.purchaseOrder?.orderNumber || "Ingreso Directo"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Proveedor</span>
                            <span className="text-right">{receipt.purchaseOrder?.supplier?.name || receipt.supplier?.name || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Expediente</span>
                            <span className="text-right">{receipt.expediente?.number || "Sin expediente"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Depósito</span>
                            <span className="text-right">{receipt.purchaseOrder?.warehouse?.name || receipt.warehouse?.name || "N/A"}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Detalles del Remito</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Importe</span>
                            <span className="font-bold">${groupTotalAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Fecha de Carga</span>
                            <span className="text-right">
                                {format(new Date(receipt.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Mercadería Recibida</CardTitle>
                    <CardDescription className="text-sm">
                        {groupStatus.total > 1
                            ? `${groupStatus.total} ingresos · ${aggregatedItems.length} productos (cantidades totales agrupadas)`
                            : "Detalle de los artículos ingresados al stock"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Tabla para desktop */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Producto</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead className="text-right">Cantidad Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {aggregatedItems.map((item: any) => (
                                    <TableRow key={item.productId}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{item.sku}</TableCell>
                                        <TableCell className="text-right font-bold text-primary">{item.quantity}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Cards para móvil */}
                    <div className="md:hidden space-y-3">
                        {aggregatedItems.map((item: any) => (
                            <div key={item.productId} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="min-w-0">
                                    <p className="font-medium truncate">{item.name}</p>
                                    <p className="text-sm text-muted-foreground font-mono">{item.sku}</p>
                                </div>
                                <span className="font-bold text-primary shrink-0 ml-2">{item.quantity}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {receipt.imageUrl && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ImageIcon className="h-5 w-5 text-primary" />
                            Comprobante Adjunto (Remito)
                        </CardTitle>
                        <CardDescription>Imagen original del remito cargada en el sistema</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center bg-muted/20 p-6">
                        <div className="relative max-w-2xl w-full border rounded-lg overflow-hidden shadow-sm">
                            <img 
                                src={receipt.imageUrl} 
                                alt={`Remito ${receipt.receiptNumber}`}
                                className="w-full h-auto object-contain"
                            />
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
