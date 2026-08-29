import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Scale, Activity, Ruler } from "lucide-react";
import { cn } from "@/lib/utils";

interface LatestMeasurement {
    weight: string | null;
    height: string | null;
    bmi: string | null;
    waist: string | null;
    hip: string | null;
    arm: string | null;
    bodyFatPercentage: string | null;
    muscleMass: string | null;
    measuredAt: string;
}

interface PreviousMeasurement {
    weight: string | null;
    bmi: string | null;
    waist: string | null;
    bodyFatPercentage: string | null;
    muscleMass: string | null;
}

interface EvolutionSummaryProps {
    latest: LatestMeasurement;
    previous: PreviousMeasurement | null;
}

function getDelta(current: string | null | undefined, previous: string | null | undefined): number | null {
    if (!current || !previous) return null;
    return parseFloat(current) - parseFloat(previous);
}

function DeltaBadge({ value, unit = "", invert = false }: { value: number | null; unit?: string; invert?: boolean }) {
    if (value === null) return null;
    const rounded = Math.round(value * 10) / 10;
    const isPositive = invert ? rounded < 0 : rounded > 0;
    const isNegative = invert ? rounded > 0 : rounded < 0;

    return (
        <span
            className={cn(
                "inline-flex items-center gap-0.5 text-xs font-medium",
                isPositive && "text-emerald-600",
                isNegative && "text-red-600",
                !isPositive && !isNegative && "text-muted-foreground"
            )}
        >
            {isPositive && <TrendingUp className="h-3 w-3" />}
            {isNegative && <TrendingDown className="h-3 w-3" />}
            {!isPositive && !isNegative && <Minus className="h-3 w-3" />}
            {rounded > 0 ? "+" : ""}{rounded}{unit}
        </span>
    );
}

function bmiCategory(bmi: number): { label: string; className: string } {
    if (bmi < 18.5) return { label: "Bajo peso", className: "text-blue-600" };
    if (bmi < 25) return { label: "Normal", className: "text-emerald-600" };
    if (bmi < 30) return { label: "Sobrepeso", className: "text-amber-600" };
    return { label: "Obesidad", className: "text-red-600" };
}

export function EvolutionSummary({ latest, previous }: EvolutionSummaryProps) {
    const weightDelta = getDelta(latest.weight, previous?.weight);
    const bmiDelta = getDelta(latest.bmi, previous?.bmi);
    const waistDelta = getDelta(latest.waist, previous?.waist);
    const fatDelta = getDelta(latest.bodyFatPercentage, previous?.bodyFatPercentage);
    const muscleDelta = getDelta(latest.muscleMass, previous?.muscleMass);

    const bmiValue = latest.bmi ? parseFloat(latest.bmi) : null;
    const bmiCat = bmiValue ? bmiCategory(bmiValue) : null;

    return (
        <div className="space-y-2">
            <Card>
                <CardContent className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                        <Scale className="h-4 w-4 shrink-0" />
                        <span className="text-sm font-medium">Peso</span>
                    </div>
                    <DeltaBadge value={weightDelta} unit=" kg" />
                    <div className="text-xl font-bold shrink-0 text-right">
                        {latest.weight ? `${latest.weight}` : "—"}
                        <span className="text-xs font-normal text-muted-foreground ml-1">kg</span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                        <Activity className="h-4 w-4 shrink-0" />
                        <span className="text-sm font-medium">IMC</span>
                    </div>
                    <span className="shrink-0 flex items-center gap-2">
                        {bmiCat && (
                            <span className={cn("text-xs font-medium", bmiCat.className)}>
                                {bmiCat.label}
                            </span>
                        )}
                        <DeltaBadge value={bmiDelta} />
                    </span>
                    <div className="text-xl font-bold shrink-0 text-right">
                        {latest.bmi || "—"}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                        <Ruler className="h-4 w-4 shrink-0" />
                        <span className="text-sm font-medium">Cintura</span>
                    </div>
                    <DeltaBadge value={waistDelta} unit=" cm" invert />
                    <div className="text-xl font-bold shrink-0 text-right">
                        {latest.waist || "—"}
                        <span className="text-xs font-normal text-muted-foreground ml-1">cm</span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                        <Activity className="h-4 w-4 shrink-0" />
                        <span className="text-sm font-medium">Grasa corporal</span>
                    </div>
                    <DeltaBadge value={fatDelta} unit="%" invert />
                    <div className="text-xl font-bold shrink-0 text-right">
                        {latest.bodyFatPercentage || "—"}
                        <span className="text-xs font-normal text-muted-foreground ml-1">%</span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                        <Activity className="h-4 w-4 shrink-0" />
                        <span className="text-sm font-medium">Masa muscular</span>
                    </div>
                    <DeltaBadge value={muscleDelta} unit=" kg" />
                    <div className="text-xl font-bold shrink-0 text-right">
                        {latest.muscleMass || "—"}
                        <span className="text-xs font-normal text-muted-foreground ml-1">kg</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
