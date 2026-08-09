"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, ChevronDown, ChevronRight, FileText, Image as ImageIcon, Loader2, Package, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/ui/image-upload";
import { useImageUpload } from "@/hooks/use-image-upload";
import { getReceivablePurchasesByExpediente } from "@/app/actions/purchases";
import { createAccumulatedReceipt } from "@/app/actions/receipts";

interface ReceiptIntakeFormProps {
    expedientes: any[];
}

interface ReceiptLine {
    purchaseOrderItemId: string;
    productId: string;
    productName: string;
    sku: string;
    orderedQty: number;
    receivedQty: number;
    pendingQty: number;
    unitPrice: number;
    incomingQty: number;
}

function getReceiptLineId(line: ReceiptLine & { id?: string }) {
    return line.purchaseOrderItemId || line.id || "";
}

export function ReceiptIntakeForm({ expedientes }: ReceiptIntakeFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [expedienteId, setExpedienteId] = useState("");
    const [expedienteSearch, setExpedienteSearch] = useState("");
    const [orders, setOrders] = useState<any[]>([]);
    const [selectedOrderId, setSelectedOrderId] = useState("");
    const [expandedOrderId, setExpandedOrderId] = useState("");
    const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(new Set());
    const [lines, setLines] = useState<ReceiptLine[]>([]);
    const [receiptNumber, setReceiptNumber] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [imageUrl, setImageUrl] = useState("");
    const [base64Image, setBase64Image] = useState("");

    const { upload, isUploading: isUploadingImage } = useImageUpload({
        preset: "receipts",
        onSuccess: url => setImageUrl(url),
        onError: error => toast.error(error),
    });

    const filteredExpedientes = useMemo(() => {
        const query = expedienteSearch.trim().toLowerCase();
        if (!query) return expedientes.slice(0, 30);
        return expedientes.filter(expediente => `${expediente.number} ${expediente.year || ""} ${expediente.description || ""}`.toLowerCase().includes(query)).slice(0, 30);
    }, [expedientes, expedienteSearch]);

    const supplierGroups = useMemo(() => {
        const grouped = new Map<string, any[]>();
        for (const order of orders) {
            const key = order.supplier.name;
            grouped.set(key, [...(grouped.get(key) || []), order]);
        }
        return [...grouped.entries()];
    }, [orders]);

    const selectedOrder = orders.find(order => order.id === selectedOrderId);
    const totalIncoming = lines.reduce((sum, line) => sum + line.incomingQty * line.unitPrice, 0);

    const loadExpediente = (id: string) => {
        setExpedienteId(id);
        setSelectedOrderId("");
        setLines([]);
        startTransition(async () => {
            try {
                const result = await getReceivablePurchasesByExpediente(id);
                setOrders(result);
                if (result.length === 0) toast.info("Este expediente no tiene productos pendientes de recepción");
            } catch (error: any) {
                toast.error(error.message || "No se pudieron cargar las compras pendientes");
            }
        });
    };

    const selectOrder = (order: any) => {
        setSelectedOrderId(order.id);
        setLines(order.items.map((item: any) => ({
            ...item,
            purchaseOrderItemId: item.purchaseOrderItemId || item.id,
            incomingQty: 0,
        })));
        setExpandedOrderId(previous => previous === order.id ? "" : order.id);
    };

    const updateIncoming = (id: string, value: number) => {
        setLines(previous => previous.map(line => getReceiptLineId(line) === id
            ? { ...line, incomingQty: Math.min(Math.max(value, 0), line.pendingQty) }
            : line));
    };

    const toggleSupplier = (supplierName: string) => {
        setExpandedSuppliers(previous => {
            const next = new Set(previous);
            if (next.has(supplierName)) next.delete(supplierName);
            else next.add(supplierName);
            return next;
        });
    };

    const handleReceiptNumberChange = (value: string) => {
        setReceiptNumber(value);
        const existingReceipt = selectedOrder?.receipts?.find((receipt: any) => receipt.receiptNumber === value);
        if (existingReceipt) {
            setDate(new Date(existingReceipt.date).toISOString().split("T")[0]);
            setImageUrl(existingReceipt.imageUrl || "");
            setBase64Image("");
        }
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        const selectedLines = lines.filter(line => line.incomingQty > 0);
        if (!expedienteId || !selectedOrder || !receiptNumber || !date) {
            toast.error("Selecciona expediente, orden e ingresa los datos del remito");
            return;
        }
        if (selectedLines.length === 0) {
            toast.error("Indica al menos un producto que haya llegado");
            return;
        }

        startTransition(async () => {
            try {
                let finalImageUrl = imageUrl;
                if (base64Image && !imageUrl) {
                    const result = await upload(base64Image);
                    if (!result.success || !result.url) return;
                    finalImageUrl = result.url;
                }

                await createAccumulatedReceipt({
                    purchaseOrderId: selectedOrder.id,
                    expedienteId,
                    receiptNumber,
                    date: new Date(date),
                    imageUrl: finalImageUrl || undefined,
                    items: selectedLines.map(line => ({
                        purchaseOrderItemId: getReceiptLineId(line),
                        productId: line.productId,
                        quantity: line.incomingQty,
                    })),
                });
                toast.success(`Ingreso del remito ${receiptNumber} registrado correctamente`);
                router.push("/dashboard/receipts");
                router.refresh();
            } catch (error: any) {
                toast.error(error.message || "No se pudo registrar el ingreso");
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="mx-auto max-w-[1200px] space-y-6 pb-20">
            <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                    <Link href="/dashboard/receipts"><Button variant="ghost" size="icon" type="button" className="shrink-0 rounded-full"><ArrowLeft className="h-5 w-5" /></Button></Link>
                    <div className="min-w-0">
                        <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">Nuevo ingreso</h1>
                        <p className="text-sm text-muted-foreground">Control de mercadería recibida contra una orden</p>
                    </div>
                </div>
                {selectedOrder && <div className="rounded-lg bg-primary/10 px-3 py-2 text-left text-sm sm:text-right"><p className="text-xs text-muted-foreground">Orden seleccionada</p><p className="font-bold text-primary">{selectedOrder.orderNumber}</p></div>}
            </div>

            <Card className="border-primary/10 shadow-sm">
                <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Search className="h-5 w-5 text-primary" />1. Buscar expediente</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <Input value={expedienteSearch} onChange={event => setExpedienteSearch(event.target.value)} placeholder="Buscar por número, año o descripción..." />
                    <Select value={expedienteId} onValueChange={loadExpediente}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar expediente abierto..." /></SelectTrigger>
                        <SelectContent>{filteredExpedientes.map(expediente => <SelectItem key={expediente.id} value={expediente.id}>{expediente.number} {expediente.year ? `(${expediente.year})` : ""} {expediente.description ? `· ${expediente.description}` : ""}</SelectItem>)}</SelectContent>
                    </Select>
                    {isPending && !selectedOrder && <p className="text-sm text-muted-foreground">Cargando compras pendientes...</p>}
                </CardContent>
            </Card>

            {expedienteId && <Card className="border-primary/10 shadow-sm">
                <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Package className="h-5 w-5 text-primary" />2. Seleccionar orden y proveedor</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    {supplierGroups.length === 0 && <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No hay productos pendientes de recepción en este expediente.</p>}
                    {supplierGroups.map(([supplierName, supplierOrders]) => {
                        const expanded = expandedSuppliers.has(supplierName);
                        return <div key={supplierName} className="overflow-hidden rounded-lg border">
                            <button type="button" onClick={() => toggleSupplier(supplierName)} className="flex w-full flex-wrap items-center gap-2 px-3 py-3 text-left hover:bg-muted/40 sm:px-4">
                                {expanded ? <ChevronDown className="h-4 w-4 shrink-0 text-primary" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                                <span className="min-w-0 flex-1 truncate font-semibold">{supplierName}</span>
                                <span className="text-xs text-muted-foreground">{supplierOrders.length} orden{supplierOrders.length === 1 ? "" : "es"}</span>
                            </button>
                            {expanded && <div className="space-y-3 border-t bg-muted/[0.08] p-3">
                                {supplierOrders.map((order: any) => <div key={order.id} className="space-y-3">
                                    <button type="button" onClick={() => selectOrder(order)} className={`flex w-full flex-col gap-1 rounded-lg border p-3 text-left transition-colors sm:flex-row sm:items-center sm:justify-between ${selectedOrderId === order.id ? "border-primary bg-primary/10" : "bg-background hover:border-primary/40"}`}><span className="flex items-center gap-2"><span>{expandedOrderId === order.id ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}</span><span><span className="font-semibold">{order.orderNumber}</span><span className="ml-2 text-xs text-muted-foreground">{order.items.length} productos pendientes</span></span></span><span className="text-xs text-muted-foreground">Depósito: {order.warehouse.name}</span></button>
                                    {expandedOrderId === order.id && selectedOrderId === order.id && <Card className="border-primary/20 bg-background shadow-sm">
                                    <CardHeader><CardTitle className="text-base">Control de recepción · {selectedOrder.orderNumber}</CardTitle><p className="text-sm text-muted-foreground">Ingresá solo las cantidades que efectivamente llegaron.</p></CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="hidden rounded-lg bg-muted/50 p-3 text-xs font-semibold text-muted-foreground sm:grid sm:grid-cols-[minmax(0,1fr)_80px_80px_90px_100px] sm:gap-3"><span>Producto</span><span>Pedido</span><span>Recibido</span><span>Pendiente</span><span>Nuevo</span></div>
                                        {lines.map((line, index) => { const lineId = getReceiptLineId(line); return <div key={`${lineId}-${index}`} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_80px_80px_90px_100px] sm:items-center sm:gap-3"><div className="min-w-0"><p className="truncate font-semibold">{line.productName}</p><p className="font-mono text-xs text-muted-foreground">{line.sku}</p><div className="mt-2 grid grid-cols-3 gap-2 text-xs sm:hidden"><span>Pedido: <b>{line.orderedQty}</b></span><span>Recibido: <b>{line.receivedQty}</b></span><span>Pendiente: <b className="text-primary">{line.pendingQty}</b></span></div></div><span className="hidden text-sm sm:block">{line.orderedQty}</span><span className="hidden text-sm sm:block">{line.receivedQty}</span><span className="hidden font-semibold text-primary sm:block">{line.pendingQty}</span><Input type="number" min="0" max={line.pendingQty} value={line.incomingQty} onChange={event => updateIncoming(lineId, Number(event.target.value) || 0)} className="w-full text-right font-bold" /></div>; })}
                                    </CardContent>
                                    <div className="grid gap-4 border-t p-3 sm:p-4 lg:grid-cols-2">
                                        <Card className="border-primary/10 shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileText className="h-5 w-5 text-primary" />Datos del remito</CardTitle></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label htmlFor="receipt-number">Número de remito *</Label><Input id="receipt-number" list="active-receipts" value={receiptNumber} onChange={event => handleReceiptNumberChange(event.target.value)} placeholder="0001-00001234" /><datalist id="active-receipts">{(selectedOrder.receipts || []).map((receipt: any) => <option key={receipt.id} value={receipt.receiptNumber}>{`Remito activo del ${new Date(receipt.date).toLocaleDateString("es-AR")}`}</option>)}</datalist>{selectedOrder.receipts?.length > 0 && <p className="text-xs text-muted-foreground">Podés elegir un remito activo existente para continuar su recepción.</p>}</div><div className="space-y-2"><Label>Fecha *</Label><Input type="date" value={date} onChange={event => setDate(event.target.value)} /></div><p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">Si este número ya existe para esta orden, se conservará la foto y se sumarán las nuevas cantidades al mismo remito.</p></CardContent></Card>
                                        <Card className="border-primary/10 shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><ImageIcon className="h-5 w-5 text-primary" />Comprobante</CardTitle></CardHeader><CardContent><ImageUpload value={base64Image || imageUrl} onChange={setBase64Image} onRemove={() => { setBase64Image(""); setImageUrl(""); }} className="w-full" /><p className="mt-3 text-center text-xs italic text-muted-foreground">La foto se conserva al continuar el mismo remito.</p></CardContent></Card>
                                    </div>
                                    <div className="flex flex-col gap-3 border-t p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4"><div className="text-sm"><span className="text-muted-foreground">Nuevo ingreso: </span><b className="text-primary">${totalIncoming.toFixed(2)}</b></div><Button type="submit" disabled={isPending || isUploadingImage || lines.every(line => line.incomingQty === 0)} className="h-12 w-full text-base font-black sm:w-auto">{isPending || isUploadingImage ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Check className="mr-2 h-5 w-5" />}Registrar ingreso</Button></div>
                                </Card>}
                                </div>)}
                            </div>}
                        </div>;
                    })}
                </CardContent>
            </Card>}

        </form>
    );
}
