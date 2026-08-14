"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, HandCoins, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createLoanAction } from "@/app/actions/loans";

type FormData = {
    warehouses: Array<{ id: string; name: string; code: string }>;
    products: Array<{ id: string; name: string; sku: string; unit: string }>;
    expedientes: Array<{ id: string; number: string }>;
    stock: Array<{ warehouseId: string; productId: string; quantity: number }>;
};

type LoanItem = { productId: string; quantity: number };

export function LoanForm({ data }: { data: FormData }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const [warehouseId, setWarehouseId] = useState("");
    const [items, setItems] = useState<LoanItem[]>([{ productId: "", quantity: 1 }]);

    const availableProducts = useMemo(() => {
        if (!warehouseId) return [];
        const available = new Set(data.stock.filter((item) => item.warehouseId === warehouseId && item.quantity > 0).map((item) => item.productId));
        return data.products.filter((product) => available.has(product.id));
    }, [data.products, data.stock, warehouseId]);

    const getAvailableStock = (productId: string) => {
        return data.stock.find((item) => item.warehouseId === warehouseId && item.productId === productId)?.quantity || 0;
    };

    const updateItem = (index: number, changes: Partial<LoanItem>) => {
        setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item));
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formElement = event.currentTarget;
        const form = new FormData(formElement);
        const validItems = items.filter((item) => item.productId);
        if (!warehouseId || validItems.length === 0) {
            toast.error("Selecciona un depósito y al menos un producto");
            return;
        }
        if (validItems.some((item) => item.quantity > getAvailableStock(item.productId))) {
            toast.error("Una cantidad supera el stock disponible");
            return;
        }

        form.set("warehouseId", warehouseId);
        form.set("items", JSON.stringify(validItems));
        startTransition(async () => {
            const result = await createLoanAction(form);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success("Préstamo registrado y stock descontado");
            formElement.reset();
            setWarehouseId("");
            setItems([{ productId: "", quantity: 1 }]);
            router.refresh();
        });
    };

    return (
        <Card className="border-primary/20 shadow-sm">
            <CardHeader className="border-b bg-primary/[0.04]">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <HandCoins className="h-5 w-5 text-primary" />
                    Registrar salida en préstamo
                </CardTitle>
                <p className="text-sm text-muted-foreground">La firma o comprobante fotográfico es obligatorio para confirmar el egreso.</p>
            </CardHeader>
            <CardContent className="pt-6">
                <form onSubmit={submit} className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="warehouseId">Depósito de origen *</Label>
                            <select id="warehouseId" value={warehouseId} onChange={(event) => { setWarehouseId(event.target.value); setItems([{ productId: "", quantity: 1 }]); }} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                <option value="">Seleccionar depósito</option>
                                {data.warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.code} - {warehouse.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="destination">Destino / obra *</Label>
                            <Input id="destination" name="destination" placeholder="Ej: Obra calle San Martín" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="responsibleName">Responsable que retira *</Label>
                            <Input id="responsibleName" name="responsibleName" placeholder="Nombre y apellido" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="responsibleDni">DNI del responsable *</Label>
                            <Input id="responsibleDni" name="responsibleDni" inputMode="numeric" placeholder="DNI" required />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                            <Label>Materiales retirados *</Label>
                            <Button type="button" variant="outline" size="sm" disabled={!warehouseId} onClick={() => setItems([...items, { productId: "", quantity: 1 }])}>
                                <Plus className="mr-1.5 h-4 w-4" /> Agregar producto
                            </Button>
                        </div>
                        <div className="space-y-3 rounded-lg border p-3">
                            {items.map((item, index) => {
                                const stock = getAvailableStock(item.productId);
                                return <div key={index} className="grid gap-3 sm:grid-cols-[1fr_140px_auto] sm:items-end">
                                    <div className="space-y-2">
                                        <Label htmlFor={`product-${index}`} className="text-xs text-muted-foreground">Producto</Label>
                                        <select id={`product-${index}`} value={item.productId} onChange={(event) => updateItem(index, { productId: event.target.value })} disabled={!warehouseId} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                            <option value="">{warehouseId ? "Seleccionar producto" : "Selecciona un depósito"}</option>
                                            {availableProducts.map((product) => <option key={product.id} value={product.id}>{product.sku} - {product.name}</option>)}
                                        </select>
                                        {item.productId && <p className="text-xs text-muted-foreground">Disponible: {stock} {data.products.find((product) => product.id === item.productId)?.unit}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor={`quantity-${index}`} className="text-xs text-muted-foreground">Cantidad</Label>
                                        <Input id={`quantity-${index}`} type="number" min="1" max={stock || undefined} value={item.quantity} onChange={(event) => updateItem(index, { quantity: Number(event.target.value) || 1 })} required />
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" aria-label="Quitar producto" disabled={items.length === 1} onClick={() => setItems(items.filter((_, itemIndex) => itemIndex !== index))}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>;
                            })}
                            {!warehouseId && <p className="py-3 text-center text-sm text-muted-foreground">Elegí un depósito para consultar su stock disponible.</p>}
                            {warehouseId && availableProducts.length === 0 && <p className="py-3 text-center text-sm text-muted-foreground">No hay productos con stock disponible en este depósito.</p>}
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="expedienteId">Expediente relacionado (opcional)</Label>
                            <select id="expedienteId" name="expedienteId" defaultValue="" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                <option value="">Sin expediente</option>
                                {data.expedientes.map((expediente) => <option key={expediente.id} value={expediente.id}>{expediente.number}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="proof">Foto del comprobante firmado *</Label>
                            <Input id="proof" name="proof" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" required />
                            <p className="flex items-center gap-1 text-xs text-muted-foreground"><Camera className="h-3.5 w-3.5" /> JPG, PNG o WEBP. Máximo 8 MB.</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="notes">Observaciones</Label>
                        <Textarea id="notes" name="notes" placeholder="Información adicional del egreso..." rows={3} />
                    </div>
                    <Button type="submit" disabled={isPending || !warehouseId} className="w-full sm:w-auto">
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <HandCoins className="mr-2 h-4 w-4" />}
                        {isPending ? "Registrando préstamo..." : "Confirmar préstamo"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
