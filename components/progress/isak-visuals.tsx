"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { IsakResult } from "@/lib/isak/calculations";

type Point = { date: string; result: IsakResult };

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
}

function ChartCard({ title, description, data, lines, unit }: {
  title: string;
  description: string;
  data: Record<string, string | number | null>[];
  lines: { key: string; label: string; color: string }[];
  unit: string;
}) {
  if (!data.some((item) => lines.some((line) => item[line.key] != null))) return null;
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-1">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="pt-3">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <XAxis dataKey="date" tickFormatter={dateLabel} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={42} />
            <Tooltip formatter={(value) => [`${value ?? "—"}${unit ? ` ${unit}` : ""}`, ""]} labelFormatter={(label) => dateLabel(String(label))} />
            {lines.map((line) => (
              <Line key={line.key} type="monotone" dataKey={line.key} name={line.label} stroke={line.color} strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
            ))}
          </LineChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {lines.map((line) => <span key={line.key} className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full" style={{ backgroundColor: line.color }} />{line.label}</span>)}
        </div>
      </CardContent>
    </Card>
  );
}

export function IsakVisuals({ data }: { data: Point[] }) {
  const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const composition = sorted.map((item) => ({ date: item.date, grasa: item.result.fraccionamiento.masaAdiposaPct, musculo: item.result.fraccionamiento.masaMuscularPct }));
  const basics = sorted.map((item) => ({ date: item.date, peso: item.result.datos.peso, imc: item.result.datos.imc }));
  const circumferences = sorted.map((item) => ({ date: item.date, cintura: item.result.salud.find((s) => s.nombre === "Perímetro cintura")?.valor ?? null, cadera: null }));
  const folds = sorted.map((item) => ({ date: item.date, total: item.result.sumatorio6Pliegues }));
  const breadths = sorted.map((item) => ({ date: item.date, húmero: item.result.diametros.humerusBreadth, fémur: item.result.diametros.femurBreadth, muñeca: item.result.diametros.biStyloidWrist }));

  return (
    <section className="space-y-4" aria-label="Gráficos de evolución antropométrica">
      <div className="flex items-end justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Lectura visual</p><h2 className="text-xl font-semibold tracking-tight">Evolución corporal</h2></div>
        <p className="hidden text-xs text-muted-foreground sm:block">{sorted.length} evaluaciones comparadas</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <CompositionSnapshot result={sorted[sorted.length - 1].result} />
        <ChartCard title="Peso e IMC" description="Cambios generales a lo largo del tiempo" data={basics} lines={[{ key: "peso", label: "Peso", color: "#2563eb" }, { key: "imc", label: "IMC", color: "#8b5cf6" }]} unit="" />
        <ChartCard title="Composición corporal" description="Estimaciones expresadas como porcentaje del peso" data={composition} lines={[{ key: "grasa", label: "Masa adiposa", color: "#e76f51" }, { key: "musculo", label: "Masa muscular", color: "#159a72" }]} unit="%" />
        <ChartCard title="Cintura" description="Útil para observar cambios en la zona abdominal" data={circumferences} lines={[{ key: "cintura", label: "Cintura", color: "#d97706" }]} unit="cm" />
        <ChartCard title="Sumatorio de pliegues" description="Suma de seis sitios medidos con plicómetro" data={folds} lines={[{ key: "total", label: "Total", color: "#dc2626" }]} unit="mm" />
        <ChartCard title="Diámetros óseos" description="Medidas estructurales, no indicadores de salud" data={breadths} lines={[{ key: "húmero", label: "Húmero", color: "#0f766e" }, { key: "fémur", label: "Fémur", color: "#0891b2" }, { key: "muñeca", label: "Muñeca", color: "#7c3aed" }]} unit="mm" />
      </div>
    </section>
  );
}

function CompositionSnapshot({ result }: { result: IsakResult }) {
  const parts = [
    { label: "Masa adiposa", value: result.fraccionamiento.masaAdiposaPct, color: "#e76f51" },
    { label: "Masa muscular", value: result.fraccionamiento.masaMuscularPct, color: "#159a72" },
    { label: "Otros tejidos", value: result.fraccionamiento.otrosPct, color: "#94a3b8" },
  ];
  return <Card><CardHeader className="pb-1"><CardTitle className="text-base">¿De qué se compone tu peso?</CardTitle><p className="text-xs text-muted-foreground">Estimación de la última evaluación</p></CardHeader><CardContent className="space-y-4 pt-4">{parts.map((part) => <div key={part.label}><div className="mb-1.5 flex justify-between text-xs"><span>{part.label}</span><strong>{part.value == null ? "—" : `${part.value}%`}</strong></div><div className="h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full transition-all" style={{ width: `${Math.min(part.value ?? 0, 100)}%`, backgroundColor: part.color }} /></div></div>)}<p className="text-[11px] leading-relaxed text-muted-foreground">Las estimaciones ayudan a ver tendencias, pero no son una medición directa de cada tejido.</p></CardContent></Card>;
}
