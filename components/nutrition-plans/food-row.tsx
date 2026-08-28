"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export interface FoodData {
    id?: string;
    name: string;
    quantity: string;
    unit: string;
    notes: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
}

interface FoodRowProps {
    food: FoodData;
    index: number;
    onChange: (index: number, food: FoodData) => void;
    onRemove: (index: number) => void;
}

const num = (v: string) => (v === "" || v === undefined || isNaN(parseFloat(v)) ? undefined : parseFloat(v));

export function FoodRow({ food, index, onChange, onRemove }: FoodRowProps) {
    return (
        <div className="space-y-1">
            <div className="flex items-center gap-2">
                <Input
                    placeholder="Alimento"
                    value={food.name}
                    onChange={(e) => onChange(index, { ...food, name: e.target.value })}
                    className="flex-1"
                />
                <Input
                    placeholder="Cantidad"
                    value={food.quantity}
                    onChange={(e) => onChange(index, { ...food, quantity: e.target.value })}
                    className="w-24"
                />
                <Input
                    placeholder="Unidad"
                    value={food.unit}
                    onChange={(e) => onChange(index, { ...food, unit: e.target.value })}
                    className="w-24"
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(index)}
                    className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
            <div className="flex items-center gap-2 pl-1">
                <Input
                    placeholder="Notas"
                    value={food.notes}
                    onChange={(e) => onChange(index, { ...food, notes: e.target.value })}
                    className="flex-1"
                />
                <Input
                    type="number"
                    placeholder="kcal"
                    value={food.calories ?? ""}
                    onChange={(e) => onChange(index, { ...food, calories: num(e.target.value) })}
                    className="w-20"
                    title="Calorías"
                />
                <Input
                    type="number"
                    placeholder="P (g)"
                    value={food.protein ?? ""}
                    onChange={(e) => onChange(index, { ...food, protein: num(e.target.value) })}
                    className="w-20"
                    title="Proteína (g)"
                />
                <Input
                    type="number"
                    placeholder="HC (g)"
                    value={food.carbs ?? ""}
                    onChange={(e) => onChange(index, { ...food, carbs: num(e.target.value) })}
                    className="w-20"
                    title="Carbohidratos (g)"
                />
                <Input
                    type="number"
                    placeholder="Grasas (g)"
                    value={food.fat ?? ""}
                    onChange={(e) => onChange(index, { ...food, fat: num(e.target.value) })}
                    className="w-20"
                    title="Grasas (g)"
                />
            </div>
        </div>
    );
}
