"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanDayCards, FoodField, DayCardDay } from "./plan-day-cards";
import { SupplementEditor, SupplementData } from "./supplement-editor";
import { PlanAIActions } from "./plan-ai-actions";
import { Pill, Plus, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { PlanChatDrawer } from "./plan-chat-drawer";
import type { GeneratedMealPlan } from "@/lib/ai/meal-plan-generator";
import { activityLevels, calculateCalorieTargets, goals } from "@/lib/calorie-calculator";
import { Calculator } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PatientPicker } from "./patient-picker";
import {
    createNutritionPlan,
    updateNutritionPlan,
} from "@/app/actions/nutrition-plans";

interface Patient {
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    documentNumber?: string | null;
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
                    equivalence: string | null;
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
    const [calculatorSex, setCalculatorSex] = useState<"masculino" | "femenino">("masculino");
    const [calculatorAge, setCalculatorAge] = useState(30);
    const [calculatorWeight, setCalculatorWeight] = useState(70);
    const [calculatorHeight, setCalculatorHeight] = useState(170);
    const [calculatorActivity, setCalculatorActivity] = useState("moderado");
    const [calculatorObjective, setCalculatorObjective] = useState("mantener");
    const [notes, setNotes] = useState(initialPlan?.notes || "");
    const [tips, setTips] = useState(initialPlan?.tips || "");
    const [days, setDays] = useState<DayCardDay[]>(
        initialPlan?.days?.map((d) => ({
            ...d,
            meals: d.meals.map((m) => ({
                ...m,
                notes: m.notes || "",
                foods: m.foods.map((f) => ({
                    ...f,
                    quantity: f.quantity || "",
                    unit: f.unit || "",
                    equivalence: f.equivalence || "",
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
    const [chatUndo, setChatUndo] = useState<{ previous: GeneratedMealPlan; keys: string[] } | null>(null);
    const calorieCalculation = calculateCalorieTargets({ sex: calculatorSex, age: calculatorAge, weight: calculatorWeight, height: calculatorHeight, activity: calculatorActivity, objective: calculatorObjective });

    const applyCalorieCalculation = () => {
        if (!calorieCalculation) return;
        setCalorieTarget(String(calorieCalculation.calories));
        setProteinTarget(String(calorieCalculation.proteinMax));
        setCarbTarget(String(calorieCalculation.carbsMax));
        setFatTarget(String(calorieCalculation.fatMax));
        toast.success("Objetivos calculados aplicados al plan");
    };

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

    const updateDayLabel = (index: number, label: string) => {
        setDays((prev) => prev.map((d, i) => (i === index ? { ...d, label } : d)));
    };

    const updateMealLabel = (index: number, mealIndex: number, label: string) => {
        setDays((prev) =>
            prev.map((d, i) =>
                i !== index
                    ? d
                    : {
                          ...d,
                          meals: d.meals.map((m, mi) =>
                              mi === mealIndex ? { ...m, label } : m
                          ),
                      }
            )
        );
    };

    const updateMealNotes = (index: number, mealIndex: number, notes: string) => {
        setDays((prev) =>
            prev.map((d, i) =>
                i !== index
                    ? d
                    : {
                          ...d,
                          meals: d.meals.map((m, mi) =>
                              mi === mealIndex ? { ...m, notes } : m
                          ),
                      }
            )
        );
    };

    const updateFood = (
        index: number,
        mealIndex: number,
        foodIndex: number,
        field: FoodField,
        value: string
    ) => {
        setDays((prev) =>
            prev.map((d, i) =>
                i !== index
                    ? d
                    : {
                          ...d,
                          meals: d.meals.map((m, mi) =>
                              mi !== mealIndex
                                  ? m
                                  : {
                                        ...m,
                                        foods: m.foods.map((f, fi) => {
                                            if (fi !== foodIndex) return f;
                                            const numeric = ["calories", "protein", "carbs", "fat"].includes(field);
                                            return {
                                                ...f,
                                                [field]: numeric
                                                    ? value === ""
                                                        ? undefined
                                                        : parseFloat(value) || 0
                                                    : value,
                                            };
                                        }),
                                    }
                          ),
                      }
            )
        );
    };

    const addMeal = (index: number) => {
        setDays((prev) =>
            prev.map((d, i) =>
                i !== index
                    ? d
                    : {
                          ...d,
                          meals: [
                              ...d.meals,
                              { label: "", mealOrder: d.meals.length + 1, foods: [] },
                          ],
                      }
            )
        );
    };

    const removeMeal = (index: number, mealIndex: number) => {
        setDays((prev) =>
            prev.map((d, i) =>
                i !== index
                    ? d
                    : { ...d, meals: d.meals.filter((_, mi) => mi !== mealIndex) }
            )
        );
    };

    const addFood = (index: number, mealIndex: number) => {
        setDays((prev) =>
            prev.map((d, i) =>
                i !== index
                    ? d
                    : {
                          ...d,
                          meals: d.meals.map((m, mi) =>
                              mi !== mealIndex
                                  ? m
                                  : {
                                        ...m,
                                        foods: [
                                            ...m.foods,
                                            {
                                                name: "",
                                                quantity: "",
                                                unit: "",
                                                equivalence: "",
                                                notes: "",
                                                calories: undefined,
                                                protein: undefined,
                                                carbs: undefined,
                                                fat: undefined,
                                            },
                                        ],
                                    }
                          ),
                      }
            )
        );
    };

    const removeFood = (index: number, mealIndex: number, foodIndex: number) => {
        setDays((prev) =>
            prev.map((d, i) =>
                i !== index
                    ? d
                    : {
                          ...d,
                          meals: d.meals.map((m, mi) =>
                              mi !== mealIndex
                                  ? m
                                  : {
                                        ...m,
                                        foods: m.foods.filter((_, fi) => fi !== foodIndex),
                                    }
                          ),
                      }
            )
        );
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
                                equivalence: String(f.equivalence ?? "").trim() || undefined,
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

    const planForChat = (): GeneratedMealPlan => ({
        title: title || "Plan sin título",
        description,
        calorieTarget: calorieTarget ? parseInt(calorieTarget) || 0 : 0,
        notes,
        tips: tips || undefined,
        dailyCalories: calorieTarget ? parseInt(calorieTarget) || 0 : undefined,
        dailyProtein: proteinTarget ? parseInt(proteinTarget) || 0 : undefined,
        dailyCarbs: carbTarget ? parseInt(carbTarget) || 0 : undefined,
        dailyFat: fatTarget ? parseInt(fatTarget) || 0 : undefined,
        supplements: supplements.map((s) => ({
            name: s.name,
            dosage: s.dosage || undefined,
            timing: s.timing || undefined,
            frequency: s.frequency || undefined,
            notes: s.notes || undefined,
        })),
        days: days.map((d) => ({
            dayOrder: d.dayOrder || 0,
            label: d.label,
            meals: d.meals.map((m) => ({
                label: m.label,
                mealOrder: m.mealOrder || 0,
                notes: m.notes || undefined,
                calories: m.calories ?? undefined,
                protein: m.protein ? Number(m.protein) : undefined,
                carbs: m.carbs ? Number(m.carbs) : undefined,
                fat: m.fat ? Number(m.fat) : undefined,
                foods: m.foods.map((f) => ({
                    name: f.name ?? "",
                    quantity: f.quantity ?? "",
                    unit: f.unit ?? "",
                    equivalence: f.equivalence ?? "",
                    notes: f.notes ?? "",
                    calories: f.calories ?? undefined,
                    protein: f.protein ? Number(f.protein) : undefined,
                    carbs: f.carbs ? Number(f.carbs) : undefined,
                    fat: f.fat ? Number(f.fat) : undefined,
                })),
            })),
        })),
    });

    const handlePlanChatChange = (
        plan: GeneratedMealPlan,
        previous: GeneratedMealPlan,
        changedFoodKeys: string[]
    ) => {
        setTitle(plan.title || "");
        setDescription(plan.description || "");
        setCalorieTarget(plan.calorieTarget ? String(plan.calorieTarget) : "");
        setProteinTarget(plan.dailyProtein ? String(plan.dailyProtein) : "");
        setCarbTarget(plan.dailyCarbs ? String(plan.dailyCarbs) : "");
        setFatTarget(plan.dailyFat ? String(plan.dailyFat) : "");
        setNotes(plan.notes || "");
        setTips(plan.tips || "");
        setSupplements((plan.supplements || []).map((s) => ({
            name: s.name,
            dosage: s.dosage || "",
            timing: s.timing || "",
            frequency: s.frequency || "",
            notes: s.notes || "",
        })));
        setDays(
            (plan.days || []).map((d) => ({
                dayOrder: d.dayOrder,
                label: d.label,
                meals: (d.meals || []).map((m) => ({
                    label: m.label,
                    mealOrder: m.mealOrder,
                    notes: m.notes || "",
                    calories: m.calories,
                    protein: m.protein,
                    carbs: m.carbs,
                    fat: m.fat,
                    foods: (m.foods || []).map((f) => ({
                        name: f.name,
                        quantity: f.quantity ?? "",
                        unit: f.unit ?? "",
                        equivalence: f.equivalence ?? "",
                        notes: f.notes ?? "",
                        calories: f.calories,
                        protein: f.protein,
                        carbs: f.carbs,
                        fat: f.fat,
                    })),
                })),
            }))
        );
        setChatUndo({ previous, keys: changedFoodKeys });
    };

    const undoChatFood = (dayIndex: number, mealIndex: number, foodIndex: number) => {
        if (!chatUndo) return;
        const key = `${dayIndex}:${mealIndex}:${foodIndex}`;
        const previousMeal = chatUndo.previous.days[dayIndex]?.meals[mealIndex];
        if (!previousMeal) return;

        setDays((currentDays) => currentDays.map((day, di) =>
            di !== dayIndex
                ? day
                : {
                    ...day,
                    meals: day.meals.map((meal, mi) =>
                        mi !== mealIndex
                            ? meal
                            : {
                                ...meal,
                                calories: previousMeal.calories,
                                protein: previousMeal.protein,
                                carbs: previousMeal.carbs,
                                fat: previousMeal.fat,
                                foods: previousMeal.foods.map((food) => ({ ...food })),
                            }
                    ),
                }
        ));
        setChatUndo((current) => current
            ? { ...current, keys: current.keys.filter((item) => item !== key) }
            : null
        );
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
                        <PatientPicker patients={patients} selectedIds={patientIds} onChange={setPatientIds} label="Pacientes asignados" />
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

                    <Card className="border-emerald-200 bg-emerald-50/40">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Calculator className="h-4 w-4 text-emerald-700" />
                                Calculador de calorías y macronutrientes
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                                Herramienta orientativa para definir manualmente los objetivos del plan. Revisá los resultados antes de aplicarlos.
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                <div className="space-y-2"><Label>Sexo</Label><Select value={calculatorSex} onValueChange={(value) => setCalculatorSex(value as "masculino" | "femenino")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="masculino">Masculino</SelectItem><SelectItem value="femenino">Femenino</SelectItem></SelectContent></Select></div>
                                <div className="space-y-2"><Label>Edad (años)</Label><Input type="number" min="1" value={calculatorAge} onChange={(e) => setCalculatorAge(Number(e.target.value) || 0)} /></div>
                                <div className="space-y-2"><Label>Peso (kg)</Label><Input type="number" min="1" step="0.1" value={calculatorWeight} onChange={(e) => setCalculatorWeight(Number(e.target.value) || 0)} /></div>
                                <div className="space-y-2"><Label>Altura (cm)</Label><Input type="number" min="1" step="0.1" value={calculatorHeight} onChange={(e) => setCalculatorHeight(Number(e.target.value) || 0)} /></div>
                                <div className="space-y-2"><Label>Actividad</Label><Select value={calculatorActivity} onValueChange={setCalculatorActivity}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{activityLevels.map((activity) => <SelectItem key={activity.value} value={activity.value}>{activity.label}</SelectItem>)}</SelectContent></Select></div>
                                <div className="space-y-2"><Label>Objetivo</Label><Select value={calculatorObjective} onValueChange={setCalculatorObjective}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{goals.map((goal) => <SelectItem key={goal.value} value={goal.value}>{goal.label}</SelectItem>)}</SelectContent></Select></div>
                            </div>
                            {calorieCalculation ? (
                                <div className="flex flex-col gap-3 rounded-xl border bg-background p-4 sm:flex-row sm:items-end sm:justify-between">
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4"><div><p className="text-xs text-muted-foreground">Meta calórica</p><p className="text-xl font-semibold text-emerald-700">{calorieCalculation.calories} kcal</p></div><div><p className="text-xs text-muted-foreground">Proteínas</p><p className="font-semibold">{calorieCalculation.proteinMin}–{calorieCalculation.proteinMax} g</p></div><div><p className="text-xs text-muted-foreground">Carbohidratos</p><p className="font-semibold">{calorieCalculation.carbsMin}–{calorieCalculation.carbsMax} g</p></div><div><p className="text-xs text-muted-foreground">Grasas</p><p className="font-semibold">{calorieCalculation.fatMin}–{calorieCalculation.fatMax} g</p></div></div>
                                    <Button type="button" onClick={applyCalorieCalculation}>Aplicar al plan</Button>
                                </div>
                            ) : <p className="text-sm text-muted-foreground">Completá valores válidos para calcular los objetivos.</p>}
                        </CardContent>
                    </Card>

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

            <PlanDayCards
                days={days}
                mode="edit"
                onDayLabelChange={updateDayLabel}
                onRemoveDay={removeDay}
                onMealLabelChange={updateMealLabel}
                onMealNotesChange={updateMealNotes}
                onAddMeal={addMeal}
                onRemoveMeal={removeMeal}
                onFoodChange={updateFood}
                onAddFood={addFood}
                onRemoveFood={removeFood}
                changedFoodKeys={chatUndo?.keys}
                onUndoFood={undoChatFood}
            />
            <Button type="button" variant="outline" className="w-full border-dashed" onClick={addDay}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar día
            </Button>

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

            {isEditing && (
                <PlanAIActions
                    plan={{
                        title,
                        days: days.map((d) => ({
                            label: d.label || "Día",
                            meals: d.meals.map((m) => ({
                                label: m.label || "Comida",
                                foods: m.foods.map((f) => ({
                                    name: f.name ?? "",
                                    quantity: f.quantity ?? "",
                                    unit: f.unit ?? "",
                                })),
                            })),
                        })),
                    }}
                    patientId={patientIds[0]}
                    planId={isEditing ? initialPlan.id : undefined}
                />
            )}

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
                <Button variant="outline" onClick={() => handleSubmit("DRAFT")} disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar borrador
                </Button>
                <Button onClick={() => handleSubmit("ACTIVE")} disabled={saving}>
                    Publicar plan
                </Button>
            </div>

            <PlanChatDrawer
                plan={planForChat()}
                onPlanChange={handlePlanChatChange}
                originalOptions={undefined}
                patientId={patientIds[0]}
            />
        </div>
    );
}
