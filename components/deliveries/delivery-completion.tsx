"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { markAsDeliveredWithProof } from "@/app/actions/deliveries";

export function DeliveryCompletion({ deliveryId }: { deliveryId: string }) {
    const [photo, setPhoto] = useState<File | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!photo) {
            toast.error("Adjunta la foto firmada por la directora");
            return;
        }

        const formData = new FormData();
        formData.set("deliveryId", deliveryId);
        formData.set("photo", photo);

        startTransition(async () => {
            try {
                await markAsDeliveredWithProof(formData);
                toast.success("Entrega finalizada con comprobante");
                router.refresh();
            } catch (error: any) {
                toast.error(error.message || "No se pudo finalizar la entrega");
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900 dark:bg-amber-950/20">
            <div>
                <div className="flex items-center gap-2 font-semibold">
                    <Camera className="h-4 w-4 text-amber-700" />
                    Comprobante obligatorio
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                    Subí una foto clara de la firma de la directora o de la recepción de los materiales.
                </p>
            </div>
            <div className="space-y-2">
                <Label htmlFor="delivery-proof">Foto de recepción</Label>
                <input
                    id="delivery-proof"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    capture="environment"
                    disabled={isPending}
                    onChange={(event) => setPhoto(event.target.files?.[0] || null)}
                    className="block w-full rounded-md border bg-background px-3 py-2 text-sm file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-medium"
                />
                <p className="text-xs text-muted-foreground">JPG, PNG o WEBP. Máximo 8 MB.</p>
            </div>
            <Button type="submit" disabled={isPending || !photo} className="w-full sm:w-auto">
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PackageCheck className="mr-2 h-4 w-4" />}
                {isPending ? "Subiendo comprobante..." : "Finalizar entrega"}
            </Button>
        </form>
    );
}
