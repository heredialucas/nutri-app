"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createExpense, updateExpense } from "@/app/actions/expenses";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Receipt, Save } from "lucide-react";

interface ExpenseFormProps {
    expense?: any;
    onSuccess?: () => void;
}

export function ExpenseForm({ expense, onSuccess }: ExpenseFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        category: expense?.category || "",
        description: expense?.description || "",
        amount: expense?.amount?.toString() || "",
        date: expense?.date?.split("T")[0] || new Date().toISOString().split("T")[0],
        notes: expense?.notes || "",
    });

    const handleChange = (field: string, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = {
                category: form.category,
                description: form.description,
                amount: parseFloat(form.amount),
                date: form.date || undefined,
                notes: form.notes || undefined,
            };

            if (expense) {
                await updateExpense(expense.id, data);
                toast.success("Gasto actualizado");
            } else {
                await createExpense(data);
                toast.success("Gasto registrado");
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
                        <Receipt className="h-4 w-4" />
                        {expense ? "Editar gasto" : "Nuevo gasto"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Categoría *</Label>
                            <select
                                value={form.category}
                                onChange={(e) => handleChange("category", e.target.value)}
                                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                                required
                            >
                                <option value="">Seleccionar categoría</option>
                                <option value="ALQUILER">Alquiler</option>
                                <option value="SERVICIOS">Servicios</option>
                                <option value="EQUIPAMIENTO">Equipamiento</option>
                                <option value="MATERIALES">Materiales</option>
                                <option value="MARKETING">Marketing</option>
                                <option value="CAPACITACION">Capacitación</option>
                                <option value="SEGURO">Seguro</option>
                                <option value="IMPUESTOS">Impuestos</option>
                                <option value="OTRO">Otro</option>
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
                                placeholder="10000"
                                required
                            />
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
                        <Label>Descripción *</Label>
                        <Input
                            value={form.description}
                            onChange={(e) => handleChange("description", e.target.value)}
                            placeholder="Alquiler del consultorio, etc."
                            required
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
                            {loading ? "Guardando..." : expense ? "Actualizar" : "Registrar gasto"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}
