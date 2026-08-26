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
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
    createNutritionPlan,
    updateNutritionPlan,
} from "@/app/actions/nutrition-plans";
import { generateRecipesFromPlan } from "@/app/actions/ai-recipes";
import { generateShoppingListFromPlanAI } from "@/app/actions/ai-shopping-lists";
import { createRecipe } from "@/app/actions/recipes";
import { createShoppingList } from "@/app/actions/shopping-lists";
import { usePlanDraftStore } from "@/stores/plan-draft-store";
import type { GeneratedMealPlan } from "@/lib/ai/meal-plan-generator";

interface PlanEditorProps {
    plan: GeneratedMealPlan;
    patientId: string;
    onBack: () => void;
}

export function PlanEditor({ plan: initialPlan, patientId, onBack }: PlanEditorProps) {
    const router = useRouter();
    const [plan, setPlan] = useState(initialPlan);
    const [saving, setSaving] = useState(false);
    const [generatingRecipes, setGeneratingRecipes] = useState(false);
    const [generatingList, setGeneratingList] = useState(false);
    const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({
        0: true,
    });

    const { updatePlan: updateDraftPlan, clearPlan: clearDraftPlan, patientName } = usePlanDraftStore();

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
        foods[foodIndex] = { ...foods[foodIndex], [field]: value };
        meals[mealIndex] = { ...meals[mealIndex], foods };
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
        const foods = [...meals[mealIndex].foods, { name: "", quantity: "", unit: "", notes: "" }];
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

    const handleGenerateRecipes = async () => {
        setGeneratingRecipes(true);
        try {
            const result = await generateRecipesFromPlan(plan, patientId);
            for (const recipe of result.recipes) {
                await createRecipe({
                    title: recipe.title,
                    description: recipe.description || undefined,
                    ingredients: recipe.ingredients || undefined,
                    instructions: recipe.instructions || undefined,
                });
            }
            toast.success(`${result.recipes.length} receta${result.recipes.length !== 1 ? "s" : ""} creada${result.recipes.length !== 1 ? "s" : ""}. Podés verlas en la sección de recetas.`);
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
                patientId,
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
                patientId,
                title: plan.title,
                description: plan.description || undefined,
                calorieTarget: plan.calorieTarget || undefined,
                notes: plan.notes || undefined,
                days: plan.days.map((d, i) => ({
                    dayOrder: i + 1,
                    label: d.label,
                    meals: d.meals.map((m, mi) => ({
                        label: m.label,
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

            const created = await createNutritionPlan(planData as any);
            if (status) {
                await updateNutritionPlan(created.id, { status });
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

    return (
        <div className="space-y-6">
            {/* Header editable */}
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                            <Input
                                value={plan.title}
                                onChange={(e) => updatePlanField("title", e.target.value)}
                                className="text-lg font-semibold"
                                placeholder="Título del plan"
                            />
                            <Textarea
                                value={plan.description}
                                onChange={(e) => updatePlanField("description", e.target.value)}
                                placeholder="Descripción del plan"
                                rows={2}
                                className="resize-none"
                            />
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                            {plan.calorieTarget > 0 && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Calorías:</span>
                                    <Input
                                        type="number"
                                        value={plan.calorieTarget}
                                        onChange={(e) =>
                                            updatePlanField("calorieTarget", parseInt(e.target.value) || 0)
                                        }
                                        className="w-24 text-center"
                                    />
                                    <span className="text-sm text-muted-foreground">kcal</span>
                                </div>
                            )}
                            <Badge variant="secondary">
                                <Sparkles className="mr-1 size-3" />
                                Generado con IA
                            </Badge>
                        </div>
                    </div>
                    {plan.notes && (
                        <div className="space-y-1">
                            <span className="text-xs font-medium text-muted-foreground">Notas:</span>
                            <Textarea
                                value={plan.notes}
                                onChange={(e) => updatePlanField("notes", e.target.value)}
                                rows={2}
                                className="resize-none text-sm"
                            />
                        </div>
                    )}
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
        </div>
    );
}
