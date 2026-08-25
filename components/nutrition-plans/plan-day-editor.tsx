"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MealEditor, MealData } from "./meal-editor";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export interface DayData {
    id?: string;
    dayOrder: number;
    label: string;
    meals: MealData[];
}

interface PlanDayEditorProps {
    day: DayData;
    index: number;
    onChange: (index: number, day: DayData) => void;
    onRemove: (index: number) => void;
}

export function PlanDayEditor({ day, index, onChange, onRemove }: PlanDayEditorProps) {
    const [collapsed, setCollapsed] = useState(false);

    const updateMeal = (mealIndex: number, meal: MealData) => {
        const meals = [...day.meals];
        meals[mealIndex] = meal;
        onChange(index, { ...day, meals });
    };

    const addMeal = () => {
        onChange(index, {
            ...day,
            meals: [
                ...day.meals,
                { label: "", mealOrder: day.meals.length + 1, foods: [] },
            ],
        });
    };

    const removeMeal = (mealIndex: number) => {
        onChange(index, {
            ...day,
            meals: day.meals.filter((_, i) => i !== mealIndex),
        });
    };

    return (
        <div className="rounded-lg border-2 bg-muted/30 p-4 space-y-3">
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setCollapsed(!collapsed)}
                    className="h-8 w-8"
                >
                    {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </Button>
                <Input
                    placeholder="Nombre del día (ej: Día 1 - Lunes)"
                    value={day.label}
                    onChange={(e) => onChange(index, { ...day, label: e.target.value })}
                    className="flex-1 font-semibold"
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(index)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            {!collapsed && (
                <div className="space-y-3 pl-10">
                    {day.meals.map((meal, mealIndex) => (
                        <MealEditor
                            key={mealIndex}
                            meal={meal}
                            index={mealIndex}
                            onChange={updateMeal}
                            onRemove={removeMeal}
                        />
                    ))}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addMeal}
                        className="w-full"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar comida
                    </Button>
                </div>
            )}
        </div>
    );
}
