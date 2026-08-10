"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PackageCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cancelDelivery } from "@/app/actions/deliveries";

interface DeliveryActionsProps {
    deliveryId: string;
    status: string;
    userId: string;
    variant?: "icon" | "button";
}

export function DeliveryActions({ deliveryId, status, userId, variant = "icon" }: DeliveryActionsProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleDeliver = () => {
        router.push(`/dashboard/deliveries/${deliveryId}`);
    };

    const handleCancel = () => {
        if (!confirm("¿Estás seguro de que quieres cancelar esta entrega?")) {
            return;
        }
        startTransition(async () => {
            try {
                await cancelDelivery(deliveryId);
                toast.success("Entrega cancelada");
                router.refresh();
            } catch (error: any) {
                toast.error(error.message || "Error al cancelar entrega");
            }
        });
    };

    if (variant === "button") {
        return (
            <div className="flex flex-wrap gap-2">
                {(status === "DRAFT" || status === "CONFIRMED") && (
                    <Button
                        onClick={handleDeliver}
                        disabled={isPending}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        <PackageCheck className="mr-2 h-4 w-4" />
                        Revisar y entregar
                    </Button>
                )}
                {status !== "DELIVERED" && status !== "CANCELLED" && (
                    <Button
                        variant="destructive"
                        onClick={handleCancel}
                        disabled={isPending}
                    >
                        <XCircle className="mr-2 h-4 w-4" />
                        Eliminar
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1">
            {(status === "DRAFT" || status === "CONFIRMED") && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeliver}
                    disabled={isPending}
                    title="Marcar como entregada"
                >
                    <PackageCheck className="h-4 w-4 text-blue-600" />
                </Button>
            )}
            {status !== "DELIVERED" && status !== "CANCELLED" && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isPending}
                    title="Cancelar entrega"
                >
                    <XCircle className="h-4 w-4 text-destructive" />
                </Button>
            )}
        </div>
    );
}
