"use client";

import { Label } from "@/components/ui/label";

interface AdherenceFieldProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
}

export function AdherenceField({ value, onChange, label = "Cumplimiento del plan" }: AdherenceFieldProps) {
    const numValue = value ? parseInt(value) : 50;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(String(parseInt(e.target.value)));
    };

    const getAdherenceLabel = (val: number) => {
        if (val >= 90) return "Excelente";
        if (val >= 70) return "Bueno";
        if (val >= 50) return "Moderado";
        if (val >= 30) return "Bajo";
        return "Muy bajo";
    };

    const getAdherenceColor = (val: number) => {
        if (val >= 80) return "text-green-600";
        if (val >= 50) return "text-yellow-600";
        return "text-red-600";
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label>{label}</Label>
                <span className={`text-sm font-medium ${getAdherenceColor(numValue)}`}>
                    {numValue}% — {getAdherenceLabel(numValue)}
                </span>
            </div>
            <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={numValue}
                onChange={handleChange}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-muted accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
            </div>
        </div>
    );
}
