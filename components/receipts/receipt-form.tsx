"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Loader2, ArrowLeft, Image as ImageIcon, Plus, Package, X, FileText } from "lucide-react";
import { toast } from "sonner";
import { createReceipt, updateReceipt } from "@/app/actions/receipts";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ImageUpload } from "@/components/ui/image-upload";
import { useImageUpload } from "@/hooks/use-image-upload";
import { QuickProductDialog } from "@/components/inventory/quick-product-dialog";
import { QuickSupplierDialog } from "@/components/suppliers/quick-supplier-dialog";
import { QuickExpedienteDialog } from "@/components/expedientes/quick-expediente-dialog";
import { Separator } from "@/components/ui/separator";

interface ExistingReceiptData {
    imageUrl?: string | null;
    expedienteId?: string | null;
    purchaseOrderId?: string | null;
    supplierId?: string | null;
    warehouseId?: string | null;
    items?: Array<{ productId: string; name: string; sku: string; quantity: number; price: number }>;
}

interface ReceiptFormProps {
    purchaseOrders: any[];
    products: any[];
    warehouses: any[];
    categories: any[];
    expedientes: any[];
    suppliers: any[];
    userId: string;
    initialData?: any;
    existingReceiptNumbers?: Record<string, number>;
    existingReceiptsData?: Record<string, ExistingReceiptData>;
}

export function ReceiptForm({ purchaseOrders, products: initialProducts, warehouses, categories, expedientes: initialExpedientes, suppliers: initialSuppliers, userId, initialData, existingReceiptNumbers, existingReceiptsData }: ReceiptFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [allProducts, setAllProducts] = useState(initialProducts);
    const [allExpedientes, setAllExpedientes] = useState(initialExpedientes);
    const [allSuppliers, setAllSuppliers] = useState(initialSuppliers);
    const [receiptNumber, setReceiptNumber] = useState(initialData?.receiptNumber || "");
    const [warehouseId, setWarehouseId] = useState(initialData?.warehouseId || "");
    const [date, setDate] = useState(initialData?.date ? new Date(initialData.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]);
    const [purchaseOrderId, setPurchaseOrderId] = useState(initialData?.purchaseOrderId || "");
    const [expedienteId, setExpedienteId] = useState(initialData?.expedienteId || "");
    const [supplierId, setSupplierId] = useState(initialData?.supplierId || "");
    const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || "");
    const [base64Image, setBase64Image] = useState("");

    // Pre-select first warehouse
    useEffect(() => {
        if (warehouses && warehouses.length > 0 && !warehouseId) {
            setWarehouseId(warehouses[0].id);
        }
    }, [warehouses, warehouseId]);

    // State for items
    const [selectedProductId, setSelectedProductId] = useState<string>("");
    const [items, setItems] = useState<Array<{ productId: string, name: string, sku: string, quantity: number, price: number }>>(
        initialData?.items?.map((i: any) => ({
            productId: i.productId,
            name: i.product?.name || "",
            sku: i.product?.sku || "",
            quantity: i.quantity,
            price: i.unitPrice ? Number(i.unitPrice) : (i.product?.price ? Number(i.product.price) : 0)
        })) || []
    );

    const { upload, isUploading: isUploadingImage } = useImageUpload({
        preset: 'patientDocuments',
        onSuccess: (url) => setImageUrl(url),
        onError: (err) => toast.error(err)
    });


    const handleProductCreated = (newProduct: any) => {
        // Update products list
        setAllProducts(prev => [...prev, newProduct]);

        // Add to current receipt items automatically
        setItems(prev => [...prev, {
            productId: newProduct.id,
            name: newProduct.name,
            sku: newProduct.sku,
            quantity: 1,
            price: Number(newProduct.price) || 0
        }]);

        toast.success(`${newProduct.name} creado e incorporado al remito`);
    };

    const handleSupplierCreated = (newSupplier: any) => {
        setAllSuppliers(prev => [...prev, newSupplier]);
        setSupplierId(newSupplier.id);
    };

    const handleExpedienteCreated = (newExpediente: any) => {
        setAllExpedientes(prev => [...prev, newExpediente]);
        setExpedienteId(newExpediente.id);
    };

    const removeItem = (productId: string) => {
        setItems(prev => prev.filter(i => i.productId !== productId));
    };

    const updateItemQty = (productId: string, qty: number) => {
        setItems(prev => prev.map(i => i.productId === productId ? { ...i, quantity: qty } : i));
    };

    const updateItemPrice = (productId: string, price: number) => {
        setItems(prev => prev.map(i => i.productId === productId ? { ...i, price } : i));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!receiptNumber || !date || !warehouseId) {
            toast.error("Número de remito, fecha y depósito son obligatorios");
            return;
        }

        if (items.length === 0) {
            toast.error("Agrega al menos un producto");
            return;
        }

        startTransition(async () => {
            try {
                let finalImageUrl = imageUrl;

                if (base64Image && !imageUrl) {
                    const uploadResult = await upload(base64Image);
                    if (uploadResult.success) {
                        finalImageUrl = uploadResult.url!;
                    } else {
                        return;
                    }
                }

                if (initialData) {
                    await updateReceipt(initialData.id, {
                        receiptNumber,
                        date: new Date(date),
                        imageUrl: finalImageUrl,
                        warehouseId,
                        purchaseOrderId: purchaseOrderId && purchaseOrderId !== "none" ? purchaseOrderId : undefined,
                        expedienteId: expedienteId && expedienteId !== "none" ? expedienteId : undefined,
                        supplierId: supplierId && supplierId !== "none" ? supplierId : undefined,
                        userId,
                        items: items.map(i => ({
                            productId: i.productId,
                            quantity: i.quantity,
                            unitPrice: i.price
                        }))
                    });
                    toast.success("Remito actualizado correctamente");
                } else {
                    await createReceipt({
                        purchaseOrderId: purchaseOrderId && purchaseOrderId !== "none" ? purchaseOrderId : undefined,
                        warehouseId,
                        receiptNumber,
                        date: new Date(date),
                        imageUrl: finalImageUrl,
                        userId,
                        expedienteId: expedienteId && expedienteId !== "none" ? expedienteId : undefined,
                        supplierId: supplierId && supplierId !== "none" ? supplierId : undefined,
                        items: items.map(i => ({
                            productId: i.productId,
                            quantity: i.quantity,
                            unitPrice: i.price
                        }))
                    });
                    toast.success("Ingreso registrado correctamente");
                }
                router.push("/dashboard/inventory");
                router.refresh();
            } catch (error: any) {
                toast.error(error.message || "Error al procesar el ingreso");
            }
        });
    };

    // Derive existing group items from props (no state needed)
    const groupItems = (() => {
        if (!existingReceiptsData || !receiptNumber) return [];
        const data = existingReceiptsData[receiptNumber];
        if (!data?.items) return [];
        if (initialData) {
            const currentIds = new Set(items.map(i => i.productId));
            return data.items.filter(i => !currentIds.has(i.productId));
        }
        return data.items;
    })();

    return (
        <form onSubmit={handleSubmit} className="max-w-[1200px] mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/inventory">
                        <Button variant="ghost" size="icon" type="button" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{initialData ? "Editar Remito" : "Nuevo Ingreso"}</h1>
                        <p className="text-muted-foreground">{initialData ? `Editando remito ${initialData.receiptNumber}` : "Carga de mercadería y remito al depósito"}</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Columna Izquierda: Datos y Productos */}
                <div className="lg:col-span-2 space-y-8">
                    {/* 1. Datos del Remito */}
                    <Card className="shadow-md border-primary/10 overflow-hidden">
                        <div className="h-1 bg-primary" />
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                Datos del Comprobante
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6 sm:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="receiptNumber">Número de Remito *</Label>
                                <Input
                                    id="receiptNumber"
                                    value={receiptNumber}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setReceiptNumber(value);
                                        if (initialData) return;
                                        const data = existingReceiptsData?.[value];
                                        if (data) {
                                            if (data.imageUrl) setImageUrl(data.imageUrl);
                                            if (data.expedienteId) setExpedienteId(data.expedienteId);
                                            if (data.purchaseOrderId) setPurchaseOrderId(data.purchaseOrderId);
                                            if (data.supplierId) setSupplierId(data.supplierId);
                                            if (data.warehouseId) setWarehouseId(data.warehouseId);
                                        } else {
                                            setImageUrl("");
                                            setBase64Image("");
                                            setExpedienteId("");
                                            setPurchaseOrderId("");
                                            setSupplierId("");
                                            setWarehouseId("");
                                        }
                                    }}
                                    placeholder="0001-00001234"
                                    className="font-mono"
                                    list="existing-receipts"
                                />
                                <datalist id="existing-receipts">
                                    {existingReceiptNumbers && Object.keys(existingReceiptNumbers).map((num) => (
                                        <option key={num} value={num} />
                                    ))}
                                </datalist>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Si usás un número de remito ya existente, todos los ingresos se agruparán automáticamente bajo ese mismo remito.
                                </p>
                                {existingReceiptNumbers?.[receiptNumber] && !initialData && (
                                    <p className="text-xs text-amber-600 font-medium mt-1">
                                        Este número ya tiene {existingReceiptNumbers[receiptNumber]} ingreso(s). Se vinculará a ese remito existente.
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="date">Fecha *</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="warehouse">Depósito Destino *</Label>
                                <Select value={warehouseId} onValueChange={setWarehouseId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {warehouses.map((w) => (
                                            <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-md border-primary/10">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Package className="h-5 w-5 text-primary" />
                                Mercadería a Ingresar
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col sm:flex-row gap-3 bg-muted/40 p-4 rounded-lg border">
                                <div className="flex-1">
                                    <Select
                                        value={selectedProductId}
                                        onValueChange={(val) => {
                                            if (val && val !== "placeholder") {
                                                const product = allProducts.find(p => p.id === val);
                                                if (product) {
                                                    if (items.find(i => i.productId === val)) {
                                                        toast.error("Este producto ya está en la lista");
                                                    } else {
                                                        setItems(prev => [...prev, {
                                                            productId: product.id,
                                                            name: product.name,
                                                            sku: product.sku,
                                                            quantity: 1,
                                                            price: Number(product.price) || 0
                                                        }]);
                                                    }
                                                }
                                                setSelectedProductId(""); // Reset for next selection
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="bg-background h-12 text-base">
                                            <SelectValue placeholder="Buscar y agregar producto..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allProducts.length === 0 ? (
                                                <SelectItem value="placeholder" disabled>No hay productos cargados</SelectItem>
                                            ) : (
                                                allProducts.map((p) => (
                                                    <SelectItem key={p.id} value={p.id}>
                                                        <div className="flex flex-col w-full">
                                                            <div className="flex items-center justify-between">
                                                                <span className={p.isDeleted ? "text-muted-foreground line-through" : ""}>
                                                                    {p.name} - {p.sku}
                                                                </span>
                                                                {p.isDeleted && (
                                                                    <span className="ml-2 text-xs text-orange-600 bg-orange-50 px-1 rounded">
                                                                        inactivo
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                                <span>Stock: {p.stock}</span>
                                                                <span>${Number(p.price).toFixed(2)}</span>
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <QuickProductDialog
                                    categories={categories}
                                    onProductCreated={handleProductCreated}
                                />
                            </div>

                            <div className="rounded-xl border overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted/80">
                                        <TableRow>
                                            <TableHead className="font-bold">Producto</TableHead>
                                             <TableHead className="w-[180px] text-center font-bold">Cantidad</TableHead>
                                             <TableHead className="w-[180px] text-center font-bold">Precio Unit.</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {groupItems.length > 0 && (
                                            <>
                                                <TableRow className="bg-muted/30">
                                                    <TableCell colSpan={4} className="text-xs font-semibold text-muted-foreground py-2">
                                                        Productos ya ingresados en este remito
                                                    </TableCell>
                                                </TableRow>
                                                {groupItems.map((item) => (
                                                    <TableRow key={`existing-${item.productId}`} className="bg-muted/20 opacity-70">
                                                        <TableCell>
                                                            <div className="font-semibold">{item.name}</div>
                                                            <div className="text-xs text-muted-foreground font-mono">{item.sku}</div>
                                                        </TableCell>
                                                        <TableCell className="text-center text-muted-foreground">
                                                            {item.quantity}
                                                        </TableCell>
                                                        <TableCell className="text-center text-muted-foreground">
                                                            ${item.price.toFixed(2)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="text-[10px] text-muted-foreground bg-background px-1.5 py-0.5 rounded uppercase tracking-wide">ya ingresado</span>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </>
                                        )}
                                        {items.length > 0 && groupItems.length > 0 && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-xs font-semibold text-muted-foreground py-2">
                                                    Nuevos productos a ingresar
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {items.map(item => (
                                            <TableRow key={item.productId} className="hover:bg-muted/20">
                                                    <TableCell>
                                                        <div className="font-semibold text-primary">{item.name}</div>
                                                        <div className="text-xs text-muted-foreground font-mono">{item.sku}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            value={item.quantity}
                                                            onChange={(e) => updateItemQty(item.productId, parseInt(e.target.value) || 0)}
                                                            className="text-right font-bold"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={item.price}
                                                            onChange={(e) => updateItemPrice(item.productId, parseFloat(e.target.value) || 0)}
                                                            className="text-right"
                                                            placeholder="0.00"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeItem(item.productId)}
                                                            className="text-destructive hover:bg-destructive/10"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        }
                                        {items.length === 0 && groupItems.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-16 text-muted-foreground">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Package className="h-10 w-10 opacity-20" />
                                                        <p>La lista está vacía</p>
                                                        <p className="text-xs">Usa el buscador superior para agregar productos</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Columna Derecha: Foto y Acción */}
                <div className="space-y-8">
                    {/* 3. Foto */}
                    <Card className="shadow-md border-primary/10">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <ImageIcon className="h-5 w-5 text-primary" />
                                Foto del Remito
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ImageUpload
                                value={base64Image || imageUrl}
                                onChange={(base64) => setBase64Image(base64)}
                                onRemove={() => {
                                    setBase64Image("");
                                    setImageUrl("");
                                }}
                                className="w-full aspect-square md:aspect-auto"
                            />
                            <p className="text-xs text-muted-foreground mt-3 text-center italic">
                                Sube una foto clara del remito para respaldo legal.
                            </p>
                        </CardContent>
                    </Card>

                    {/* 4. Vínculos Opcionales */}
                    <Card className="shadow-md border-primary/10">
                        <CardHeader>
                            <CardTitle className="text-xl">Vínculos Opcionales</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="purchaseOrder">Vincular Orden de Compra</Label>
                                <Select value={purchaseOrderId} onValueChange={setPurchaseOrderId}>
                                    <SelectTrigger className="bg-background">
                                        <SelectValue placeholder="Seleccionar OC..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No vincular</SelectItem>
                                        {purchaseOrders.map((o) => (
                                            <SelectItem key={o.id} value={o.id}>
                                                {o.orderNumber} ({o.supplier.name})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="expediente">Vincular Expediente</Label>
                                    <QuickExpedienteDialog onExpedienteCreated={handleExpedienteCreated} />
                                </div>
                                <Select value={expedienteId} onValueChange={setExpedienteId}>
                                    <SelectTrigger className="bg-background">
                                        <SelectValue placeholder="Seleccionar expediente..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No vincular</SelectItem>
                                        {allExpedientes.map((e: any) => (
                                            <SelectItem key={e.id} value={e.id}>
                                                {e.number} ({e.year})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="supplier">Proveedor</Label>
                                    <QuickSupplierDialog onSupplierCreated={handleSupplierCreated} />
                                </div>
                                <Select value={supplierId} onValueChange={setSupplierId}>
                                    <SelectTrigger className="bg-background">
                                        <SelectValue placeholder="Seleccionar proveedor..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No vincular</SelectItem>
                                        {allSuppliers.map((s: any) => (
                                            <SelectItem key={s.id} value={s.id}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        size="lg"
                        className="w-full h-20 text-xl font-black shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        disabled={isPending || isUploadingImage || items.length === 0}
                    >
                        {isPending || isUploadingImage ? (
                            <div className="flex flex-col items-center">
                                <Loader2 className="h-6 w-6 animate-spin mb-1" />
                                <span className="text-xs font-normal">
                                    {isUploadingImage ? "Subiendo Imagen..." : "Procesando Stock..."}
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Save className="h-6 w-6" />
                                {initialData ? "ACTUALIZAR REMITO" : "GUARDAR INGRESO"}
                            </div>
                        )}
                    </Button>
                </div>
            </div>
        </form>
    );
}
