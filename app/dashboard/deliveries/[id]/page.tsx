import { notFound, redirect } from "next/navigation";
import { getDelivery, cancelDelivery } from "@/app/actions/deliveries";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, XCircle, Truck, Building2, Package, User, Calendar, FileText, UserCog, Camera } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { DeliveryCompletion } from "@/components/deliveries/delivery-completion";
import { DeliveryDisaffection } from "@/components/deliveries/delivery-disaffection";

export default async function DeliveryDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const delivery = await getDelivery(id);
    const user = await getCurrentUser();

    if (!delivery) {
        notFound();
    }

    if (!user) redirect("/login");

    async function handleCancel() {
        "use server";
        await cancelDelivery(id);
        redirect(`/dashboard/deliveries/${id}`);
    }

    const isDraft = delivery.status === "DRAFT";
    const isDelivered = delivery.status === "DELIVERED";
    const isCancelled = delivery.status === "CANCELLED";
    const canManage = hasPermission(user, "deliveries.manage");

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 self-start sm:self-center">
                    <Link href="/dashboard/deliveries">
                        <Button variant="ghost" size="icon" className="shrink-0">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xl sm:text-3xl font-bold tracking-tight truncate">{delivery.deliveryNumber}</h1>
                            <Badge
                                variant={isDelivered ? "outline" : isCancelled ? "destructive" : "default"}
                                className="text-sm px-2 py-0.5 shrink-0"
                            >
                                {delivery.status === "DELIVERED" ? "Entregado" :
                                    delivery.status === "CANCELLED" ? "Cancelado" :
                                    delivery.status === "CONFIRMED" ? "Confirmado" : "En Camino"}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm">
                            {format(new Date(delivery.createdAt), "PPP", { locale: es })}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2 flex-wrap sm:ml-auto">
                    {canManage && delivery.status !== "DELIVERED" && delivery.status !== "CANCELLED" && (
                        <>
                            <form action={handleCancel}>
                                <Button variant="outline" type="submit" className="w-full sm:w-auto">
                                    <XCircle className="mr-2 h-4 w-4" />
                                    <span className="sm:hidden">Cancelar</span>
                                    <span className="hidden sm:inline">Cancelar</span>
                                </Button>
                            </form>
                        </>
                    )}
                </div>
            </div>

            <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Ítems de la Entrega</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Mobile Cards */}
                        <div className="block md:hidden space-y-4">
                            {delivery.items.map((item) => (
                                <Card key={item.id}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <div className="font-medium">{item.product.name}</div>
                                                <div className="font-mono text-xs text-muted-foreground">{item.product.sku}</div>
                                            </div>
                                            <div className="text-right">
                                                 <div className="text-sm font-medium">Cant: {item.quantity - item.disaffectedQuantity}</div>
                                                 {item.disaffectedQuantity > 0 && (
                                                     <div className="text-xs text-amber-700">Desafectado: {item.disaffectedQuantity}</div>
                                                 )}
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
                                        <TableHead>SKU</TableHead>
                                        <TableHead className="text-right">Cantidad</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {delivery.items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.product.name}</TableCell>
                                            <TableCell className="font-mono text-xs text-muted-foreground">{item.product.sku}</TableCell>
                                             <TableCell className="text-right font-medium">
                                                 {item.quantity - item.disaffectedQuantity}
                                                 {item.disaffectedQuantity > 0 && (
                                                     <div className="text-xs font-normal text-amber-700">Desafectado: {item.disaffectedQuantity}</div>
                                                 )}
                                             </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {canManage && !isDelivered && !isCancelled && (
                    <DeliveryCompletion deliveryId={id} />
                )}

                {canManage && isDelivered && !delivery.disaffectionReviewed && (
                    <Card>
                        <CardContent className="pt-6">
                            <DeliveryDisaffection deliveryId={id} items={delivery.items} reviewed={delivery.disaffectionReviewed} />
                        </CardContent>
                    </Card>
                )}

                {isDelivered && delivery.deliveryProofUrl && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Camera className="h-4 w-4" /> Comprobante fotográfico
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative aspect-video overflow-hidden rounded-lg border bg-muted">
                                <Image
                                    src={delivery.deliveryProofUrl}
                                    alt="Comprobante fotográfico de la entrega"
                                    fill
                                    className="object-contain"
                                    sizes="(max-width: 768px) 100vw, 400px"
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-muted-foreground">Información del Envío</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="text-sm font-medium mb-1 flex items-center gap-2">
                                    <Building2 className="h-4 w-4" /> Destino (Escuela)
                                </div>
                                <div className="text-lg font-semibold">{delivery.institution.name}</div>
                                <div className="text-sm text-muted-foreground">{delivery.institution.code}</div>
                            </div>
                            <Separator />
                            <div>
                                <div className="text-sm font-medium mb-1 flex items-center gap-2">
                                    <Package className="h-4 w-4" /> Origen (Depósito)
                                </div>
                                <div className="text-base">{delivery.warehouse.name}</div>
                            </div>
                            {delivery.receivedBy && (
                                <>
                                    <Separator />
                                    <div>
                                        <div className="text-sm font-medium mb-1 flex items-center gap-2">
                                            <UserCog className="h-4 w-4" /> Responsable de la Entrega
                                        </div>
                                        <div className="text-base">{delivery.receivedBy}</div>
                                    </div>
                                </>
                            )}
                            {delivery.createdBy && (
                                <>
                                    <Separator />
                                    <div>
                                        <div className="text-sm font-medium mb-1 flex items-center gap-2">
                                            <User className="h-4 w-4" /> Creado por
                                        </div>
                                        <div className="text-base">{delivery.createdBy.username}</div>
                                    </div>
                                </>
                            )}
                            <Separator />
                            <div>
                                <div className="text-sm font-medium mb-1 flex items-center gap-2">
                                    <Calendar className="h-4 w-4" /> Fecha de Creación
                                </div>
                                <div className="text-base">{format(new Date(delivery.createdAt), "PPP 'a las' p", { locale: es })}</div>
                            </div>

                            {delivery.deliveryDate && (
                                <>
                                    <Separator />
                                    <div>
                                        <div className="text-sm font-medium mb-1 flex items-center gap-2">
                                            <Truck className="h-4 w-4" /> Fecha de Entrega
                                        </div>
                                        <div className="text-base">{format(new Date(delivery.deliveryDate), "PPP 'a las' p", { locale: es })}</div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {delivery.notes && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium text-muted-foreground">Notas</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm italic">{delivery.notes}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
