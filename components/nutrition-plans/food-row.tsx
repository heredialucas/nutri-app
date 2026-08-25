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
}

interface FoodRowProps {
    food: FoodData;
    index: number;
    onChange: (index: number, food: FoodData) => void;
    onRemove: (index: number) => void;
}

export function FoodRow({ food, index, onChange, onRemove }: FoodRowProps) {
    return (
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
            <Input
                placeholder="Notas"
                value={food.notes}
                onChange={(e) => onChange(index, { ...food, notes: e.target.value })}
                className="w-32"
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
    );
}
