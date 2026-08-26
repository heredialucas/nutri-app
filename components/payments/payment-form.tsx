"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createPayment, updatePayment } from "@/app/actions/payments";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { DollarSign, Save } from "lucide-react";

interface PaymentFormProps {
    patients: any[];
    payment?: any;
    onSuccess?: () => void;
}

export function PaymentForm({ patients, payment, onSuccess }: PaymentFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        patientId: payment?.patientId || "",
        amount: payment?.amount?.toString() || "",
        method: payment?.method || "EFECTIVO",
        description: payment?.description || "",
        date: payment?.date?.split("T")[0] || new Date().toISOString().split("T")[0],
        notes: payment?.notes || "",
    });

    const handleChange = (field: string, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = {
                patientId: form.patientId,
                amount: parseFloat(form.amount),
                method: form.method,
                description: form.description || undefined,
                date: form.date || undefined,
                notes: form.notes || undefined,
            };

            if (payment) {
                await updatePayment(payment.id, {
                    amount: data.amount,
                    method: data.method,
                    description: data.description,
                    date: data.date,
                    notes: data.notes,
                });
                toast.success("Cobro actualizado");
            } else {
                await createPayment(data);
                toast.success("Cobro registrado");
            }

            if (onSuccess) {
                onSuccess();
            } else {
                router.refresh();
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al guardar");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        {payment ? "Editar cobro" : "Nuevo cobro"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Paciente *</Label>
                            <select
                                value={form.patientId}
                                onChange={(e) => handleChange("patientId", e.target.value)}
                                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                                required
                            >
                                <option value="">Seleccionar paciente</option>
                                {patients.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.firstName} {p.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Monto *</Label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={form.amount}
                                onChange={(e) => handleChange("amount", e.target.value)}
                                placeholder="5000"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Método de pago *</Label>
                            <select
                                value={form.method}
                                onChange={(e) => handleChange("method", e.target.value)}
                                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                                required
                            >
                                <option value="EFECTIVO">Efectivo</option>
                                <option value="TRANSFERENCIA">Transferencia</option>
                                <option value="TARJETA_DEBITO">Tarjeta débito</option>
                                <option value="TARJETA_CREDITO">Tarjeta crédito</option>
                                <option value="MERCADOPAGO">MercadoPago</option>
                                <option value="OTRO">Otro</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Fecha</Label>
                            <Input
                                type="date"
                                value={form.date}
                                onChange={(e) => handleChange("date", e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Descripción</Label>
                        <Input
                            value={form.description}
                            onChange={(e) => handleChange("description", e.target.value)}
                            placeholder="Consulta inicial, control, etc."
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Notas</Label>
                        <Textarea
                            value={form.notes}
                            onChange={(e) => handleChange("notes", e.target.value)}
                            rows={2}
                            placeholder="Observaciones..."
                        />
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={loading}>
                            <Save className="mr-2 h-4 w-4" />
                            {loading ? "Guardando..." : payment ? "Actualizar" : "Registrar cobro"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}
