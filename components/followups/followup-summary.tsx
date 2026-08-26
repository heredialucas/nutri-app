"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Scale, Zap, Moon, AlertTriangle } from "lucide-react";

interface FollowUpSummaryProps {
    current: any;
    previous?: any | null;
}

function adherenceColor(adherence: string | null) {
    if (!adherence) return "secondary";
    const val = parseInt(adherence);
    if (val >= 80) return "default";
    if (val >= 50) return "secondary";
    return "destructive";
}

function adherenceLabel(adherence: string | null) {
    if (!adherence) return "Sin datos";
    const val = parseInt(adherence);
    if (val >= 80) return "Alto cumplimiento";
    if (val >= 50) return "Cumplimiento moderado";
    return "Bajo cumplimiento";
}

function energyIcon(energy: string | null) {
    if (!energy) return <Minus className="h-4 w-4 text-muted-foreground" />;
    const val = parseInt(energy);
    if (val >= 7) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (val >= 4) return <Minus className="h-4 w-4 text-yellow-500" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
}

function hungerIcon(hunger: string | null) {
    if (!hunger) return <Minus className="h-4 w-4 text-muted-foreground" />;
    const val = parseInt(hunger);
    if (val <= 3) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (val <= 6) return <Minus className="h-4 w-4 text-yellow-500" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
}

function weightChange(current: any, previous: any) {
    if (!current?.weight || !previous?.weight) return null;
    const diff = parseFloat(current.weight) - parseFloat(previous.weight);
    if (Math.abs(diff) < 0.1) return { value: 0, label: "Estable" };
    return { value: diff, label: diff > 0 ? `+${diff.toFixed(1)} kg` : `${diff.toFixed(1)} kg` };
}

export function FollowUpSummary({ current, previous }: FollowUpSummaryProps) {
    const weightDiff = weightChange(current, previous);

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                            <Scale className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{current.weight || "—"} kg</p>
                            <p className="text-xs text-muted-foreground">
                                {weightDiff ? (
                                    <span className={weightDiff.value > 0 ? "text-red-500" : weightDiff.value < 0 ? "text-green-500" : ""}>
                                        {weightDiff.label} vs anterior
                                    </span>
                                ) : (
                                    "Peso actual"
                                )}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                            {energyIcon(current.energy)}
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{current.energy || "—"}/10</p>
                            <p className="text-xs text-muted-foreground">Energía</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                            {hungerIcon(current.hunger)}
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{current.hunger || "—"}/10</p>
                            <p className="text-xs text-muted-foreground">Hambre</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                            <AlertTriangle className={`h-4 w-4 ${current.adherence && parseInt(current.adherence) < 50 ? "text-red-500" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{current.adherence || "—"}%</p>
                            <p className="text-xs text-muted-foreground">{adherenceLabel(current.adherence)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
