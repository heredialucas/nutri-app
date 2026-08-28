"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FoodRow, FoodData } from "./food-row";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export interface MealData {
    id?: string;
    label: string;
    mealOrder: number;
    notes?: string;
    foods: FoodData[];
}

interface MealEditorProps {
    meal: MealData;
    index: number;
    onChange: (index: number, meal: MealData) => void;
    onRemove: (index: number) => void;
}

export function MealEditor({ meal, index, onChange, onRemove }: MealEditorProps) {
    const [collapsed, setCollapsed] = useState(false);

    const updateFood = (foodIndex: number, food: FoodData) => {
        const foods = [...meal.foods];
        foods[foodIndex] = food;
        onChange(index, { ...meal, foods });
    };

    const addFood = () => {
        onChange(index, {
            ...meal,
            foods: [...meal.foods, { name: "", quantity: "", unit: "", notes: "" }],
        });
    };

    const removeFood = (foodIndex: number) => {
        onChange(index, {
            ...meal,
            foods: meal.foods.filter((_, i) => i !== foodIndex),
        });
    };

    return (
        <div className="rounded-lg border bg-card p-4 space-y-3">
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
                    placeholder="Nombre de la comida (ej: Desayuno)"
                    value={meal.label}
                    onChange={(e) => onChange(index, { ...meal, label: e.target.value })}
                    className="flex-1 font-medium"
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
                <div className="space-y-2 pl-10">
                    <Textarea
                        placeholder="Comentario de esta comida (ej: Elegí una infusión para acompañar esta comida)..."
                        value={meal.notes ?? ""}
                        onChange={(e) => onChange(index, { ...meal, notes: e.target.value })}
                        rows={1}
                        className="resize-none text-xs text-muted-foreground"
                    />
                    {meal.foods.map((food, foodIndex) => (
                        <FoodRow
                            key={foodIndex}
                            food={food}
                            index={foodIndex}
                            onChange={updateFood}
                            onRemove={removeFood}
                        />
                    ))}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addFood}
                        className="w-full"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar alimento
                    </Button>
                </div>
            )}
        </div>
    );
}
