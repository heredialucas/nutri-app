"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanDayEditor, DayData } from "./plan-day-editor";
import { Plus, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
    createNutritionPlan,
    updateNutritionPlan,
} from "@/app/actions/nutrition-plans";

interface Patient {
    id: string;
    firstName: string;
    lastName: string;
}

interface PlanFormProps {
    patients: Patient[];
    initialPlan?: {
        id: string;
        title: string;
        description: string | null;
        startDate: string | null;
        endDate: string | null;
        calorieTarget: number | null;
        notes: string | null;
        tips: string | null;
        patientId: string;
        days: {
            id?: string;
            dayOrder: number;
            label: string;
            meals: {
                id?: string;
                label: string;
                mealOrder: number;
                foods: {
                    id?: string;
                    name: string;
                    quantity: string | null;
                    unit: string | null;
                    notes: string | null;
                }[];
            }[];
        }[];
    };
}

export function PlanForm({ patients, initialPlan }: PlanFormProps) {
    const router = useRouter();
    const isEditing = !!initialPlan;

    const [title, setTitle] = useState(initialPlan?.title || "");
    const [description, setDescription] = useState(initialPlan?.description || "");
    const [patientId, setPatientId] = useState(initialPlan?.patientId || "");
    const [startDate, setStartDate] = useState(
        initialPlan?.startDate ? initialPlan.startDate.split("T")[0] : ""
    );
    const [endDate, setEndDate] = useState(
        initialPlan?.endDate ? initialPlan.endDate.split("T")[0] : ""
    );
    const [calorieTarget, setCalorieTarget] = useState(
        initialPlan?.calorieTarget?.toString() || ""
    );
    const [notes, setNotes] = useState(initialPlan?.notes || "");
    const [tips, setTips] = useState(initialPlan?.tips || "");
    const [days, setDays] = useState<DayData[]>(
        initialPlan?.days?.map((d) => ({
            ...d,
            meals: d.meals.map((m) => ({
                ...m,
                foods: m.foods.map((f) => ({
                    ...f,
                    quantity: f.quantity || "",
                    unit: f.unit || "",
                    notes: f.notes || "",
                })),
            })),
        })) || []
    );
    const [saving, setSaving] = useState(false);

    const updateDay = (index: number, day: DayData) => {
        const updated = [...days];
        updated[index] = day;
        setDays(updated);
    };

    const addDay = () => {
        setDays([
            ...days,
            {
                dayOrder: days.length + 1,
                label: `Día ${days.length + 1}`,
                meals: [],
            },
        ]);
    };

    const removeDay = (index: number) => {
        setDays(days.filter((_, i) => i !== index));
    };

    const handleSubmit = async (status?: string) => {
        if (!title.trim()) {
            toast.error("El título es obligatorio");
            return;
        }
        if (!patientId) {
            toast.error("Seleccioná un paciente");
            return;
        }

        setSaving(true);
        try {
            const planData = {
                title: title.trim(),
                description: description.trim() || undefined,
                patientId,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                calorieTarget: calorieTarget ? parseInt(calorieTarget) : undefined,
                notes: notes.trim() || undefined,
                tips: tips.trim() || undefined,
                days: days.map((d, i) => ({
                    dayOrder: i + 1,
                    label: d.label || `Día ${i + 1}`,
                    meals: d.meals.map((m, mi) => ({
                        label: m.label || `Comida ${mi + 1}`,
                        mealOrder: mi + 1,
                        foods: m.foods
                            .filter((f) => f.name.trim())
                            .map((f) => ({
                                name: f.name.trim(),
                                quantity: f.quantity.trim() || undefined,
                                unit: f.unit.trim() || undefined,
                                notes: f.notes.trim() || undefined,
                            })),
                    })),
                })),
            };

            if (isEditing) {
                await updateNutritionPlan(initialPlan.id, planData as any);
                if (status) {
                    await updateNutritionPlan(initialPlan.id, { status });
                }
                toast.success("Plan actualizado");
                router.push(`/dashboard/planes/${initialPlan.id}`);
            } else {
                const plan = await createNutritionPlan(planData as any);
                if (status) {
                    await updateNutritionPlan(plan.id, { status });
                }
                toast.success("Plan creado");
                router.push("/dashboard/planes");
            }
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al guardar");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={isEditing ? `/dashboard/planes/${initialPlan.id}` : "/dashboard/planes"}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {isEditing ? "Editar plan" : "Nuevo plan alimentario"}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        {isEditing ? "Modificá los datos del plan" : "Definí la estructura del plan para tu paciente"}
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Datos del plan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="title">Título *</Label>
                            <Input
                                id="title"
                                placeholder="Ej: Plan de alimentación - Enero 2026"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="patient">Paciente *</Label>
                            <select
                                id="patient"
                                value={patientId}
                                onChange={(e) => setPatientId(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="">Seleccionar paciente</option>
                                {patients.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.firstName} {p.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                            id="description"
                            placeholder="Descripción breve del plan..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="startDate">Fecha inicio</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endDate">Fecha fin</Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="calories">Meta calórica (kcal)</Label>
                            <Input
                                id="calories"
                                type="number"
                                placeholder="Ej: 2000"
                                value={calorieTarget}
                                onChange={(e) => setCalorieTarget(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notas privadas</Label>
                        <Textarea
                            id="notes"
                            placeholder="Notas internas sobre el plan..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tips">Tips de nutrición para el paciente</Label>
                        <Textarea
                            id="tips"
                            placeholder={"Escribí tips personalizados, uno por línea.\nEl paciente verá solo los tips de este plan."}
                            value={tips}
                            onChange={(e) => setTips(e.target.value)}
                            rows={4}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Estructura del plan</CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={addDay}>
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar día
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {days.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>No hay días agregados</p>
                            <Button type="button" variant="outline" size="sm" onClick={addDay} className="mt-2">
                                <Plus className="mr-2 h-4 w-4" />
                                Agregar primer día
                            </Button>
                        </div>
                    ) : (
                        days.map((day, index) => (
                            <PlanDayEditor
                                key={index}
                                day={day}
                                index={index}
                                onChange={updateDay}
                                onRemove={removeDay}
                            />
                        ))
                    )}
                </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-3">
                <Button variant="outline" onClick={() => handleSubmit("DRAFT")} disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar borrador
                </Button>
                <Button onClick={() => handleSubmit("ACTIVE")} disabled={saving}>
                    Publicar plan
                </Button>
            </div>
        </div>
    );
}
