import { notFound } from "next/navigation";
import { getPurchaseOrder, submitPurchaseOrder, cancelPurchaseOrder } from "@/app/actions/purchases";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Building2, MapPin, Calendar, XCircle, FileText, Upload, File, CreditCard, Receipt } from "lucide-react";
import { DocumentUpload } from "@/components/purchases/document-upload";
import Link from "next/link";
import { format } from "date-fns";
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
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/* Next.js 15: params is a Promise */
export default async function PurchaseOrderDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const order = await getPurchaseOrder(id);
    const user = await getCurrentUser();

    if (!order) {
        notFound();
    }

    if (!user) redirect("/login");

    // Server Actions for simple buttons
    async function cancelOrder() {
        "use server";
        await cancelPurchaseOrder(id);
        redirect(`/dashboard/purchases/${id}`); // Refresh page
    }

    const isCancelled = order.status === "CANCELLED";
    const canManage = hasPermission(user, "purchases.manage");

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex items-center gap-3 self-start sm:self-center">
                    <Link href="/dashboard/purchases">
                        <Button variant="ghost" size="icon" className="shrink-0">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">{order.orderNumber}</h1>
                        <Badge variant={
                            order.status === "RECEIVED" ? "outline" :
                                order.status === "CANCELLED" ? "destructive" :
                                    "default"
                        } className="shrink-0">
                            {getPurchaseOrderStatusLabel(order.status)}
                        </Badge>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:ml-auto">
                    {canManage && !isCancelled && (
                        <form action={cancelOrder}>
                            <Button variant="destructive" size="sm" className="w-full sm:w-auto">
                                <XCircle className="mr-2 h-4 w-4" />
                                <span>Cancelar Orden</span>
                            </Button>
                        </form>
                    )}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Proveedor</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-start gap-4">
                        <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                            <div className="font-semibold">{order.supplier.name}</div>
                            <div className="text-sm text-muted-foreground">{order.supplier.email}</div>
                            {order.supplier.phone && (
                                <div className="text-sm text-muted-foreground">{order.supplier.phone}</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Entregar A</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-start gap-4">
                        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                            <div className="font-semibold">{order.warehouse.name}</div>
                            <div className="text-sm text-muted-foreground">{order.warehouse.address}</div>
                            <div className="text-sm text-muted-foreground font-mono">{order.warehouse.code}</div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Información de la Orden</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Esperada:</span>
                            <span>{order.expectedDate ? format(new Date(order.expectedDate), "PPP", { locale: es }) : "No establecida"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Creada:</span>
                            <span>{format(new Date(order.createdAt), "PPP", { locale: es })}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Total:</span>
                            <span className="font-bold">${Number(order.totalAmount).toFixed(2)}</span>
                        </div>
                        <div className="pt-2 text-sm"><span className="text-muted-foreground">Asunto:</span> {order.subject || "-"}</div>
                        <div className="text-sm"><span className="text-muted-foreground">Causante:</span> {order.causative || "-"}</div>
                        <div className="text-sm"><span className="text-muted-foreground">Responsable:</span> {order.responsible || "-"}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Artículos de la Orden</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Mobile Cards */}
                    <div className="block md:hidden space-y-4">
                        {order.items.map((item) => (
                            <Card key={item.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <div className="font-medium">{item.product.name}</div>
                                            <div className="text-xs text-muted-foreground">Marca: {item.product.brand || "-"}</div>
                                            <div className="font-mono text-xs text-muted-foreground">{item.product.sku}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-medium">${(item.quantity * Number(item.unitPrice)).toFixed(2)}</div>
                                        </div>
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Cantidad:</span>
                                            <span className="ml-2">{item.quantity}</span>
                                        </div>
                                        <div>
                            <span className="text-muted-foreground">Recibida:</span>
                                            <span className={`ml-2 ${item.receivedQty === item.quantity ? "text-green-600 font-medium" :
                                                item.receivedQty > 0 ? "text-orange-600 font-medium" :
                                                    "text-muted-foreground"
                                                }`}>
                                                {item.receivedQty}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Pendiente:</span>
                                            <span className="ml-2 font-medium text-primary">{Math.max(item.quantity - item.receivedQty, 0)}</span>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-muted-foreground">Precio Unitario:</span>
                                            <span className="ml-2">${Number(item.unitPrice).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Producto</TableHead>
                                    <TableHead>Marca</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead className="text-right">Cantidad</TableHead>
                                    <TableHead className="text-right">Recibida</TableHead>
                                    <TableHead className="text-right">Pendiente</TableHead>
                                    <TableHead className="text-right">Precio Unitario</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {order.items.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.product.name}</TableCell>
                                        <TableCell>{item.product.brand || "-"}</TableCell>
                                        <TableCell className="font-mono text-xs">{item.product.sku}</TableCell>
                                        <TableCell className="text-right">{item.quantity}</TableCell>
                                        <TableCell className="text-right">
                                            <span className={
                                                item.receivedQty === item.quantity ? "text-green-600 font-medium" :
                                                    item.receivedQty > 0 ? "text-orange-600 font-medium" :
                                                        "text-muted-foreground"
                                            }>
                                                {item.receivedQty}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-primary">{Math.max(item.quantity - item.receivedQty, 0)}</TableCell>
                                        <TableCell className="text-right">${Number(item.unitPrice).toFixed(2)}</TableCell>
                                        <TableCell className="text-right font-medium">
                                            ${(item.quantity * Number(item.unitPrice)).toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {order.notes && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Notas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.notes}</p>
                    </CardContent>
                </Card>
            )}

            <Card className="shadow-md border-primary/10 overflow-hidden">
                <div className="h-1 bg-primary" />
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Documentos de la Orden
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Adjunta los documentos asociados a esta orden de compra (factura, notas de crédito/débito).
                    </p>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <DocumentUpload 
                            label="Factura" 
                            iconName="receipt"
                            currentUrl={order.invoiceUrl || null}
                            orderId={order.id}
                            docType="invoice"
                        />
                        <DocumentUpload 
                            label="Nota de Crédito" 
                            iconName="creditCard"
                            currentUrl={order.creditNoteUrl || null}
                            orderId={order.id}
                            docType="creditNote"
                        />
                        <DocumentUpload 
                            label="Nota de Débito" 
                            iconName="fileText"
                            currentUrl={order.debitNoteUrl || null}
                            orderId={order.id}
                            docType="debitNote"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
