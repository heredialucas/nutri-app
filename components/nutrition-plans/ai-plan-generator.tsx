"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import {
    Sparkles,
    Loader2,
    Zap,
    Flame,
    Minus,
    Plus,
} from "lucide-react";
import { toast } from "sonner";
import { generateMealPlanWithAI } from "@/app/actions/ai-meal-plan";
import { usePlanDraftStore } from "@/stores/plan-draft-store";
import type { GeneratedMealPlan, PlanOptions } from "@/lib/ai/meal-plan-generator";

const SUGGESTIONS = [
    "Plan para bajar de peso",
    "Plan alto en proteínas",
    "Plan para diabetes tipo 2",
    "Plan vegetariano",
    "Plan antiinflamatorio",
    "Plan para hipertensos",
    "Plan para deportista",
    "Plan para embarazada",
];

const DIETARY_TYPES = [
    "Omnívora",
    "Vegetariana",
    "Vegana",
    "Keto",
    "Mediterránea",
    "DASH",
];

const RESTRICTIONS = [
    "Sin gluten",
    "Sin lactosa",
    "Sin frutos secos",
    "Bajo en sodio",
    "Sin azúcar",
    "Sin mariscos",
    "Sin huevos",
    "Alto en proteína",
];

interface AIPlanGeneratorProps {
    patientId: string;
    patientName: string;
    onGenerated: (plan: GeneratedMealPlan) => void;
    optionsOpen: boolean;
    onOptionsOpenChange: (open: boolean) => void;
}

export function AIPlanGenerator({
    patientId,
    patientName,
    onGenerated,
    optionsOpen,
    onOptionsOpenChange,
}: AIPlanGeneratorProps) {
    const [loading, setLoading] = useState(false);
    const [prompt, setPrompt] = useState("");

    const [calories, setCalories] = useState(2000);
    const [mealsPerDay, setMealsPerDay] = useState(5);
    const [dietaryType, setDietaryType] = useState<string | null>(null);
    const [restrictions, setRestrictions] = useState<string[]>([]);
    const [includeFoods, setIncludeFoods] = useState("");
    const [excludeFoods, setExcludeFoods] = useState("");

    const toggleRestriction = (r: string) => {
        setRestrictions((prev) =>
            prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
        );
    };

    const handleSuggestionClick = (suggestion: string) => {
        setPrompt((prev) => {
            const base = prev.trim();
            return base ? `${base}, ${suggestion.toLowerCase()}` : suggestion;
        });
    };

    const handleGenerate = async () => {
        if (calories <= 0) {
            toast.error("Ingresá las calorías diarias");
            return;
        }

        const options: PlanOptions = {
            calorieTarget: calories,
            mealsPerDay,
            dietaryType: dietaryType ? [dietaryType] : [],
            restrictions,
            includeFoods,
            excludeFoods,
            additionalNotes: prompt.trim(),
        };

        setLoading(true);
        try {
            const plan = await generateMealPlanWithAI(patientId, options, prompt.trim() || undefined);
            usePlanDraftStore.getState().setPlan(patientId, patientName, plan, options, prompt.trim());
            onGenerated(plan);
            toast.success("Plan generado correctamente");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al generar");
        } finally {
            setLoading(false);
        }
    };

    const activeCount =
        restrictions.length +
        (includeFoods ? 1 : 0) +
        (excludeFoods ? 1 : 0);

    return (
        <div className="space-y-3">
            <div className="relative">
                <Textarea
                    placeholder={`Instrucciones para ${patientName}... (opcional)`}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            if (!loading && calories > 0) handleGenerate();
                        }
                    }}
                    rows={2}
                    className="resize-none pr-12 text-sm"
                    disabled={loading}
                />
                <Button
                    size="icon"
                    className="absolute right-2 bottom-2 size-8"
                    onClick={handleGenerate}
                    disabled={loading || calories <= 0}
                >
                    {loading ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        <Sparkles className="size-4" />
                    )}
                </Button>
            </div>

            <div className="flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s, i) => (
                    <Badge
                        key={i}
                        variant="outline"
                        className="cursor-pointer text-xs py-0.5 px-2 transition-colors hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 dark:hover:bg-purple-950 dark:hover:text-purple-300"
                        onClick={() => !loading && handleSuggestionClick(s)}
                    >
                        <Zap className="mr-1 size-2.5" />
                        {s}
                    </Badge>
                ))}
            </div>

            <Sheet open={optionsOpen} onOpenChange={onOptionsOpenChange}>
                <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                    <SheetHeader className="mb-4">
                        <SheetTitle>Opciones del plan</SheetTitle>
                        <SheetDescription>
                            Configurá los parámetros del plan alimentario
                        </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-5">
                        {activeCount > 0 || dietaryType ? (
                            <div className="rounded-lg border border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950 p-3 space-y-1">
                                <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                                    <Sparkles className="size-3" /> Opciones seleccionadas
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    <Badge variant="secondary" className="text-xs">
                                        {calories} kcal
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs">
                                        {mealsPerDay} comidas
                                    </Badge>
                                    {dietaryType && (
                                        <Badge variant="secondary" className="text-xs">
                                            {dietaryType}
                                        </Badge>
                                    )}
                                    {restrictions.map((r) => (
                                        <Badge key={r} variant="secondary" className="text-xs">
                                            {r}
                                        </Badge>
                                    ))}
                                    {includeFoods && (
                                        <Badge variant="secondary" className="text-xs">
                                            + {includeFoods}
                                        </Badge>
                                    )}
                                    {excludeFoods && (
                                        <Badge variant="destructive" className="text-xs">
                                            - {excludeFoods}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
                                Tocá las opciones para configurar el plan que generará la IA
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-1.5">
                                <Flame className="size-3.5 text-orange-500" />
                                Calorías diarias *
                                <span className="ml-auto text-xs font-semibold text-orange-600 dark:text-orange-400">
                                    {calories} kcal
                                </span>
                            </label>
                            <Input
                                type="number"
                                value={calories}
                                onChange={(e) => setCalories(parseInt(e.target.value) || 0)}
                                min={800}
                                max={6000}
                                step={50}
                                className="h-9"
                            />
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Comidas por día</label>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-7"
                                    onClick={() => setMealsPerDay(Math.max(3, mealsPerDay - 1))}
                                >
                                    <Minus className="size-3" />
                                </Button>
                                <span className="text-lg font-bold w-6 text-center">{mealsPerDay}</span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-7"
                                    onClick={() => setMealsPerDay(Math.min(6, mealsPerDay + 1))}
                                >
                                    <Plus className="size-3" />
                                </Button>
                                <span className="text-xs text-muted-foreground ml-1">
                                    {mealsPerDay === 3 && "Almuerzo, Merienda, Cena"}
                                    {mealsPerDay === 4 && "Desayuno, Almuerzo, Merienda, Cena"}
                                    {mealsPerDay === 5 && "Desayuno, Media mañana, Almuerzo, Merienda, Cena"}
                                    {mealsPerDay === 6 && "Desayuno, Media mañana, Almuerzo, Merienda, Cena, Colación"}
                                </span>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Tipo de dieta</label>
                                {dietaryType && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-xs text-muted-foreground"
                                        onClick={() => setDietaryType(null)}
                                    >
                                        Limpiar
                                    </Button>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {DIETARY_TYPES.map((type) => (
                                    <Badge
                                        key={type}
                                        variant={dietaryType === type ? "default" : "outline"}
                                        className={`cursor-pointer text-xs py-0.5 px-2 ${
                                            dietaryType === type
                                                ? "bg-green-600 text-white hover:bg-green-700"
                                                : "hover:bg-green-50 hover:text-green-700"
                                        }`}
                                        onClick={() =>
                                            setDietaryType(dietaryType === type ? null : type)
                                        }
                                    >
                                        {dietaryType === type && <span className="mr-1">✓</span>}
                                        {type}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Restricciones</label>
                                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                                    {restrictions.length > 0
                                        ? `${restrictions.length} seleccionada${restrictions.length > 1 ? "s" : ""}`
                                        : "Ninguna"}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                                {RESTRICTIONS.map((r) => {
                                    const active = restrictions.includes(r);
                                    return (
                                        <label
                                            key={r}
                                            className={`flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs cursor-pointer transition-colors ${
                                                active
                                                    ? "border-amber-400 bg-amber-50 dark:bg-amber-950"
                                                    : "hover:bg-muted"
                                            }`}
                                        >
                                            <Checkbox
                                                checked={active}
                                                onCheckedChange={() => toggleRestriction(r)}
                                                className="size-3.5"
                                            />
                                            {r}
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-green-700 dark:text-green-400">
                                Incluir alimentos
                            </label>
                            <Input
                                placeholder="Pollo, arroz, brócoli..."
                                value={includeFoods}
                                onChange={(e) => setIncludeFoods(e.target.value)}
                                className="h-8 text-sm"
                            />
                            {includeFoods && (
                                <p className="text-xs text-muted-foreground pl-1">
                                    Se incluirá: <span className="font-medium text-green-700 dark:text-green-400">{includeFoods}</span>
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-red-700 dark:text-red-400">
                                Excluir alimentos
                            </label>
                            <Input
                                placeholder="Mariscos, picantes..."
                                value={excludeFoods}
                                onChange={(e) => setExcludeFoods(e.target.value)}
                                className="h-8 text-sm"
                            />
                            {excludeFoods && (
                                <p className="text-xs text-muted-foreground pl-1">
                                    Se excluirá: <span className="font-medium text-red-700 dark:text-red-400">{excludeFoods}</span>
                                </p>
                            )}
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
