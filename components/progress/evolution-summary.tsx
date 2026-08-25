import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Scale className="h-3 w-3" />
                        Peso
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {latest.weight ? `${latest.weight}` : "—"}
                        <span className="text-sm font-normal text-muted-foreground ml-1">kg</span>
                    </div>
                    <DeltaBadge value={weightDelta} unit=" kg" />
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        IMC
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {latest.bmi || "—"}
                    </div>
                    <div className="flex items-center gap-2">
                        {bmiCat && (
                            <span className={cn("text-xs font-medium", bmiCat.className)}>
                                {bmiCat.label}
                            </span>
                        )}
                        <DeltaBadge value={bmiDelta} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Ruler className="h-3 w-3" />
                        Cintura
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {latest.waist || "—"}
                        <span className="text-sm font-normal text-muted-foreground ml-1">cm</span>
                    </div>
                    <DeltaBadge value={waistDelta} unit=" cm" invert />
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">
                        Grasa corporal
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {latest.bodyFatPercentage || "—"}
                        <span className="text-sm font-normal text-muted-foreground ml-1">%</span>
                    </div>
                    <DeltaBadge value={fatDelta} unit="%" invert />
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">
                        Masa muscular
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {latest.muscleMass || "—"}
                        <span className="text-sm font-normal text-muted-foreground ml-1">kg</span>
                    </div>
                    <DeltaBadge value={muscleDelta} unit=" kg" />
                </CardContent>
            </Card>
        </div>
    );
}
