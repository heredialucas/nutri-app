"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface RetentionReportProps {
    totalPatients: number;
    activePatients: number;
    averageAdherence: number | null;
    followUpCount: number;
}

export function RetentionReport({ totalPatients, activePatients, averageAdherence, followUpCount }: RetentionReportProps) {
    const retentionRate = totalPatients > 0 ? Math.round((activePatients / totalPatients) * 100) : 0;

    const getAdherenceIcon = (value: number | null) => {
        if (!value) return <Minus className="h-4 w-4 text-muted-foreground" />;
        if (value >= 70) return <TrendingUp className="h-4 w-4 text-green-500" />;
        if (value >= 40) return <Minus className="h-4 w-4 text-yellow-500" />;
        return <TrendingDown className="h-4 w-4 text-red-500" />;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Retención y Cumplimiento</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">Tasa de retención</p>
                        <div className="flex items-center gap-2">
                            <p className="text-3xl font-bold">{retentionRate}%</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {activePatients} de {totalPatients} pacientes
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">Cumplimiento promedio</p>
                        <div className="flex items-center gap-2">
                            {getAdherenceIcon(averageAdherence)}
                            <p className="text-3xl font-bold">{averageAdherence ?? "—"}%</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Basado en {followUpCount} seguimiento{followUpCount !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
