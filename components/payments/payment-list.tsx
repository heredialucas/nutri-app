"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, DollarSign } from "lucide-react";
import { deletePayment } from "@/app/actions/payments";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { PaymentForm } from "./payment-form";

interface PaymentListProps {
    payments: any[];
    patients: any[];
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("es-AR", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
    }).format(amount);
}

function methodLabel(method: string) {
    const labels: Record<string, string> = {
        EFECTIVO: "Efectivo",
        TRANSFERENCIA: "Transferencia",
        TARJETA_DEBITO: "Débito",
        TARJETA_CREDITO: "Crédito",
        MERCADOPAGO: "MercadoPago",
        OTRO: "Otro",
    };
    return labels[method] || method;
}

function methodColor(method: string) {
    const colors: Record<string, string> = {
        EFECTIVO: "bg-green-100 text-green-800",
        TRANSFERENCIA: "bg-blue-100 text-blue-800",
        TARJETA_DEBITO: "bg-purple-100 text-purple-800",
        TARJETA_CREDITO: "bg-orange-100 text-orange-800",
        MERCADOPAGO: "bg-cyan-100 text-cyan-800",
    };
    return colors[method] || "bg-gray-100 text-gray-800";
}

export function PaymentList({ payments, patients }: PaymentListProps) {
    const router = useRouter();
    const [editingId, setEditingId] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar este cobro?")) return;
        try {
            await deletePayment(id);
            toast.success("Cobro eliminado");
            router.refresh();
        } catch (error) {
            toast.error("Error al eliminar");
        }
    };

    if (payments.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                    <DollarSign className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>No hay cobros registrados</p>
                </CardContent>
            </Card>
        );
    }

    const total = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {payments.length} cobro{payments.length !== 1 ? "s" : ""}
                </p>
                <p className="text-sm font-medium">
                    Total: {formatCurrency(total)}
                </p>
            </div>

            <div className="space-y-3">
                {payments.map((payment) => (
                    <div key={payment.id}>
                        {editingId === payment.id ? (
                            <PaymentForm
                                patients={patients}
                                payment={payment}
                                onSuccess={() => setEditingId(null)}
                            />
                        ) : (
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm truncate">
                                                    {payment.patient?.firstName} {payment.patient?.lastName}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {payment.description || "Sin descripción"} — {formatDate(payment.date)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Badge variant="outline" className="text-xs">
                                                {formatCurrency(payment.amount)}
                                            </Badge>
                                            <Badge className={`text-xs ${methodColor(payment.method)}`}>
                                                {methodLabel(payment.method)}
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setEditingId(payment.id)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(payment.id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
