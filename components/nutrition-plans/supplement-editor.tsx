"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export interface SupplementData {
    id?: string;
    name: string;
    dosage: string;
    timing: string;
    frequency: string;
    notes: string;
}

interface SupplementEditorProps {
    supplement: SupplementData;
    index: number;
    onChange: (index: number, supplement: SupplementData) => void;
    onRemove: (index: number) => void;
}

export function SupplementEditor({ supplement, index, onChange, onRemove }: SupplementEditorProps) {
    return (
        <div className="rounded-lg border bg-card p-3 space-y-2">
            <div className="flex items-center gap-2">
                <span className="rounded bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 px-1.5 py-0.5 text-[11px] font-medium">
                    Suplemento
                </span>
                <Input
                    placeholder="Nombre del suplemento"
                    value={supplement.name}
                    onChange={(e) => onChange(index, { ...supplement, name: e.target.value })}
                    className="flex-1 font-medium"
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(index)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input
                    placeholder="Dosis (ej: 30g, 1 scoop)"
                    value={supplement.dosage}
                    onChange={(e) => onChange(index, { ...supplement, dosage: e.target.value })}
                />
                <Input
                    placeholder="Momento (ej: Post-entreno)"
                    value={supplement.timing}
                    onChange={(e) => onChange(index, { ...supplement, timing: e.target.value })}
                />
                <Input
                    placeholder="Frecuencia (ej: Diario)"
                    value={supplement.frequency}
                    onChange={(e) => onChange(index, { ...supplement, frequency: e.target.value })}
                />
            </div>
            <Textarea
                placeholder="Instrucción o aclaración para el paciente..."
                value={supplement.notes}
                onChange={(e) => onChange(index, { ...supplement, notes: e.target.value })}
                rows={1}
                className="resize-none text-xs text-muted-foreground"
            />
        </div>
    );
}
