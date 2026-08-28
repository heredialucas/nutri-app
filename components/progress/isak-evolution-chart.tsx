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
import type { IsakResult } from "@/lib/isak/calculations";

export interface IsakEvolutionPoint {
  date: string;
  result: IsakResult;
}

type MetricKey = "peso" | "grasa" | "musculo" | "iam";

const metrics: { key: MetricKey; label: string; color: string; unit: string }[] = [
  { key: "peso", label: "Peso", color: "#3b82f6", unit: "kg" },
  { key: "grasa", label: "Masa adiposa", color: "#ef4444", unit: "%" },
  { key: "musculo", label: "Masa muscular", color: "#10b981", unit: "%" },
  { key: "iam", label: "Índice adiposo muscular", color: "#8b5cf6", unit: "" },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

export function IsakEvolutionChart({ data }: { data: IsakEvolutionPoint[] }) {
  const [active, setActive] = useState<MetricKey[]>(["peso", "grasa", "musculo"]);

  const toggle = (key: MetricKey) =>
    setActive((prev) => (prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]));

  if (data.length < 2) return null;

  const chartData = data
    .map((d) => ({
      dateLabel: formatDate(d.date),
      ts: new Date(d.date).getTime(),
      peso: d.result.datos.peso,
      grasa: d.result.fraccionamiento.masaAdiposaPct,
      musculo: d.result.fraccionamiento.masaMuscularPct,
      iam: d.result.indiceAdiposoMuscular.valor,
    }))
    .sort((a, b) => a.ts - b.ts);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Evolución de la composición corporal</CardTitle>
          <div className="flex flex-wrap gap-2">
            {metrics.map((m) => (
              <Button
                key={m.key}
                variant={active.includes(m.key) ? "default" : "outline"}
                size="sm"
                className={cn("h-7 text-xs", active.includes(m.key) && "text-white")}
                style={active.includes(m.key) ? { backgroundColor: m.color } : undefined}
                onClick={() => toggle(m.key)}
              >
                {m.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="dateLabel" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
            <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} allowDecimals />
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
              .filter((m) => active.includes(m.key))
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
