"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EvolutionPoint {
    date: string | Date;
    weight: number | null;
    bmi: number | null;
    waist: number | null;
    bodyFat: number | null;
    muscleMass: number | null;
}

interface ProgressChartProps {
    data: EvolutionPoint[];
}

type MetricKey = "weight" | "bmi" | "waist" | "bodyFat" | "muscleMass";

const metrics: { key: MetricKey; label: string; color: string; unit: string }[] = [
    { key: "weight", label: "Peso", color: "#3b82f6", unit: "kg" },
    { key: "bmi", label: "IMC", color: "#10b981", unit: "" },
    { key: "waist", label: "Cintura", color: "#f59e0b", unit: "cm" },
    { key: "bodyFat", label: "Grasa", color: "#ef4444", unit: "%" },
    { key: "muscleMass", label: "Masa muscular", color: "#8b5cf6", unit: "kg" },
];

function formatDate(dateStr: string | Date) {
    return new Date(dateStr).toLocaleDateString("es-AR", {
        day: "numeric",
        month: "short",
    });
}

export function ProgressChart({ data }: ProgressChartProps) {
    const [activeMetrics, setActiveMetrics] = useState<MetricKey[]>(["weight"]);

    const toggleMetric = (key: MetricKey) => {
        setActiveMetrics((prev) =>
            prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]
        );
    };

    if (data.length === 0) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                    Cargá al menos una medición para ver la evolución
                </CardContent>
            </Card>
        );
    }

    const chartData = data.map((d) => ({
        ...d,
        dateLabel: formatDate(d.date),
    }));

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Evolución</CardTitle>
                <div className="flex flex-wrap gap-2 mt-2">
                    {metrics.map((m) => {
                        const hasData = data.some((d) => d[m.key] !== null);
                        if (!hasData) return null;
                        return (
                            <Button
                                key={m.key}
                                variant={activeMetrics.includes(m.key) ? "default" : "outline"}
                                size="sm"
                                className={cn(
                                    "h-7 text-xs",
                                    activeMetrics.includes(m.key) && "text-white"
                                )}
                                style={
                                    activeMetrics.includes(m.key)
                                        ? { backgroundColor: m.color }
                                        : undefined
                                }
                                onClick={() => toggleMetric(m.key)}
                            >
                                {m.label}
                            </Button>
                        );
                    })}
                </div>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                            dataKey="dateLabel"
                            className="text-xs"
                            tick={{ fill: "hsl(var(--muted-foreground))" }}
                        />
                        <YAxis
                            className="text-xs"
                            tick={{ fill: "hsl(var(--muted-foreground))" }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                                fontSize: "12px",
                            }}
                        />
                        <Legend />
                        {metrics
                            .filter((m) => activeMetrics.includes(m.key))
                            .map((m) => (
                                <Line
                                    key={m.key}
                                    type="monotone"
                                    dataKey={m.key}
                                    name={m.label}
                                    stroke={m.color}
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                    connectNulls
                                />
                            ))}
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
