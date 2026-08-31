"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    ChevronDown,
    ChevronUp,
    Plus,
    Trash2,
    UtensilsCrossed,
    Save,
    Sparkles,
    Clock,
    ChefHat,
    ShoppingCart,
    Loader2,
    Dumbbell,
    Pill,
    Flame,
    StickyNote,
    Lightbulb,
    Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
    createNutritionPlan,
    updateNutritionPlan,
} from "@/app/actions/nutrition-plans";
import { generateRecipesFromPlan } from "@/app/actions/ai-recipes";
import { generateShoppingListFromPlanAI } from "@/app/actions/ai-shopping-lists";
import { createRecipe, linkRecipesToPlan } from "@/app/actions/recipes";
import { createShoppingList } from "@/app/actions/shopping-lists";
import { usePlanDraftStore } from "@/stores/plan-draft-store";
import { PlanChatDrawer } from "@/components/nutrition-plans/plan-chat-drawer";
import type { GeneratedMealPlan } from "@/lib/ai/meal-plan-generator";

interface MacroChipProps {
    label: string;
    color: string;
    value: number;
    onChange: (v: number) => void;
}

function MacroChip({ label, color, value, onChange }: MacroChipProps) {
    return (
        <div className="flex items-center gap-1 rounded-lg bg-background border px-1.5 py-1">
            <span className={`text-[10px] font-medium uppercase ${color}`}>{label}</span>
            <Input
                type="number"
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value) || 0)}
                className="h-6 w-12 px-1 text-center text-xs font-semibold"
                min={0}
            />
            <span className="text-[10px] text-muted-foreground">g</span>
        </div>
    );
}

interface PlanEditorProps {
    plan: GeneratedMealPlan;
    patientIds?: string[];
    onBack: () => void;
}

export function PlanEditor({ plan: initialPlan, patientIds = [], onBack }: PlanEditorProps) {
    const router = useRouter();
    const [plan, setPlan] = useState(initialPlan);
    const [saving, setSaving] = useState(false);
    const [generatingRecipes, setGeneratingRecipes] = useState(false);
    const [generatingList, setGeneratingList] = useState(false);
    const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({
        0: true,
    });
    const [chatUndo, setChatUndo] = useState<{ previous: GeneratedMealPlan; keys: string[] } | null>(null);

    const { updatePlan: updateDraftPlan, clearPlan: clearDraftPlan, patientName, options: draftOptions, customPrompt: draftCustomPrompt } = usePlanDraftStore();

    const [generatedRecipeIds, setGeneratedRecipeIds] = useState<string[]>([]);
    const primaryPatientId: string | undefined = patientIds[0];

    const toggleDay = (index: number) => {
        setExpandedDays((prev) => ({ ...prev, [index]: !prev[index] }));
    };

    const updatePlanField = (field: keyof GeneratedMealPlan, value: any) => {
        setPlan((prev) => {
            const updated = { ...prev, [field]: value };
            updateDraftPlan(updated);
            return updated;
        });
    };

    const updateDayLabel = (dayIndex: number, label: string) => {
        const days = [...plan.days];
        days[dayIndex] = { ...days[dayIndex], label };
        setPlan((prev) => {
            const updated = { ...prev, days };
            updateDraftPlan(updated);
            return updated;
        });
    };

    const updateMealLabel = (dayIndex: number, mealIndex: number, label: string) => {
        const days = [...plan.days];
        const meals = [...days[dayIndex].meals];
        meals[mealIndex] = { ...meals[mealIndex], label };
        days[dayIndex] = { ...days[dayIndex], meals };
        setPlan((prev) => {
            const updated = { ...prev, days };
            updateDraftPlan(updated);
            return updated;
        });
    };

    const updateFood = (
        dayIndex: number,
        mealIndex: number,
        foodIndex: number,
        field: string,
        value: string
    ) => {
        const days = [...plan.days];
        const meals = [...days[dayIndex].meals];
        const foods = [...meals[mealIndex].foods];
        const numericFields = ["calories", "protein", "carbs", "fat"];
        const next =
            numericFields.includes(field) && value !== ""
                ? { ...foods[foodIndex], [field]: parseFloat(value) || 0 }
                : { ...foods[foodIndex], [field]: value };
        foods[foodIndex] = next;
        meals[mealIndex] = { ...meals[mealIndex], foods };
        days[dayIndex] = { ...days[dayIndex], meals };
        setPlan((prev) => {
            const updated = { ...prev, days };
            updateDraftPlan(updated);
            return updated;
        });
    };

    const updateMealNotes = (dayIndex: number, mealIndex: number, value: string) => {
        const days = [...plan.days];
        const meals = [...days[dayIndex].meals];
        meals[mealIndex] = { ...meals[mealIndex], notes: value };
        days[dayIndex] = { ...days[dayIndex], meals };
        setPlan((prev) => {
            const updated = { ...prev, days };
            updateDraftPlan(updated);
            return updated;
        });
    };

    const addFood = (dayIndex: number, mealIndex: number) => {
        const days = [...plan.days];
        const meals = [...days[dayIndex].meals];
        const foods = [
            ...meals[mealIndex].foods,
            { name: "", quantity: "", unit: "", notes: "", calories: 0, protein: 0, carbs: 0, fat: 0 },
        ];
        meals[mealIndex] = { ...meals[mealIndex], foods };
        days[dayIndex] = { ...days[dayIndex], meals };
        setPlan((prev) => {
            const updated = { ...prev, days };
            updateDraftPlan(updated);
            return updated;
        });
    };

    const removeFood = (dayIndex: number, mealIndex: number, foodIndex: number) => {
        const days = [...plan.days];
        const meals = [...days[dayIndex].meals];
        const foods = meals[mealIndex].foods.filter((_, i) => i !== foodIndex);
        meals[mealIndex] = { ...meals[mealIndex], foods };
        days[dayIndex] = { ...days[dayIndex], meals };
        setPlan((prev) => {
            const updated = { ...prev, days };
            updateDraftPlan(updated);
            return updated;
        });
    };

    const addMeal = (dayIndex: number) => {
        const days = [...plan.days];
        const meals = [
            ...days[dayIndex].meals,
            { label: "", mealOrder: days[dayIndex].meals.length + 1, foods: [] },
        ];
        days[dayIndex] = { ...days[dayIndex], meals };
        setPlan((prev) => {
            const updated = { ...prev, days };
            updateDraftPlan(updated);
            return updated;
        });
    };

    const removeMeal = (dayIndex: number, mealIndex: number) => {
        const days = [...plan.days];
        const meals = days[dayIndex].meals.filter((_, i) => i !== mealIndex);
        days[dayIndex] = { ...days[dayIndex], meals };
        setPlan((prev) => {
            const updated = { ...prev, days };
            updateDraftPlan(updated);
            return updated;
        });
    };

    const updateSupplement = (index: number, field: string, value: string) => {
        const supplements = [...(plan.supplements || [])];
        supplements[index] = { ...supplements[index], [field]: value };
        setPlan((prev) => {
            const updated = { ...prev, supplements };
            updateDraftPlan(updated);
            return updated;
        });
    };

    const addSupplement = () => {
        const supplements = [
            ...(plan.supplements || []),
            { name: "", dosage: "", timing: "", frequency: "", notes: "" },
        ];
        setPlan((prev) => {
            const updated = { ...prev, supplements };
            updateDraftPlan(updated);
            return updated;
        });
    };

    const removeSupplement = (index: number) => {
        const supplements = (plan.supplements || []).filter((_, i) => i !== index);
        setPlan((prev) => {
            const updated = { ...prev, supplements };
            updateDraftPlan(updated);
            return updated;
        });
    };

    const undoChatFood = (key: string) => {
        if (!chatUndo) return;
        const [dayIndex, mealIndex, foodIndex] = key.split(":").map(Number);
        const previousFood = chatUndo.previous.days[dayIndex]?.meals[mealIndex]?.foods[foodIndex];
        const days = plan.days.map((day, di) =>
            di !== dayIndex
                ? day
                : {
                    ...day,
                    meals: day.meals.map((meal, mi) =>
                        mi !== mealIndex
                            ? meal
                            : {
                                ...meal,
                                foods: meal.foods
                                    .map((food, fi) => fi === foodIndex ? previousFood : food)
                                    .filter((food) => food !== undefined),
                            }
                    ),
                }
        );
        const updated = { ...plan, days };
        setPlan(updated);
        updateDraftPlan(updated);
        setChatUndo((current) => current ? { ...current, keys: current.keys.filter((item) => item !== key) } : null);
    };

    const handleGenerateRecipes = async () => {
        setGeneratingRecipes(true);
        try {
            const result = await generateRecipesFromPlan(plan, primaryPatientId);
            const ids: string[] = [];
            for (const recipe of result.recipes) {
                const created = await createRecipe({
                    title: recipe.title,
                    description: recipe.description || undefined,
                    ingredients: recipe.ingredients || undefined,
                    instructions: recipe.instructions || undefined,
                });
                ids.push(created.id);
            }
            setGeneratedRecipeIds((prev) => [...prev, ...ids]);
            toast.success(`${result.recipes.length} receta${result.recipes.length !== 1 ? "s" : ""} creada${result.recipes.length !== 1 ? "s" : ""}. Se vincularán a tu plan al guardarlo.`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al generar recetas");
        } finally {
            setGeneratingRecipes(false);
        }
    };

    const handleGenerateShoppingList = async () => {
        setGeneratingList(true);
        try {
            const result = await generateShoppingListFromPlanAI(plan);
            await createShoppingList({
                title: result.title,
                patientId: primaryPatientId || undefined,
                items: result.items.map((item) => ({
                    name: item.name,
                    quantity: item.quantity || undefined,
                    unit: item.unit || undefined,
                })),
            });
            toast.success("Lista de compras creada. Podés verla en la sección de listas.");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al generar lista de compras");
        } finally {
            setGeneratingList(false);
        }
    };

    const handleSave = async (status?: string) => {
        setSaving(true);
        try {
            const planData = {
                patientIds,
                title: plan.title,
                description: plan.description || undefined,
                calorieTarget: plan.calorieTarget || undefined,
                proteinTarget: (plan.dailyProtein ?? 0) || undefined,
                carbTarget: (plan.dailyCarbs ?? 0) || undefined,
                fatTarget: (plan.dailyFat ?? 0) || undefined,
                notes: plan.notes || undefined,
                tips: plan.tips || undefined,
                supplements: (plan.supplements || [])
                    .filter((s) => s.name.trim())
                    .map((s) => ({
                        name: s.name.trim(),
                        dosage: (s.dosage ?? "").trim() || undefined,
                        timing: (s.timing ?? "").trim() || undefined,
                        frequency: (s.frequency ?? "").trim() || undefined,
                        notes: (s.notes ?? "").trim() || undefined,
                    })),
                days: plan.days.map((d, i) => ({
                    dayOrder: i + 1,
                    label: d.label,
                    meals: d.meals.map((m, mi) => ({
                        label: m.label,
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

            const created = await createNutritionPlan(planData as any);
            if (status) {
                await updateNutritionPlan(created.id, { status });
            }
            if (generatedRecipeIds.length > 0) {
                await linkRecipesToPlan(generatedRecipeIds, created.id);
                setGeneratedRecipeIds([]);
            }
            clearDraftPlan();
            toast.success("Plan guardado");
            router.push("/dashboard/planes");
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al guardar");
        } finally {
            setSaving(false);
        }
    };

    const dayColors = [
        "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
        "bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800",
        "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800",
        "bg-rose-50 border-rose-200 dark:bg-rose-950 dark:border-rose-800",
        "bg-violet-50 border-violet-200 dark:bg-violet-950 dark:border-violet-800",
        "bg-cyan-50 border-cyan-200 dark:bg-cyan-950 dark:border-cyan-800",
        "bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800",
    ];

    const chatOriginalOptions = (() => {
        if (!draftOptions) return undefined;
        const parts: string[] = [];
        if (draftOptions.calorieTarget) parts.push(`Calorías: ${draftOptions.calorieTarget} kcal`);
        if (draftOptions.mealsPerDay) parts.push(`Comidas por día: ${draftOptions.mealsPerDay}`);
        if (draftOptions.dietaryType?.length) parts.push(`Tipo de dieta: ${draftOptions.dietaryType.join(", ")}`);
        if (draftOptions.restrictions?.length) parts.push(`Restricciones: ${draftOptions.restrictions.join(", ")}`);
        if (draftOptions.includeFoods?.trim()) parts.push(`Incluir: ${draftOptions.includeFoods}`);
        if (draftOptions.excludeFoods?.trim()) parts.push(`Excluir: ${draftOptions.excludeFoods}`);
        if (draftOptions.proteinTarget) parts.push(`Proteína: ${draftOptions.proteinTarget}g`);
        if (draftOptions.carbTarget) parts.push(`Carbs: ${draftOptions.carbTarget}g`);
        if (draftOptions.fatTarget) parts.push(`Grasas: ${draftOptions.fatTarget}g`);
        let text = parts.join("\n");
        if (draftCustomPrompt?.trim()) {
            text = text
                ? `${text}\nInstrucción profesional: ${draftCustomPrompt.trim()}`
                : `Instrucción profesional: ${draftCustomPrompt.trim()}`;
        }
        return text || undefined;
    })();

    return (
        <div className="space-y-6">
            {/* Header editable */}
            <Card className="overflow-hidden">
                <CardContent className="pt-5 space-y-4">
                    {/* Título + generado */}
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <Input
                                value={plan.title}
                                onChange={(e) => updatePlanField("title", e.target.value)}
                                className="border-0 bg-transparent px-0 text-lg font-semibold focus-visible:ring-0"
                                placeholder="Título del plan"
                            />
                        </div>
                        <Badge variant="secondary" className="shrink-0">
                            <Sparkles className="mr-1 size-3" />
                            Generado con IA
                        </Badge>
                    </div>

                    <Textarea
                        value={plan.description}
                        onChange={(e) => updatePlanField("description", e.target.value)}
                        placeholder="Descripción del plan"
                        rows={2}
                        className="resize-none text-sm text-muted-foreground border-0 bg-transparent px-0 focus-visible:ring-0"
                    />

                    {/* Calorías + macros objetivo compactos */}
                    {(plan.calorieTarget > 0 ||
                        plan.dailyProtein !== undefined ||
                        plan.dailyCarbs !== undefined ||
                        plan.dailyFat !== undefined) && (
                        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/40 p-3">
                            {plan.calorieTarget > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <Flame className="size-4 text-orange-500 shrink-0" />
                                    <Input
                                        type="number"
                                        value={plan.calorieTarget}
                                        onChange={(e) =>
                                            updatePlanField("calorieTarget", parseInt(e.target.value) || 0)
                                        }
                                        className="h-8 w-20 text-center text-sm font-semibold"
                                        min={0}
                                    />
                                    <span className="text-xs text-muted-foreground">kcal</span>
                                    <Badge variant="outline" className="text-xs">
                                        Total diario:{" "}
                                        <span className="font-semibold">
                                            {plan.dailyCalories ?? plan.calorieTarget} kcal
                                        </span>
                                    </Badge>
                                </div>
                            )}

                            <div className="hidden sm:block h-5 w-px bg-border" />

                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Dumbbell className="size-3.5" />
                                    Macros diarios:
                                </span>
                                <MacroChip
                                    label="Proteína"
                                    color="text-rose-600 dark:text-rose-400"
                                    value={plan.dailyProtein ?? 0}
                                    onChange={(v) => updatePlanField("dailyProtein", v)}
                                />
                                <MacroChip
                                    label="Carbs"
                                    color="text-sky-600 dark:text-sky-400"
                                    value={plan.dailyCarbs ?? 0}
                                    onChange={(v) => updatePlanField("dailyCarbs", v)}
                                />
                                <MacroChip
                                    label="Grasas"
                                    color="text-amber-600 dark:text-amber-400"
                                    value={plan.dailyFat ?? 0}
                                    onChange={(v) => updatePlanField("dailyFat", v)}
                                />
                            </div>
                        </div>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                                <StickyNote className="size-3" />
                                Notas (solo profesional)
                            </span>
                            <Textarea
                                value={plan.notes}
                                onChange={(e) => updatePlanField("notes", e.target.value)}
                                rows={2}
                                className="resize-none text-xs leading-relaxed"
                                placeholder="Notas privadas de decisiones clínicas..."
                            />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                                <Lightbulb className="size-3" />
                                Tips para el paciente
                            </span>
                            <Textarea
                                value={plan.tips ?? ""}
                                onChange={(e) => updatePlanField("tips", e.target.value)}
                                rows={2}
                                className="resize-none text-xs leading-relaxed"
                                placeholder={"Uno por línea. El paciente verá solo los tips de su plan."}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Días */}
            <div className="space-y-3">
                {plan.days.map((day, dayIndex) => {
                    const isExpanded = expandedDays[dayIndex] ?? false;
                    return (
                        <Card key={dayIndex} className={dayColors[dayIndex % 7]}>
                            <CardHeader
                                className="cursor-pointer py-3"
                                onClick={() => toggleDay(dayIndex)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-7"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleDay(dayIndex);
                                            }}
                                        >
                                            {isExpanded ? (
                                                <ChevronUp className="size-4" />
                                            ) : (
                                                <ChevronDown className="size-4" />
                                            )}
                                        </Button>
                                        <Input
                                            value={day.label}
                                            onChange={(e) => updateDayLabel(dayIndex, e.target.value)}
                                            className="w-auto min-w-[200px] font-semibold bg-transparent border-transparent hover:border-input focus:border-input"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs">
                                            <Clock className="mr-1 size-3" />
                                            {day.meals.length} comidas
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>

                            {isExpanded && (
                                <CardContent className="pt-0 space-y-3">
                                    <Separator />
                                    {day.meals.map((meal, mealIndex) => (
                                        <div key={mealIndex} className="rounded-lg bg-background/80 border p-3 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <UtensilsCrossed className="size-4 text-muted-foreground shrink-0" />
                                                <Input
                                                    value={meal.label}
                                                    onChange={(e) =>
                                                        updateMealLabel(dayIndex, mealIndex, e.target.value)
                                                    }
                                                    className="font-medium text-sm bg-transparent border-transparent hover:border-input focus:border-input"
                                                    placeholder="Nombre de la comida"
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-7 text-muted-foreground hover:text-destructive shrink-0"
                                                    onClick={() => removeMeal(dayIndex, mealIndex)}
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </div>

                                            {(meal.calories !== undefined ||
                                                meal.protein !== undefined ||
                                                meal.carbs !== undefined ||
                                                meal.fat !== undefined) && (
                                                <div className="flex flex-wrap gap-1.5 text-[11px] pl-6">
                                                    {meal.calories !== undefined && (
                                                        <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{meal.calories} kcal</span>
                                                    )}
                                                    {meal.protein !== undefined && (
                                                        <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300">P {meal.protein}g</span>
                                                    )}
                                                    {meal.carbs !== undefined && (
                                                        <span className="px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300">HC {meal.carbs}g</span>
                                                    )}
                                                    {meal.fat !== undefined && (
                                                        <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">G {meal.fat}g</span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Comentario/indicación de la comida */}
                                            <div className="pl-6">
                                                <Textarea
                                                    value={meal.notes ?? ""}
                                                    onChange={(e) => updateMealNotes(dayIndex, mealIndex, e.target.value)}
                                                    placeholder="Comentario de esta comida (ej: Elegí una infusión para acompañar esta comida)"
                                                    rows={1}
                                                    className="h-8 min-h-0 text-xs resize-none text-muted-foreground bg-transparent"
                                                />
                                            </div>

                                            <div className="pl-6 space-y-1">
                                                {meal.foods.map((food, foodIndex) => (
                                                    <div
                                                        key={foodIndex}
                                                        className="flex items-center gap-1.5"
                                                    >
                                                        <span className="text-muted-foreground text-xs">•</span>
                                                        <Input
                                                            value={food.name}
                                                            onChange={(e) =>
                                                                updateFood(
                                                                    dayIndex,
                                                                    mealIndex,
                                                                    foodIndex,
                                                                    "name",
                                                                    e.target.value
                                                                )
                                                            }
                                                            placeholder="Alimento"
                                                            className="flex-1 h-8 text-sm bg-transparent border-transparent hover:border-input focus:border-input"
                                                        />
                                                        <Input
                                                            value={food.quantity}
                                                            onChange={(e) =>
                                                                updateFood(
                                                                    dayIndex,
                                                                    mealIndex,
                                                                    foodIndex,
                                                                    "quantity",
                                                                    e.target.value
                                                                )
                                                            }
                                                            placeholder="Cant."
                                                            className="w-16 h-8 text-sm text-center bg-transparent border-transparent hover:border-input focus:border-input"
                                                        />
                                                        <Input
                                                            value={food.unit}
                                                            onChange={(e) =>
                                                                updateFood(
                                                                    dayIndex,
                                                                    mealIndex,
                                                                    foodIndex,
                                                                    "unit",
                                                                    e.target.value
                                                                )
                                                            }
                                                            placeholder="Unidad"
                                                            className="w-16 h-8 text-sm bg-transparent border-transparent hover:border-input focus:border-input"
                                                        />
                                                        <Input
                                                            value={food.notes}
                                                            onChange={(e) =>
                                                                updateFood(
                                                                    dayIndex,
                                                                    mealIndex,
                                                                    foodIndex,
                                                                    "notes",
                                                                    e.target.value
                                                                )
                                                            }
                                                            placeholder="Notas"
                                                            className="w-24 h-8 text-sm bg-transparent border-transparent hover:border-input focus:border-input"
                                                        />
                                                        <Input
                                                            type="number"
                                                            value={food.calories ?? ""}
                                                            onChange={(e) =>
                                                                updateFood(
                                                                    dayIndex,
                                                                    mealIndex,
                                                                    foodIndex,
                                                                    "calories",
                                                                    e.target.value
                                                                )
                                                            }
                                                            placeholder="kcal"
                                                            className="w-16 h-8 text-sm text-center bg-transparent border-transparent hover:border-input focus:border-input text-muted-foreground"
                                                            title="Calorías"
                                                        />
                                                        <Input
                                                            type="number"
                                                            value={food.protein ?? ""}
                                                            onChange={(e) =>
                                                                updateFood(
                                                                    dayIndex,
                                                                    mealIndex,
                                                                    foodIndex,
                                                                    "protein",
                                                                    e.target.value
                                                                )
                                                            }
                                                            placeholder="P(g)"
                                                            className="w-14 h-8 text-sm text-center bg-transparent border-transparent hover:border-input focus:border-input text-rose-600/70 dark:text-rose-400/70"
                                                            title="Proteína (g)"
                                                        />
                                                        <Input
                                                            type="number"
                                                            value={food.carbs ?? ""}
                                                            onChange={(e) =>
                                                                updateFood(
                                                                    dayIndex,
                                                                    mealIndex,
                                                                    foodIndex,
                                                                    "carbs",
                                                                    e.target.value
                                                                )
                                                            }
                                                            placeholder="HC(g)"
                                                            className="w-14 h-8 text-sm text-center bg-transparent border-transparent hover:border-input focus:border-input text-sky-600/70 dark:text-sky-400/70"
                                                            title="Carbohidratos (g)"
                                                        />
                                                        <Input
                                                            type="number"
                                                            value={food.fat ?? ""}
                                                            onChange={(e) =>
                                                                updateFood(
                                                                    dayIndex,
                                                                    mealIndex,
                                                                    foodIndex,
                                                                    "fat",
                                                                    e.target.value
                                                                )
                                                            }
                                                            placeholder="G(g)"
                                                            className="w-14 h-8 text-sm text-center bg-transparent border-transparent hover:border-input focus:border-input text-amber-600/70 dark:text-amber-400/70"
                                                            title="Grasas (g)"
                                                        />
                                                         <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-7 text-muted-foreground hover:text-destructive shrink-0"
                                                            onClick={() =>
                                                                removeFood(dayIndex, mealIndex, foodIndex)
                                                            }
                                                        >
                                                            <Trash2 className="size-3" />
                                                         </Button>
                                                         {chatUndo?.keys.includes(`${dayIndex}:${mealIndex}:${foodIndex}`) && (
                                                             <Button
                                                                 variant="ghost"
                                                                 size="icon"
                                                                 className="size-7 text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950 shrink-0"
                                                                 onClick={() => undoChatFood(`${dayIndex}:${mealIndex}:${foodIndex}`)}
                                                                 title="Deshacer cambio de la IA"
                                                             >
                                                                 <Undo2 className="size-3" />
                                                                 <span className="sr-only">Deshacer cambio</span>
                                                             </Button>
                                                         )}
                                                    </div>
                                                ))}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full h-7 text-xs text-muted-foreground"
                                                    onClick={() => addFood(dayIndex, mealIndex)}
                                                >
                                                    <Plus className="mr-1 size-3" />
                                                    Agregar alimento
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => addMeal(dayIndex)}
                                    >
                                        <Plus className="mr-1 size-3.5" />
                                        Agregar comida
                                    </Button>
                                </CardContent>
                            )}
                        </Card>
                    );
                })}
            </div>

            {/* Suplementos */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Pill className="size-4 text-purple-500" />
                        Suplementos
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={addSupplement}>
                        <Plus className="mr-1.5 size-3.5" />
                        Agregar suplemento
                    </Button>
                </CardHeader>
                <CardContent className="space-y-2">
                    {!plan.supplements || plan.supplements.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-2">
                            No hay suplementos en este plan. Agregá los recomendados para el paciente.
                        </p>
                    ) : (
                        <div className="grid gap-2 sm:grid-cols-2">
                        {plan.supplements.map((supp, suppIndex) => (
                            <div
                                key={suppIndex}
                                className="rounded-xl border p-3 space-y-2.5 bg-background"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950">
                                        <Pill className="size-3.5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <Input
                                        value={supp.name}
                                        onChange={(e) =>
                                            updateSupplement(suppIndex, "name", e.target.value)
                                        }
                                        placeholder="Nombre del suplemento"
                                        className="flex-1 h-8 text-sm font-medium border-0 bg-transparent px-0 focus-visible:ring-0"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-7 text-muted-foreground hover:text-destructive shrink-0"
                                        onClick={() => removeSupplement(suppIndex)}
                                    >
                                        <Trash2 className="size-3.5" />
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-muted-foreground uppercase">Dosis</span>
                                        <Input
                                            value={supp.dosage ?? ""}
                                            onChange={(e) =>
                                                updateSupplement(suppIndex, "dosage", e.target.value)
                                            }
                                            placeholder="30g, 1 scoop"
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-muted-foreground uppercase">Frecuencia</span>
                                        <Input
                                            value={supp.frequency ?? ""}
                                            onChange={(e) =>
                                                updateSupplement(suppIndex, "frequency", e.target.value)
                                            }
                                            placeholder="Diario"
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                        <span className="text-[10px] text-muted-foreground uppercase">Momento</span>
                                        <Input
                                            value={supp.timing ?? ""}
                                            onChange={(e) =>
                                                updateSupplement(suppIndex, "timing", e.target.value)
                                            }
                                            placeholder="Post-entreno"
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                </div>
                                <Textarea
                                    value={supp.notes ?? ""}
                                    onChange={(e) =>
                                        updateSupplement(suppIndex, "notes", e.target.value)
                                    }
                                    placeholder="Instrucción o aclaración para el paciente"
                                    rows={1}
                                    className="h-8 min-h-0 text-xs resize-none text-muted-foreground"
                                />
                            </div>
                        ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Acciones */}
            <Card className="border-dashed">
                <CardContent className="pt-6">
                    <div className="text-center space-y-3">
                        <p className="text-sm font-medium text-muted-foreground">
                            ¿Querés generar recetas y lista de compras basadas en este plan?
                        </p>
                        <div className="flex items-center justify-center gap-3">
                            <Button
                                variant="outline"
                                onClick={handleGenerateRecipes}
                                disabled={generatingRecipes || generatingList}
                            >
                                {generatingRecipes ? (
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                ) : (
                                    <ChefHat className="mr-2 size-4" />
                                )}
                                {generatingRecipes ? "Generando recetas..." : "Crear recetas del plan"}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleGenerateShoppingList}
                                disabled={generatingRecipes || generatingList}
                            >
                                {generatingList ? (
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                ) : (
                                    <ShoppingCart className="mr-2 size-4" />
                                )}
                                {generatingList ? "Generando lista..." : "Crear lista de compras"}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex items-center justify-between pt-2">
                <Button variant="ghost" onClick={() => { clearDraftPlan(); onBack(); }}>
                    Volver
                </Button>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => handleSave("DRAFT")}
                        disabled={saving}
                    >
                        <Save className="mr-2 size-4" />
                        Guardar borrador
                    </Button>
                    <Button onClick={() => handleSave("ACTIVE")} disabled={saving}>
                        Publicar plan
                    </Button>
                </div>
            </div>

            <PlanChatDrawer
                plan={plan}
                onPlanChange={(updated, previous, changedFoodKeys) => {
                    setPlan(updated);
                    updateDraftPlan(updated);
                    setChatUndo({ previous, keys: changedFoodKeys });
                }}
                originalOptions={chatOriginalOptions}
                patientId={primaryPatientId}
            />
        </div>
    );
}
