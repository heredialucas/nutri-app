"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    ChevronDown,
    ChevronUp,
    Plus,
    Trash2,
    UtensilsCrossed,
    Clock,
    Undo2,
} from "lucide-react";

export interface DayCardFood {
    id?: string;
    name: string;
    quantity?: string | null;
    unit?: string | null;
    equivalence?: string | null;
    notes?: string | null;
    calories?: number | null;
    protein?: number | null;
    carbs?: number | null;
    fat?: number | null;
}

export interface DayCardMeal {
    id?: string;
    label: string;
    mealOrder?: number;
    notes?: string | null;
    calories?: number | null;
    protein?: number | null;
    carbs?: number | null;
    fat?: number | null;
    foods: DayCardFood[];
}

export interface DayCardDay {
    id?: string;
    dayOrder?: number;
    label: string;
    meals: DayCardMeal[];
}

export type FoodField =
    | "name"
    | "quantity"
    | "unit"
    | "equivalence"
    | "notes"
    | "calories"
    | "protein"
    | "carbs"
    | "fat";

interface PlanDayCardsProps {
    days: DayCardDay[];
    mode?: "view" | "edit";
    onDayLabelChange?: (dayIndex: number, label: string) => void;
    onRemoveDay?: (dayIndex: number) => void;
    onMealLabelChange?: (dayIndex: number, mealIndex: number, label: string) => void;
    onMealNotesChange?: (dayIndex: number, mealIndex: number, notes: string) => void;
    onAddMeal?: (dayIndex: number) => void;
    onRemoveMeal?: (dayIndex: number, mealIndex: number) => void;
    onFoodChange?: (
        dayIndex: number,
        mealIndex: number,
        foodIndex: number,
        field: FoodField,
        value: string
    ) => void;
    onAddFood?: (dayIndex: number, mealIndex: number) => void;
    onRemoveFood?: (dayIndex: number, mealIndex: number, foodIndex: number) => void;
    changedFoodKeys?: string[];
    onUndoFood?: (dayIndex: number, mealIndex: number, foodIndex: number) => void;
}

const dayColors = [
    "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
    "bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800",
    "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800",
    "bg-rose-50 border-rose-200 dark:bg-rose-950 dark:border-rose-800",
    "bg-violet-50 border-violet-200 dark:bg-violet-950 dark:border-violet-800",
    "bg-cyan-50 border-cyan-200 dark:bg-cyan-950 dark:border-cyan-800",
    "bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800",
];

export function PlanDayCards({
    days,
    mode = "view",
    onDayLabelChange,
    onRemoveDay,
    onMealLabelChange,
    onMealNotesChange,
    onAddMeal,
    onRemoveMeal,
    onFoodChange,
    onAddFood,
    onRemoveFood,
    changedFoodKeys = [],
    onUndoFood,
}: PlanDayCardsProps) {
    const isEdit = mode === "edit";
    const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({ 0: true });

    const toggleDay = (index: number) => {
        setExpandedDays((prev) => ({ ...prev, [index]: !prev[index] }));
    };

    const foodHasMacros = (f: DayCardFood) =>
        Boolean(f.calories || f.protein || f.carbs || f.fat);

    const mealHasMacros = (m: DayCardMeal) =>
        m.calories !== undefined || m.protein !== undefined || m.carbs !== undefined || m.fat !== undefined;

    const renderFoodValue = (f: DayCardFood) => [
        f.quantity,
        f.unit ? `${f.unit}` : "",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div className="space-y-3">
            {days.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6 border border-dashed rounded-lg">
                    Este plan no tiene días configurados aún
                </p>
            ) : (
                days.map((day, dayIndex) => {
                    const isExpanded = expandedDays[dayIndex] ?? false;
                    return (
                        <Card
                            key={day.id || dayIndex}
                            className={dayColors[dayIndex % dayColors.length]}
                        >
                            <CardHeader
                                className="cursor-pointer py-3"
                                onClick={() => toggleDay(dayIndex)}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1 min-w-0">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-7 shrink-0"
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
                                        {isEdit ? (
                                            <Input
                                                value={day.label ?? ""}
                                                onChange={(e) =>
                                                    onDayLabelChange?.(dayIndex, e.target.value)
                                                }
                                                className="min-w-0 flex-1 font-semibold bg-transparent border-transparent hover:border-input focus:border-input"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        ) : (
                                            <h3 className="font-semibold text-base leading-6 truncate">
                                                {day.label}
                                            </h3>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Badge variant="outline" className="text-xs">
                                            <Clock className="mr-1 size-3" />
                                            {day.meals.length} comidas
                                        </Badge>
                                        {isEdit && onRemoveDay && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-7 text-muted-foreground hover:text-destructive shrink-0"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onRemoveDay(dayIndex);
                                                }}
                                            >
                                                <Trash2 className="size-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>

                            {isExpanded && (
                                <CardContent className="pt-0 space-y-3">
                                    <Separator />
                                    {day.meals.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-2">
                                            {isEdit
                                                ? "Sin comidas. Agregá la primera."
                                                : "Sin comidas configuradas"}
                                        </p>
                                    ) : (
                                        day.meals.map((meal, mealIndex) => (
                                            <div
                                                key={meal.id || mealIndex}
                                                className="rounded-lg bg-background/80 border p-3 space-y-2"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <UtensilsCrossed className="size-4 text-muted-foreground shrink-0" />
                                                    {isEdit ? (
                                                        <Input
                                                            value={meal.label ?? ""}
                                                            onChange={(e) =>
                                                                onMealLabelChange?.(
                                                                    dayIndex,
                                                                    mealIndex,
                                                                    e.target.value
                                                                )
                                                            }
                                                            className="font-medium text-sm bg-transparent border-transparent hover:border-input focus:border-input"
                                                            placeholder="Nombre de la comida"
                                                        />
                                                    ) : (
                                                        <h4 className="font-medium text-sm">
                                                            {meal.label}
                                                        </h4>
                                                    )}
                                                    {isEdit && onRemoveMeal && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-7 text-muted-foreground hover:text-destructive shrink-0"
                                                            onClick={() =>
                                                                onRemoveMeal(dayIndex, mealIndex)
                                                            }
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </Button>
                                                    )}
                                                </div>

                                                {!isEdit && meal.notes && (
                                                    <p className="pl-6 text-xs italic text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2 py-1.5">
                                                        {meal.notes}
                                                    </p>
                                                )}

                                                {mealHasMacros(meal) && (
                                                    <div className="flex flex-wrap gap-1.5 text-[11px] pl-6">
                                                        {meal.calories !== undefined && (
                                                            <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                                                {meal.calories} kcal
                                                            </span>
                                                        )}
                                                        {meal.protein !== undefined && (
                                                            <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                                                                P {meal.protein}g
                                                            </span>
                                                        )}
                                                        {meal.carbs !== undefined && (
                                                            <span className="px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                                                                HC {meal.carbs}g
                                                            </span>
                                                        )}
                                                        {meal.fat !== undefined && (
                                                            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                                                G {meal.fat}g
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                {isEdit && (
                                                    <div className="pl-6">
                                                        <Textarea
                                                            value={meal.notes ?? ""}
                                                            onChange={(e) =>
                                                                onMealNotesChange?.(
                                                                    dayIndex,
                                                                    mealIndex,
                                                                    e.target.value
                                                                )
                                                            }
                                                            placeholder="Comentario de esta comida (ej: Elegí una infusión para acompañar esta comida)"
                                                            rows={1}
                                                            className="h-8 min-h-0 text-xs resize-none text-muted-foreground bg-transparent"
                                                        />
                                                    </div>
                                                )}

                                                <div className="pl-6 space-y-1">
                                                    {meal.foods.length === 0 ? (
                                                        <p className="text-xs text-muted-foreground italic py-0.5">
                                                            Sin alimentos
                                                        </p>
                                                    ) : (
                                                        meal.foods.map((food, foodIndex) =>
                                                            isEdit ? (
                                                                <div
                                                                    key={food.id || foodIndex}
                                                                    className="flex flex-wrap items-center gap-1.5"
                                                                >
                                                                    <span className="text-muted-foreground text-xs shrink-0">•</span>
                                                                    <Input
                                                                        value={food.name ?? ""}
                                                                        onChange={(e) =>
                                                                            onFoodChange?.(
                                                                                dayIndex,
                                                                                mealIndex,
                                                                                foodIndex,
                                                                                "name",
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                        placeholder="Alimento"
                                                                        className="flex-1 basis-40 md:basis-0 h-8 text-sm bg-transparent border-transparent hover:border-input focus:border-input"
                                                                    />
                                                                    <Input
                                                                        value={food.quantity ?? ""}
                                                                        onChange={(e) =>
                                                                            onFoodChange?.(
                                                                                dayIndex,
                                                                                mealIndex,
                                                                                foodIndex,
                                                                                "quantity",
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                        placeholder="Cant."
                                                                        className="w-16 h-8 text-sm text-center bg-transparent border-transparent hover:border-input focus:border-input shrink-0"
                                                                    />
                                                                    <Input
                                                                        value={food.unit ?? ""}
                                                                        onChange={(e) =>
                                                                            onFoodChange?.(
                                                                                dayIndex,
                                                                                mealIndex,
                                                                                foodIndex,
                                                                                "unit",
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                        placeholder="Unidad"
                                                                        className="w-16 h-8 text-sm bg-transparent border-transparent hover:border-input focus:border-input shrink-0"
                                                                    />
                                                                    <Input
                                                                        value={food.equivalence ?? ""}
                                                                        onChange={(e) =>
                                                                            onFoodChange?.(
                                                                                dayIndex,
                                                                                mealIndex,
                                                                                foodIndex,
                                                                                "equivalence",
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                        placeholder="Equiv."
                                                                        className="w-20 h-8 text-sm bg-transparent border-transparent hover:border-input focus:border-input shrink-0"
                                                                        title="Equivalencia casera (ej: 1 vaso, 1 unidad mediana)"
                                                                    />
                                                                    <Input
                                                                        value={food.notes ?? ""}
                                                                        onChange={(e) =>
                                                                            onFoodChange?.(
                                                                                dayIndex,
                                                                                mealIndex,
                                                                                foodIndex,
                                                                                "notes",
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                        placeholder="Notas"
                                                                        className="w-24 h-8 text-sm bg-transparent border-transparent hover:border-input focus:border-input shrink-0"
                                                                    />
                                                                    <Input
                                                                        type="number"
                                                                        value={(food.calories ?? "") as any}
                                                                        onChange={(e) =>
                                                                            onFoodChange?.(
                                                                                dayIndex,
                                                                                mealIndex,
                                                                                foodIndex,
                                                                                "calories",
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                        placeholder="kcal"
                                                                        className="w-16 h-8 text-sm text-center bg-transparent border-transparent hover:border-input focus:border-input text-muted-foreground shrink-0"
                                                                        title="Calorías"
                                                                    />
                                                                    <Input
                                                                        type="number"
                                                                        value={(food.protein ?? "") as any}
                                                                        onChange={(e) =>
                                                                            onFoodChange?.(
                                                                                dayIndex,
                                                                                mealIndex,
                                                                                foodIndex,
                                                                                "protein",
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                        placeholder="P(g)"
                                                                        className="w-14 h-8 text-sm text-center bg-transparent border-transparent hover:border-input focus:border-input text-rose-600/70 dark:text-rose-400/70 shrink-0"
                                                                        title="Proteína (g)"
                                                                    />
                                                                    <Input
                                                                        type="number"
                                                                        value={(food.carbs ?? "") as any}
                                                                        onChange={(e) =>
                                                                            onFoodChange?.(
                                                                                dayIndex,
                                                                                mealIndex,
                                                                                foodIndex,
                                                                                "carbs",
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                        placeholder="HC(g)"
                                                                        className="w-14 h-8 text-sm text-center bg-transparent border-transparent hover:border-input focus:border-input text-sky-600/70 dark:text-sky-400/70 shrink-0"
                                                                        title="Carbohidratos (g)"
                                                                    />
                                                                    <Input
                                                                        type="number"
                                                                        value={(food.fat ?? "") as any}
                                                                        onChange={(e) =>
                                                                            onFoodChange?.(
                                                                                dayIndex,
                                                                                mealIndex,
                                                                                foodIndex,
                                                                                "fat",
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                        placeholder="G(g)"
                                                                        className="w-14 h-8 text-sm text-center bg-transparent border-transparent hover:border-input focus:border-input text-amber-600/70 dark:text-amber-400/70 shrink-0"
                                                                        title="Grasas (g)"
                                                                    />
                                                                    {onRemoveFood && (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="size-7 text-muted-foreground hover:text-destructive shrink-0"
                                                                            onClick={() =>
                                                                                onRemoveFood(
                                                                                    dayIndex,
                                                                                    mealIndex,
                                                                                    foodIndex
                                                                                )
                                                                            }
                                                                        >
                                                                            <Trash2 className="size-3" />
                                                                        </Button>
                                                                    )}
                                                                    {changedFoodKeys.includes(`${dayIndex}:${mealIndex}:${foodIndex}`) && onUndoFood && (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="size-7 text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950 shrink-0"
                                                                            onClick={() => onUndoFood(dayIndex, mealIndex, foodIndex)}
                                                                            title="Deshacer cambio de la IA"
                                                                        >
                                                                            <Undo2 className="size-3" />
                                                                            <span className="sr-only">Deshacer cambio</span>
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div
                                                                    key={food.id || foodIndex}
                                                                    className="flex flex-wrap items-baseline gap-x-2 py-0.5"
                                                                >
                                                                    <span className="text-muted-foreground text-xs">•</span>
                                                                    <span className="font-medium text-sm">{food.name}</span>
                                                                    {(food.quantity || food.unit) && (
                                                                        <span className="text-sm text-muted-foreground">
                                                                            {renderFoodValue(food)}
                                                                        </span>
                                                                    )}
                                                                    {food.equivalence && (
                                                                        <span className="text-sm text-muted-foreground">
                                                                            ≈ {food.equivalence}
                                                                        </span>
                                                                    )}
                                                                    {food.notes && (
                                                                        <span className="text-xs text-muted-foreground italic">
                                                                            ({food.notes})
                                                                        </span>
                                                                    )}
                                                                    {foodHasMacros(food) && (
                                                                        <span className="text-xs text-muted-foreground">
                                                                            {food.calories
                                                                                ? `${food.calories} kcal`
                                                                                : ""}
                                                                            {food.protein
                                                                                ? ` · ${food.protein}g P`
                                                                                : ""}
                                                                            {food.carbs
                                                                                ? ` · ${food.carbs}g HC`
                                                                                : ""}
                                                                            {food.fat
                                                                                ? ` · ${food.fat}g G`
                                                                                : ""}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )
                                                        )
                                                    )}
                                                    {isEdit && onAddFood && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="w-full h-7 text-xs text-muted-foreground"
                                                            onClick={() => onAddFood(dayIndex, mealIndex)}
                                                        >
                                                            <Plus className="mr-1 size-3" />
                                                            Agregar alimento
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    {isEdit && onAddMeal && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                            onClick={() => onAddMeal(dayIndex)}
                                        >
                                            <Plus className="mr-1 size-3.5" />
                                            Agregar comida
                                        </Button>
                                    )}
                                </CardContent>
                            )}
                        </Card>
                    );
                })
            )}
        </div>
    );
}
