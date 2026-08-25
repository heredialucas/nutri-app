"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { addGoal, deleteGoal, updateGoal } from "@/app/actions/medical-history";
import { useRouter } from "next/navigation";
import { Trash2, Plus, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Goal {
    id: string;
    type: string;
    description?: string | null;
    targetValue?: string | null;
    targetDate?: string | null;
    status: string;
}

export function GoalList({
    patientId,
    goals,
}: {
    patientId: string;
    goals: Goal[];
}) {
    const router = useRouter();
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ type: "", description: "", targetValue: "", targetDate: "" });

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addGoal(patientId, {
                type: form.type,
                description: form.description || undefined,
                targetValue: form.targetValue || undefined,
                targetDate: form.targetDate || undefined,
            });
            toast.success("Objetivo agregado");
            setForm({ type: "", description: "", targetValue: "", targetDate: "" });
            setShowForm(false);
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error");
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = async (id: string) => {
        try {
            await updateGoal(id, { status: "COMPLETED" });
            toast.success("Objetivo completado");
            router.refresh();
        } catch {
            toast.error("Error");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar este objetivo?")) return;
        try {
            await deleteGoal(id);
            toast.success("Objetivo eliminado");
            router.refresh();
        } catch {
            toast.error("Error al eliminar");
        }
    };

    const typeLabels: Record<string, string> = {
        WEIGHT_LOSS: "Pérdida de peso",
        WEIGHT_GAIN: "Aumento de peso",
        MUSCLE_GAIN: "Ganancia muscular",
        HEALTH_IMPROVEMENT: "Mejora de salud",
        HABIT_CHANGE: "Cambio de hábito",
        OTHER: "Otro",
    };

    return (
        <div className="space-y-3">
            {goals.length > 0 && (
                <div className="space-y-2">
                    {goals.map((g) => (
                        <div key={g.id} className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{typeLabels[g.type] || g.type}</span>
                                    <Badge variant={g.status === "COMPLETED" ? "default" : "secondary"}>
                                        {g.status === "COMPLETED" ? "Completado" : "Activo"}
                                    </Badge>
                                </div>
                                {g.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5">{g.description}</p>
                                )}
                                {g.targetValue && (
                                    <p className="text-xs text-muted-foreground">Meta: {g.targetValue}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                {g.status !== "COMPLETED" && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleComplete(g.id)}
                                        className="h-8 w-8 text-muted-foreground hover:text-emerald-600"
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(g.id)}
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showForm ? (
                <form onSubmit={handleAdd} className="space-y-3 p-4 border rounded-lg">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label>Tipo *</Label>
                            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="WEIGHT_LOSS">Pérdida de peso</SelectItem>
                                    <SelectItem value="WEIGHT_GAIN">Aumento de peso</SelectItem>
                                    <SelectItem value="MUSCLE_GAIN">Ganancia muscular</SelectItem>
                                    <SelectItem value="HEALTH_IMPROVEMENT">Mejora de salud</SelectItem>
                                    <SelectItem value="HABIT_CHANGE">Cambio de hábito</SelectItem>
                                    <SelectItem value="OTHER">Otro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>Fecha objetivo</Label>
                            <Input
                                type="date"
                                value={form.targetDate}
                                onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label>Descripción</Label>
                        <Textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            rows={2}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit" size="sm" disabled={loading}>
                            {loading ? "Agregando..." : "Agregar"}
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(false)}>
                            Cancelar
                        </Button>
                    </div>
                </form>
            ) : (
                <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar objetivo
                </Button>
            )}
        </div>
    );
}
