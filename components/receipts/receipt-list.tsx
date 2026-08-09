"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
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
import { Card, CardContent } from "@/components/ui/card";
import { Search, Eye, Edit, Image as ImageIcon, Trash2, Loader2, FileText, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { deleteReceipt, completeReceipt } from "@/app/actions/receipts";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";

interface ReceiptListProps {
    receipts: any[];
    canManage: boolean;
}

interface ReceiptGroup {
    receiptNumber: string;
    receipts: any[];
    allCompleted: boolean;
    count: number;
    latestDate: Date;
    suppliers: string[];
    completedAt: Date | null;
}

export function ReceiptList({ receipts, canManage }: ReceiptListProps) {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isCompleting, setIsCompleting] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        try {
            setIsDeleting(id);
            await deleteReceipt(id);
            router.refresh();
        } catch (error) {
            console.error("Error deleting receipt:", error);
            alert("Error al eliminar el remito");
        } finally {
            setIsDeleting(null);
        }
    };

    const handleCompleteGroup = useCallback(async (receiptNumber: string, group: ReceiptGroup) => {
        try {
            setIsCompleting(receiptNumber);
            const activeReceipts = group.receipts.filter(r => r.status === "ACTIVE");
            await Promise.all(activeReceipts.map(r => completeReceipt(r.id)));
            router.refresh();
        } catch (error) {
            console.error("Error completing receipts:", error);
            alert("Error al marcar el remito como completado");
        } finally {
            setIsCompleting(null);
        }
    }, [router]);

    // Keep the same physical remito together without mixing equal numbers
    // from different orders or expedientes.
    const groups = receipts.reduce<Record<string, ReceiptGroup>>((acc, r) => {
        const key = [r.receiptNumber, r.purchaseOrderId || "direct", r.expedienteId || "none"].join("|");
        if (!acc[key]) {
            acc[key] = {
                receiptNumber: key,
                receipts: [],
                allCompleted: true,
                count: 0,
                latestDate: r.date,
                suppliers: [],
                completedAt: null,
            };
        }
        acc[key].receipts.push(r);
        acc[key].count++;
        if (r.status !== "COMPLETED") acc[key].allCompleted = false;
        if (r.status === "COMPLETED") {
            const completedAt = new Date(r.updatedAt);
            if (!acc[key].completedAt || completedAt > acc[key].completedAt!) {
                acc[key].completedAt = completedAt;
            }
        }
        if (new Date(r.date) > new Date(acc[key].latestDate)) acc[key].latestDate = r.date;
        const supplier = r.purchaseOrder?.supplier?.name || r.supplier?.name;
        if (supplier && !acc[key].suppliers.includes(supplier)) {
            acc[key].suppliers.push(supplier);
        }
        return acc;
    }, {});

    const filtered = Object.values(groups).filter(
        (g) =>
            g.receiptNumber.toLowerCase().includes(search.toLowerCase()) ||
            g.suppliers.some(s => s.toLowerCase().includes(search.toLowerCase()))
    );

    const sorted = filtered.sort((a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime());

    return (
        <div className="space-y-4">
            <div className="flex items-center relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar remitos..."
                    className="pl-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Remito</TableHead>
                            <TableHead>Ingresos</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Proveedor</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Llevar a Compras</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sorted.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    No se encontraron remitos
                                </TableCell>
                            </TableRow>
                        ) : (
                            sorted.map((group) => {
                                const firstId = group.receipts[0]?.id;
                                return (
                                    <TableRow key={group.receiptNumber}>
                                        <TableCell className="font-medium">
                                            <Link href={`/dashboard/receipts/${firstId}`} className="hover:underline">
                                                {group.receiptNumber}
                                            </Link>
                                            {group.receipts.some(r => r.imageUrl) && (
                                                <ImageIcon className="h-3 w-3 text-muted-foreground inline ml-1" />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{group.count} ingreso{group.count !== 1 ? "s" : ""}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={group.allCompleted ? "default" : "outline"}>
                                                {group.allCompleted ? "Completado" : "En Proceso"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{group.suppliers[0] || "N/A"}</TableCell>
                                        <TableCell>
                                            {format(new Date(group.latestDate), "dd/MM/yyyy", { locale: es })}
                                        </TableCell>
                                        <TableCell>
                                            {group.allCompleted && group.completedAt ? (() => {
                                                const deadline = new Date(group.completedAt!.getTime() + 3 * 24 * 60 * 60 * 1000);
                                                const days = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                                                if (days > 0) {
                                                    return <span className="text-emerald-600 font-medium">Faltan {days} día{days !== 1 ? "s" : ""}</span>;
                                                } else if (days === 0) {
                                                    return <span className="text-amber-600 font-medium">Vence hoy</span>;
                                                } else {
                                                    return <span className="text-destructive font-medium">Atrasado {-days} día{-days !== 1 ? "s" : ""}</span>;
                                                }
                                            })() : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {canManage && !group.allCompleted && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleCompleteGroup(group.receiptNumber, group)}
                                                        disabled={isCompleting === group.receiptNumber}
                                                        title="Marca este remito como completamente recibido. Todos los ingresos bajo este número se marcarán como completados."
                                                    >
                                                        {isCompleting === group.receiptNumber ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <CheckCircle2 className="h-4 w-4 mr-1" />
                                                        )}
                                                        Marcar Completado
                                                    </Button>
                                                )}
                                                <Link href={`/dashboard/receipts/${firstId}`}>
                                                    <Button variant="ghost" size="icon" title="Ver detalle">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                {canManage && (
                                                    <>
                                                        <Link href="/dashboard/receipts/new">
                                                            <Button variant="ghost" size="icon" title="Agregar ingreso al remito">
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </Link>

                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    title="Eliminar remito"
                                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                    disabled={isDeleting === firstId}
                                                                >
                                                                    {isDeleting === firstId ? (
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        <Trash2 className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Esta acción eliminará el remito y revertirá el stock ingresado.
                                                                        Si el remito está asociado a una Orden de Compra, el estado de la misma será actualizado.
                                                                        Esta acción no se puede deshacer.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => handleDelete(firstId!)}
                                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                    >
                                                                        Eliminar
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
                {sorted.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No se encontraron remitos</h3>
                            <p className="text-sm text-muted-foreground">
                                No hay remitos que mostrar
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    sorted.map((group) => {
                        const firstId = group.receipts[0]?.id;
                        return (
                            <Card key={group.receiptNumber}>
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-medium">{group.receiptNumber}</h4>
                                                {group.receipts.some(r => r.imageUrl) && (
                                                    <ImageIcon className="h-3 w-3 text-muted-foreground" />
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {format(new Date(group.latestDate), "dd/MM/yyyy", { locale: es })}
                                            </p>
                                        </div>
                                        <Badge variant={group.allCompleted ? "default" : "outline"}>
                                            {group.allCompleted ? "Completo" : "Abierto"}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                                        <div>
                                            <p className="text-muted-foreground">Ingresos</p>
                                            <p className="mt-1">{group.count}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Proveedor</p>
                                            <p className="mt-1">{group.suppliers[0] || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Llevar a Compras</p>
                                            <p className="mt-1">
                                                {group.allCompleted && group.completedAt ? (() => {
                                                    const deadline = new Date(group.completedAt!.getTime() + 3 * 24 * 60 * 60 * 1000);
                                                    const days = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                                                    if (days > 0) {
                                                        return <span className="text-emerald-600 font-medium">Faltan {days} día{days !== 1 ? "s" : ""}</span>;
                                                    } else if (days === 0) {
                                                        return <span className="text-amber-600 font-medium">Vence hoy</span>;
                                                    } else {
                                                        return <span className="text-destructive font-medium">Atrasado {-days} día{-days !== 1 ? "s" : ""}</span>;
                                                    }
                                                })() : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 pt-3 border-t">
                                        {canManage && !group.allCompleted && (
                                            <Button
                                                variant="default"
                                                size="sm"
                                                onClick={() => handleCompleteGroup(group.receiptNumber, group)}
                                                disabled={isCompleting === group.receiptNumber}
                                                title="Marca este remito como completamente recibido. Todos los ingresos bajo este número se marcarán como completados."
                                            >
                                                {isCompleting === group.receiptNumber ? (
                                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                                ) : (
                                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                                )}
                                                Marcar Completado
                                            </Button>
                                        )}
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/dashboard/receipts/${firstId}`}>
                                                <Eye className="h-4 w-4 mr-1" />
                                                Ver
                                            </Link>
                                        </Button>
                                        {canManage && (
                                            <>
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href="/dashboard/receipts/new">
                                                        <Edit className="h-4 w-4 mr-1" />
                                                        Agregar ingreso
                                                    </Link>
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            disabled={isDeleting === firstId}
                                                        >
                                                            {isDeleting === firstId ? (
                                                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="h-4 w-4 mr-1" />
                                                            )}
                                                            Eliminar
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Esta acción eliminará el remito y revertirá el stock ingresado.
                                                                Si el remito está asociado a una Orden de Compra, el estado de la misma será actualizado.
                                                                Esta acción no se puede deshacer.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDelete(firstId!)}
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            >
                                                                Eliminar
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
