"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Receipt } from "lucide-react";
import { deleteExpense } from "@/app/actions/expenses";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ExpenseForm } from "./expense-form";

interface ExpenseListProps {
    expenses: any[];
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

function categoryLabel(category: string) {
    const labels: Record<string, string> = {
        ALQUILER: "Alquiler",
        SERVICIOS: "Servicios",
        EQUIPAMIENTO: "Equipamiento",
        MATERIALES: "Materiales",
        MARKETING: "Marketing",
        CAPACITACION: "Capacitación",
        SEGURO: "Seguro",
        IMPUESTOS: "Impuestos",
        OTRO: "Otro",
    };
    return labels[category] || category;
}

function categoryColor(category: string) {
    const colors: Record<string, string> = {
        ALQUILER: "bg-blue-100 text-blue-800",
        SERVICIOS: "bg-yellow-100 text-yellow-800",
        EQUIPAMIENTO: "bg-purple-100 text-purple-800",
        MATERIALES: "bg-green-100 text-green-800",
        MARKETING: "bg-pink-100 text-pink-800",
        CAPACITACION: "bg-indigo-100 text-indigo-800",
        SEGURO: "bg-gray-100 text-gray-800",
        IMPUESTOS: "bg-red-100 text-red-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
}

export function ExpenseList({ expenses }: ExpenseListProps) {
    const router = useRouter();
    const [editingId, setEditingId] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar este gasto?")) return;
        try {
            await deleteExpense(id);
            toast.success("Gasto eliminado");
            router.refresh();
        } catch (error) {
            toast.error("Error al eliminar");
        }
    };

    if (expenses.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                    <Receipt className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>No hay gastos registrados</p>
                </CardContent>
            </Card>
        );
    }

    const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {expenses.length} gasto{expenses.length !== 1 ? "s" : ""}
                </p>
                <p className="text-sm font-medium">
                    Total: {formatCurrency(total)}
                </p>
            </div>

            <div className="space-y-3">
                {expenses.map((expense) => (
                    <div key={expense.id}>
                        {editingId === expense.id ? (
                            <ExpenseForm
                                expense={expense}
                                onSuccess={() => setEditingId(null)}
                            />
                        ) : (
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                                                <Receipt className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm truncate">
                                                    {expense.description}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDate(expense.date)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Badge variant="outline" className="text-xs">
                                                {formatCurrency(expense.amount)}
                                            </Badge>
                                            <Badge className={`text-xs ${categoryColor(expense.category)}`}>
                                                {categoryLabel(expense.category)}
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setEditingId(expense.id)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(expense.id)}
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
