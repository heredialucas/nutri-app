"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanDayEditor, DayData } from "./plan-day-editor";
import { SupplementEditor, SupplementData } from "./supplement-editor";
import { Pill, Plus, ArrowLeft, Save } from "lucide-react";
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
        proteinTarget: number | null;
        carbTarget: number | null;
        fatTarget: number | null;
        notes: string | null;
        tips: string | null;
        patientIds?: string[];
        supplements?: {
            id?: string;
            name: string;
            dosage?: string | null;
            timing?: string | null;
            frequency?: string | null;
            notes?: string | null;
        }[];
        days: {
            id?: string;
            dayOrder: number;
            label: string;
            meals: {
                id?: string;
                label: string;
                mealOrder: number;
                notes?: string | null;
                foods: {
                    id?: string;
                    name: string;
                    quantity: string | null;
                    unit: string | null;
                    notes: string | null;
                    calories?: number | null;
                    protein?: number | null;
                    carbs?: number | null;
                    fat?: number | null;
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
    const [patientIds, setPatientIds] = useState<string[]>(
        initialPlan?.patientIds || []
    );
    const [startDate, setStartDate] = useState(
        initialPlan?.startDate ? initialPlan.startDate.split("T")[0] : ""
    );
    const [endDate, setEndDate] = useState(
        initialPlan?.endDate ? initialPlan.endDate.split("T")[0] : ""
    );
    const [calorieTarget, setCalorieTarget] = useState(
        initialPlan?.calorieTarget?.toString() || ""
    );
    const [proteinTarget, setProteinTarget] = useState(
        initialPlan?.proteinTarget?.toString() || ""
    );
    const [carbTarget, setCarbTarget] = useState(
        initialPlan?.carbTarget?.toString() || ""
    );
    const [fatTarget, setFatTarget] = useState(
        initialPlan?.fatTarget?.toString() || ""
    );
    const [notes, setNotes] = useState(initialPlan?.notes || "");
    const [tips, setTips] = useState(initialPlan?.tips || "");
    const [days, setDays] = useState<DayData[]>(
        initialPlan?.days?.map((d) => ({
            ...d,
            meals: d.meals.map((m) => ({
                ...m,
                notes: m.notes || "",
                foods: m.foods.map((f) => ({
                    ...f,
                    quantity: f.quantity || "",
                    unit: f.unit || "",
                    notes: f.notes || "",
                    calories: f.calories ?? undefined,
                    protein: f.protein ? Number(f.protein) : undefined,
                    carbs: f.carbs ? Number(f.carbs) : undefined,
                    fat: f.fat ? Number(f.fat) : undefined,
                })),
            })),
        })) || []
    );
    const [supplements, setSupplements] = useState<SupplementData[]>(
        initialPlan?.supplements?.map((s) => ({
            ...s,
            dosage: s.dosage || "",
            timing: s.timing || "",
            frequency: s.frequency || "",
            notes: s.notes || "",
        })) || []
    );
    const [saving, setSaving] = useState(false);

    const updateSupplement = (index: number, supplement: SupplementData) => {
        const updated = [...supplements];
        updated[index] = supplement;
        setSupplements(updated);
    };

    const addSupplement = () => {
        setSupplements([
            ...supplements,
            { name: "", dosage: "", timing: "", frequency: "", notes: "" },
        ]);
    };

    const removeSupplement = (index: number) => {
        setSupplements(supplements.filter((_, i) => i !== index));
    };

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

    const togglePatient = (id: string) => {
        setPatientIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const handleSubmit = async (status?: string) => {
        if (!title.trim()) {
            toast.error("El título es obligatorio");
            return;
        }

        setSaving(true);
        try {
            const planData = {
                title: title.trim(),
                description: description.trim() || undefined,
                patientIds,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                calorieTarget: calorieTarget ? parseInt(calorieTarget) : undefined,
                proteinTarget: proteinTarget ? parseInt(proteinTarget) : undefined,
                carbTarget: carbTarget ? parseInt(carbTarget) : undefined,
                fatTarget: fatTarget ? parseInt(fatTarget) : undefined,
                notes: notes.trim() || undefined,
                tips: tips.trim() || undefined,
                supplements: supplements
                    .filter((s) => s.name.trim())
                    .map((s) => ({
                        name: s.name.trim(),
                        dosage: s.dosage.trim() || undefined,
                        timing: s.timing.trim() || undefined,
                        frequency: s.frequency.trim() || undefined,
                        notes: s.notes.trim() || undefined,
                    })),
                days: days.map((d, i) => ({
                    dayOrder: i + 1,
                    label: d.label || `Día ${i + 1}`,
                    meals: d.meals.map((m, mi) => ({
                        label: m.label || `Comida ${mi + 1}`,
                        mealOrder: mi + 1,
                        notes: (m.notes ?? "").trim() || undefined,
                        foods: m.foods
                            .filter((f) => f.name.trim())
                            .map((f) => ({
                                name: String(f.name ?? "").trim(),
                                quantity: String(f.quantity ?? "").trim() || undefined,
                                unit: String(f.unit ?? "").trim() || undefined,
                                notes: String(f.notes ?? "").trim() || undefined,
                                calories: (f.calories ?? 0) > 0 ? f.calories : undefined,
                                protein: (f.protein ?? 0) > 0 ? f.protein : undefined,
                                carbs: (f.carbs ?? 0) > 0 ? f.carbs : undefined,
                                fat: (f.fat ?? 0) > 0 ? f.fat : undefined,
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
                            <div className="flex items-center justify-between">
                                <Label>Pacientes asignados</Label>
                                <span className="text-xs text-muted-foreground">
                                    {patientIds.length > 0
                                        ? `${patientIds.length} seleccionado${patientIds.length > 1 ? "s" : ""}`
                                        : "Opcional — podrás asignarlo luego"}
                                </span>
                            </div>
                            <div className="rounded-md border border-input bg-background px-3 py-2 flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                                {patients.length === 0 ? (
                                    <span className="text-sm text-muted-foreground">
                                        No hay pacientes cargados
                                    </span>
                                ) : (
                                    patients.map((p) => {
                                        const active = patientIds.includes(p.id);
                                        return (
                                            <Badge
                                                key={p.id}
                                                variant={active ? "default" : "outline"}
                                                className={`cursor-pointer text-xs py-0.5 px-2 ${
                                                    active
                                                        ? "bg-green-600 text-white hover:bg-green-700"
                                                        : "hover:bg-green-50 hover:text-green-700"
                                                }`}
                                                onClick={() => togglePatient(p.id)}
                                            >
                                                {active && <span className="mr-1">✓</span>}
                                                {p.firstName} {p.lastName}
                                            </Badge>
                                        );
                                    })
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Un plan puede asignarse a uno o varios pacientes, o crearse sin asignar.
                            </p>
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

                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="protein">Proteína (g/día)</Label>
                            <Input
                                id="protein"
                                type="number"
                                placeholder="Ej: 120"
                                value={proteinTarget}
                                onChange={(e) => setProteinTarget(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="carbs">Carbohidratos (g/día)</Label>
                            <Input
                                id="carbs"
                                type="number"
                                placeholder="Ej: 250"
                                value={carbTarget}
                                onChange={(e) => setCarbTarget(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fat">Grasas (g/día)</Label>
                            <Input
                                id="fat"
                                type="number"
                                placeholder="Ej: 70"
                                value={fatTarget}
                                onChange={(e) => setFatTarget(e.target.value)}
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

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Pill className="h-4 w-4 text-purple-500" />
                        Suplementos
                    </CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={addSupplement}>
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar suplemento
                    </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                    {supplements.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                            <p>No hay suplementos cargados</p>
                            <Button type="button" variant="outline" size="sm" onClick={addSupplement} className="mt-2">
                                <Plus className="mr-2 h-4 w-4" />
                                Agregar primer suplemento
                            </Button>
                        </div>
                    ) : (
                        supplements.map((sup, index) => (
                            <SupplementEditor
                                key={index}
                                supplement={sup}
                                index={index}
                                onChange={updateSupplement}
                                onRemove={removeSupplement}
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
