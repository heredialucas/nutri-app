"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
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
    Pill,
    Calculator,
} from "lucide-react";
import { toast } from "sonner";
import { generateMealPlanWithAI } from "@/app/actions/ai-meal-plan";
import { usePlanDraftStore } from "@/stores/plan-draft-store";
import {
    MACRO_PRESETS,
    macrosFromRatio,
    macroPresetById,
} from "@/lib/ai/macro-presets";
import type { GeneratedMealPlan, PlanOptions } from "@/lib/ai/meal-plan-generator";
import { activityLevels, calculateCalorieTargets, goals } from "@/lib/calorie-calculator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

const PROTEIN_PRESETS = [
    { value: 90, label: "Estándar", desc: "~1-1.2 g/kg", color: "text-rose-600 dark:text-rose-400" },
    { value: 120, label: "Medio", desc: "~1.4-1.6 g/kg", color: "text-rose-600 dark:text-rose-400" },
    { value: 150, label: "Musculación", desc: "~1.8-2 g/kg", color: "text-rose-600 dark:text-rose-400" },
    { value: 160, label: "Definición", desc: "~2-2.2 g/kg", color: "text-rose-600 dark:text-rose-400" },
];

const SUPPLEMENT_SUGGESTIONS = [
    "Proteína en polvo (whey)",
    "Creatina monohidrato",
    "Omega-3 (EPA/DHA)",
    "Vitamina D3",
    "Complejo B",
    "Magnesio",
    "Hierro",
    "Calcio",
    "Zinc",
    "Probióticos",
    "Fibra (psyllium)",
    "Multivitamínico",
    "BCAA / EAA",
    "Citrulina",
    "Cafeína",
    "Electrolitos",
];

const DAY_COLORS = [
    "border-blue-200 dark:border-blue-800",
    "border-emerald-200 dark:border-emerald-800",
    "border-amber-200 dark:border-amber-800",
    "border-rose-200 dark:border-rose-800",
    "border-violet-200 dark:border-violet-800",
    "border-cyan-200 dark:border-cyan-800",
    "border-orange-200 dark:border-orange-800",
];

const DAY_MEAL_LABELS: Record<number, string[]> = {
    3: ["Almuerzo", "Merienda", "Cena"],
    4: ["Desayuno", "Almuerzo", "Merienda", "Cena"],
    5: ["Desayuno", "Media mañana", "Almuerzo", "Merienda", "Cena"],
    6: ["Desayuno", "Media mañana", "Almuerzo", "Merienda", "Cena", "Colación"],
};

interface DaySkeletonProps {
    index: number;
    meals: number;
}

function DaySkeleton({ index, meals }: DaySkeletonProps) {
    const dayLabels = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
    const mealLabels = DAY_MEAL_LABELS[meals] || DAY_MEAL_LABELS[5];
    return (
        <div className={`rounded-xl border bg-card p-4 space-y-3 animate-pulse ${DAY_COLORS[index % 7]}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="size-4 rounded-full bg-muted" />
                    <Skeleton className="h-4 w-40" />
                </div>
                <Skeleton className="h-4 w-20" />
            </div>
            <div className="space-y-2">
                {mealLabels.map((label, i) => (
                    <div key={i} className="rounded-lg border bg-muted/30 p-2.5 space-y-2">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                        <div className="space-y-1.5 pl-1">
                            <Skeleton className="h-3 w-11/12" />
                            <Skeleton className="h-3 w-3/4" />
                            <Skeleton className="h-3 w-4/5" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

interface AIPlanGeneratorProps {
    patientIds?: string[];
    patientName: string;
    onGenerated: (plan: GeneratedMealPlan) => void;
    optionsOpen: boolean;
    onOptionsOpenChange: (open: boolean) => void;
}

export function AIPlanGenerator({
    patientIds = [],
    patientName,
    onGenerated,
    optionsOpen,
    onOptionsOpenChange,
}: AIPlanGeneratorProps) {
    const [loading, setLoading] = useState(false);
    const [prompt, setPrompt] = useState("");

    const primaryPatientId = patientIds[0] || null;

    const [calories, setCalories] = useState(2000);
    const [mealsPerDay, setMealsPerDay] = useState(5);
    const [dietaryType, setDietaryType] = useState<string | null>(null);
    const [restrictions, setRestrictions] = useState<string[]>([]);
    const [includeFoods, setIncludeFoods] = useState("");
    const [excludeFoods, setExcludeFoods] = useState("");
    const [macroPreset, setMacroPreset] = useState<string>("balanced");
    const [customProtein, setCustomProtein] = useState(120);
    const [customCarbs, setCustomCarbs] = useState(250);
    const [customFat, setCustomFat] = useState(70);
    const [selectedSupplements, setSelectedSupplements] = useState<string[]>([]);
    const [calculatorSex, setCalculatorSex] = useState<"masculino" | "femenino">("masculino");
    const [calculatorAge, setCalculatorAge] = useState(30);
    const [calculatorWeight, setCalculatorWeight] = useState(70);
    const [calculatorHeight, setCalculatorHeight] = useState(170);
    const [calculatorActivity, setCalculatorActivity] = useState("moderado");
    const [calculatorObjective, setCalculatorObjective] = useState("mantener");
    const calorieCalculation = calculateCalorieTargets({ sex: calculatorSex, age: calculatorAge, weight: calculatorWeight, height: calculatorHeight, activity: calculatorActivity, objective: calculatorObjective });

    const applyCalorieCalculation = () => {
        if (!calorieCalculation) return;
        setCalories(calorieCalculation.calories);
        setCustomProtein(calorieCalculation.proteinMax);
        setCustomCarbs(calorieCalculation.carbsMax);
        setCustomFat(calorieCalculation.fatMax);
        setMacroPreset("custom");
        toast.success("Objetivos calculados aplicados");
    };

    const toggleRestriction = (r: string) => {
        setRestrictions((prev) =>
            prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
        );
    };

    const toggleSupplement = (s: string) => {
        setSelectedSupplements((prev) =>
            prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
        );
    };

    const applyProteinPreset = (value: number) => {
        setCustomProtein(value);
        setMacroPreset("custom");
    };

    const getMacroTargets = (): {
        proteinTarget: number;
        carbTarget: number;
        fatTarget: number;
    } => {
        if (macroPreset === "custom") {
            return { proteinTarget: customProtein, carbTarget: customCarbs, fatTarget: customFat };
        }
        const preset = macroPresetById(macroPreset);
        if (!preset) return { proteinTarget: 0, carbTarget: 0, fatTarget: 0 };
        return macrosFromRatio(calories, preset.ratio);
    };

    const resolvedMacros = getMacroTargets();
    const macroSummary = (() => {
        if (macroPreset === "custom") {
            return `P ${customProtein} · HC ${customCarbs} · G ${customFat} g`;
        }
        const preset = macroPresetById(macroPreset);
        return preset ? `${preset.label}: P ${resolvedMacros.proteinTarget} · HC ${resolvedMacros.carbTarget} · G ${resolvedMacros.fatTarget} g` : "";
    })();

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

        const preset = macroPresetById(macroPreset);
        const macroTargets = getMacroTargets();

        let notes = prompt.trim();
        if (selectedSupplements.length > 0) {
            const suppText = `Considerá incluir estos suplementos en el plan (si corresponde para el paciente): ${selectedSupplements.join(", ")}.`;
            notes = notes ? `${notes}\n${suppText}` : suppText;
        }

        const options: PlanOptions = {
            calorieTarget: calories,
            mealsPerDay,
            dietaryType: dietaryType ? [dietaryType] : [],
            restrictions,
            includeFoods,
            excludeFoods,
            additionalNotes: notes,
            macroPreset: macroPreset === "custom" ? "Personalizado" : preset?.label || undefined,
            ...macroTargets,
        };

        setLoading(true);
        try {
            const plan = await generateMealPlanWithAI(primaryPatientId, options, notes || undefined);
            usePlanDraftStore.getState().setPlan(primaryPatientId, patientName, plan, options, prompt.trim());
            onGenerated(plan);
            toast.success("Plan generado correctamente");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al generar");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-3">
            {/* Opciones seleccionadas visibles junto al chat */}
            <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary" className="text-xs">
                    <Flame className="mr-1 size-2.5 text-orange-500" />
                    {calories} kcal
                </Badge>
                <Badge variant="secondary" className="text-xs">
                    {mealsPerDay} comidas
                </Badge>
                {dietaryType && (
                    <Badge variant="secondary" className="text-xs">{dietaryType}</Badge>
                )}
                {restrictions.map((r) => (
                    <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>
                ))}
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
                    P {resolvedMacros.proteinTarget ?? "–"} · HC {resolvedMacros.carbTarget ?? "–"} · G {resolvedMacros.fatTarget ?? "–"} g
                </Badge>
                {includeFoods && (
                    <Badge variant="outline" className="text-xs border-green-300 text-green-700 bg-green-50">
                        + {includeFoods}
                    </Badge>
                )}
                {excludeFoods && (
                    <Badge variant="destructive" className="text-xs">
                        - {excludeFoods}
                    </Badge>
                )}
                {selectedSupplements.map((s) => (
                    <Badge key={s} variant="outline" className="text-xs border-violet-300 text-violet-700 bg-violet-50 dark:text-violet-300">
                        <Pill className="mr-1 size-2.5" />
                        {s}
                    </Badge>
                ))}
            </div>

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

            {loading && (
                <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="size-4 animate-spin text-purple-500" />
                        <span className="font-medium text-purple-700 dark:text-purple-300">
                            Generando el plan de 7 días...
                        </span>
                        <span className="text-xs">esto puede tardar unos segundos</span>
                    </div>
                    {Array.from({ length: 7 }).map((_, i) => (
                        <DaySkeleton key={i} index={i} meals={mealsPerDay} />
                    ))}
                </div>
            )}

            <Sheet open={optionsOpen} onOpenChange={onOptionsOpenChange}>
                <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                    <SheetHeader className="mb-4">
                        <SheetTitle>Opciones del plan</SheetTitle>
                        <SheetDescription>
                            Configurá los parámetros del plan alimentario
                        </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-5">
                        <div className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
                            Las opciones seleccionadas se ven junto al chat de generación
                        </div>

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

                         <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-800 dark:bg-emerald-950/30">
                             <div className="mb-3 flex items-center gap-2 text-sm font-medium"><Calculator className="size-4 text-emerald-600" />Calcular objetivos manualmente</div>
                             <div className="grid grid-cols-2 gap-2">
                                 <div className="space-y-1"><label className="text-[10px] font-medium">Sexo</label><Select value={calculatorSex} onValueChange={(value) => setCalculatorSex(value as "masculino" | "femenino")}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="masculino">Masculino</SelectItem><SelectItem value="femenino">Femenino</SelectItem></SelectContent></Select></div>
                                 <div className="space-y-1"><label className="text-[10px] font-medium">Edad (años)</label><Input type="number" min={1} value={calculatorAge} onChange={(e) => setCalculatorAge(Number(e.target.value) || 0)} className="h-8 text-xs" /></div>
                                 <div className="space-y-1"><label className="text-[10px] font-medium">Peso (kg)</label><Input type="number" min={1} step="0.1" value={calculatorWeight} onChange={(e) => setCalculatorWeight(Number(e.target.value) || 0)} className="h-8 text-xs" /></div>
                                 <div className="space-y-1"><label className="text-[10px] font-medium">Altura (cm)</label><Input type="number" min={1} value={calculatorHeight} onChange={(e) => setCalculatorHeight(Number(e.target.value) || 0)} className="h-8 text-xs" /></div>
                                 <div className="space-y-1"><label className="text-[10px] font-medium">Actividad</label><Select value={calculatorActivity} onValueChange={setCalculatorActivity}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{activityLevels.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div>
                                 <div className="space-y-1"><label className="text-[10px] font-medium">Objetivo</label><Select value={calculatorObjective} onValueChange={setCalculatorObjective}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{goals.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div>
                             </div>
                             {calorieCalculation && <div className="mt-3 flex items-center justify-between gap-2"><p className="text-xs text-muted-foreground">{calorieCalculation.calories} kcal · P {calorieCalculation.proteinMin}–{calorieCalculation.proteinMax} g · HC {calorieCalculation.carbsMin}–{calorieCalculation.carbsMax} g · G {calorieCalculation.fatMin}–{calorieCalculation.fatMax} g</p><Button type="button" size="sm" className="h-8 shrink-0" onClick={applyCalorieCalculation}>Aplicar</Button></div>}
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
                                <label className="text-sm font-medium">Macronutrientes</label>
                                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                                    {macroSummary}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                                {MACRO_PRESETS.map((p) => {
                                    const isCustom = p.id === "custom";
                                    return (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => setMacroPreset(p.id)}
                                            className={`text-left rounded-md border px-2 py-1.5 text-xs transition-colors ${
                                                macroPreset === p.id
                                                    ? isCustom
                                                        ? "border-violet-500 bg-violet-50 dark:bg-violet-950"
                                                        : "border-purple-400 bg-purple-50 dark:bg-purple-950"
                                                    : isCustom
                                                    ? "border-violet-300 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-950"
                                                    : "hover:bg-muted"
                                            }`}
                                        >
                                            <span className={`font-medium block ${
                                                macroPreset === p.id
                                                    ? isCustom
                                                        ? "text-violet-700 dark:text-violet-300"
                                                        : "text-purple-700 dark:text-purple-300"
                                                    : isCustom
                                                    ? "text-violet-600 dark:text-violet-400"
                                                    : ""
                                            }`}>
                                                {macroPreset === p.id && <span className="mr-0.5">✓</span>}
                                                {p.label}
                                            </span>
                                            <span className="text-[11px] text-muted-foreground">{p.description}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {macroPreset === "custom" && (
                                <div className="rounded-lg border p-3 space-y-2 bg-muted/20">
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-medium text-rose-600 dark:text-rose-400">Proteína (g)</label>
                                            <Input
                                                type="number"
                                                value={customProtein}
                                                onChange={(e) => setCustomProtein(parseInt(e.target.value) || 0)}
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-medium text-sky-600 dark:text-sky-400">Carb. (g)</label>
                                            <Input
                                                type="number"
                                                value={customCarbs}
                                                onChange={(e) => setCustomCarbs(parseInt(e.target.value) || 0)}
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-medium text-amber-600 dark:text-amber-400">Grasas (g)</label>
                                            <Input
                                                type="number"
                                                value={customFat}
                                                onChange={(e) => setCustomFat(parseInt(e.target.value) || 0)}
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">
                                        ={" "}
                                        {Math.round((customProtein * 4) + (customCarbs * 4) + (customFat * 9))} kcal aprox.
                                    </p>
                                </div>
                            )}
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Objetivo proteico</label>
                                <span
                                    className={`text-xs font-semibold ${
                                        macroPreset === "custom"
                                            ? "text-rose-600 dark:text-rose-400"
                                            : "text-muted-foreground"
                                    }`}
                                >
                                    {macroPreset === "custom" ? `${customProtein} g/día` : "Usa preset de macros"}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                                {PROTEIN_PRESETS.map((p) => {
                                    const active = macroPreset === "custom" && customProtein === p.value;
                                    return (
                                        <button
                                            key={p.value}
                                            type="button"
                                            onClick={() => applyProteinPreset(p.value)}
                                            className={`text-left rounded-md border px-2 py-1.5 text-xs transition-colors ${
                                                active
                                                    ? "border-rose-400 bg-rose-50 dark:bg-rose-950"
                                                    : "hover:bg-muted"
                                            }`}
                                        >
                                            <span className={`font-medium block ${
                                                active ? "text-rose-700 dark:text-rose-300" : ""
                                            }`}>
                                                {active && <span className="mr-0.5">✓</span>}
                                                {p.label} · {p.value}g
                                            </span>
                                            <span className="text-[11px] text-muted-foreground">{p.desc}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Al elegir un objetivo, se activa la configuración personalizada de macronutrientes.
                            </p>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Suplementos sugeridos</label>
                                <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                                    {selectedSupplements.length > 0
                                        ? `${selectedSupplements.length} seleccionado${selectedSupplements.length > 1 ? "s" : ""}`
                                        : "Opcional"}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {SUPPLEMENT_SUGGESTIONS.map((s) => {
                                    const active = selectedSupplements.includes(s);
                                    return (
                                        <Badge
                                            key={s}
                                            variant={active ? "default" : "outline"}
                                            className={`cursor-pointer text-xs py-0.5 px-2 ${
                                                active
                                                    ? "bg-violet-600 text-white hover:bg-violet-700"
                                                    : "hover:bg-violet-50 hover:text-violet-700"
                                            }`}
                                            onClick={() => toggleSupplement(s)}
                                        >
                                            {active && <span className="mr-1">✓</span>}
                                            {s}
                                        </Badge>
                                    );
                                })}
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
