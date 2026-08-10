"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { disaffectDeliveryItems, reviewDeliveryDisaffection } from "@/app/actions/deliveries";

type DisaffectionItem = {
    id: string;
    quantity: number;
    disaffectedQuantity: number;
    product: { name: string; sku: string };
};

export function DeliveryDisaffection({ deliveryId, items, reviewed }: { deliveryId: string; items: DisaffectionItem[]; reviewed: boolean }) {
    const [quantities, setQuantities] = useState<Record<string, string>>({});
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const availableItems = items.filter((item) => item.quantity - item.disaffectedQuantity > 0);

    if (reviewed) return null;

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const selectedItems = availableItems
            .map((item) => ({ itemId: item.id, quantity: Number(quantities[item.id] || 0) }))
            .filter((item) => item.quantity > 0);

        if (selectedItems.length === 0) {
            toast.error("Indica al menos una cantidad sobrante");
            return;
        }

        startTransition(async () => {
            try {
                await disaffectDeliveryItems(deliveryId, selectedItems);
                toast.success("Sobrantes desafectados y devueltos al depósito");
                router.refresh();
                setQuantities({});
            } catch (error: any) {
                toast.error(error.message || "No se pudieron desafectar los sobrantes");
            }
        });
    };

    const handleReview = () => {
        startTransition(async () => {
            try {
                await reviewDeliveryDisaffection(deliveryId);
                toast.success("Revisión de sobrantes confirmada");
                router.refresh();
            } catch (error: any) {
                toast.error(error.message || "No se pudo confirmar la revisión");
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <h3 className="flex items-center gap-2 font-semibold">
                    <RotateCcw className="h-4 w-4 text-primary" />
                    Desafectar sobrantes
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Al finalizar la obra, indicá qué cantidades no fueron utilizadas. Volverán al depósito de origen automáticamente.
                </p>
            </div>
            <div className="space-y-3">
                {availableItems.map((item) => {
                    const available = item.quantity - item.disaffectedQuantity;
                    return (
                        <div key={item.id} className="grid gap-2 sm:grid-cols-[1fr_130px] sm:items-end">
                            <div>
                                <Label htmlFor={`disaffected-${item.id}`}>{item.product.name}</Label>
                                <p className="text-xs text-muted-foreground">SKU {item.product.sku} · Disponible para desafectar: {available}</p>
                            </div>
                            <Input
                                id={`disaffected-${item.id}`}
                                type="number"
                                min={0}
                                max={available}
                                step={1}
                                value={quantities[item.id] || ""}
                                onChange={(event) => setQuantities((current) => ({ ...current, [item.id]: event.target.value }))}
                                disabled={isPending}
                                placeholder="Cantidad"
                            />
                        </div>
                    );
                })}
            </div>
            <div className="flex flex-wrap gap-2">
                {availableItems.length > 0 && (
                    <Button type="submit" variant="outline" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Registrar desafectación
                    </Button>
                )}
                <Button type="button" variant="secondary" disabled={isPending} onClick={handleReview}>
                    Confirmar revisión sin más sobrantes
                </Button>
            </div>
        </form>
    );
}
