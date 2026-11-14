"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { IsakResult } from "@/lib/isak/calculations";
import { AnatomicalSilhouette } from "./anatomical-silhouette";

type Point = { date: string; result: IsakResult };

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
}

function fullDateLabel(value: string) {
  return new Date(value).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtDelta(current: number | null | undefined, prev: number | null | undefined, unit: string) {
  if (current == null || prev == null) return "—";
  const diff = Math.round((current - prev) * 100) / 100;
  if (diff === 0) return `0 ${unit}`;
  return `${diff > 0 ? "+" : ""}${diff} ${unit}`;
}

function ChartCard({
  title,
  description,
  data,
  lines,
  unit,
}: {
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
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <XAxis dataKey="date" tickFormatter={dateLabel} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={42} />
            <Tooltip
              formatter={(value) => [`${value ?? "—"}${unit ? ` ${unit}` : ""}`, ""]}
              labelFormatter={(label) => dateLabel(String(label))}
            />
            {lines.map((line) => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.label}
                stroke={line.color}
                strokeWidth={2.5}
                dot={{ r: 3 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {lines.map((line) => (
            <span key={line.key} className="inline-flex items-center gap-1.5">
              <i className="h-2 w-2 rounded-full" style={{ backgroundColor: line.color }} />
              {line.label}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface IsakVisualsProps {
  data: Point[];
  currentDate?: string;
  compareWithDate?: string;
  onCompareDateChange?: (date: string) => void;
}

export function IsakVisuals({
  data,
  currentDate,
  compareWithDate,
  onCompareDateChange,
}: IsakVisualsProps) {
  const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  if (sorted.length === 0) return null;

  const currentIdx = currentDate
    ? Math.max(0, sorted.findIndex((d) => d.date === currentDate))
    : sorted.length - 1;
  const current = sorted[currentIdx] ?? sorted[sorted.length - 1];

  const otherEvaluations = sorted.filter((d) => d.date !== current.date);
  const defaultPrev =
    sorted[currentIdx - 1] ??
    otherEvaluations[otherEvaluations.length - 1] ??
    null;

  const [internalCompareDate, setInternalCompareDate] = useState<string>(defaultPrev?.date ?? "");
  const activeCompareDate = compareWithDate ?? internalCompareDate;
  const previous =
    otherEvaluations.find((d) => d.date === activeCompareDate) ??
    defaultPrev;

  const handleCompareChange = (val: string) => {
    setInternalCompareDate(val);
    onCompareDateChange?.(val);
  };

  const prevLabel = previous ? fullDateLabel(previous.date) : null;

  // Datos para los 2 gráficos superiores (Actual vs Anterior)
  const bicompartimentalData = [
    {
      label: "Actual",
      grasa: current.result.bicompartimental.masaGrasaKg ?? current.result.fraccionamiento.masaAdiposaKg,
      magra:
        current.result.bicompartimental.masaLibreGrasaKg ??
        (current.result.fraccionamiento.masaAdiposaKg != null
          ? Math.round((current.result.datos.peso - current.result.fraccionamiento.masaAdiposaKg) * 100) / 100
          : null),
      peso: current.result.datos.peso,
    },
    ...(previous
      ? [
          {
            label: prevLabel!,
            grasa: previous.result.bicompartimental.masaGrasaKg ?? previous.result.fraccionamiento.masaAdiposaKg,
            magra:
              previous.result.bicompartimental.masaLibreGrasaKg ??
              (previous.result.fraccionamiento.masaAdiposaKg != null
                ? Math.round((previous.result.datos.peso - previous.result.fraccionamiento.masaAdiposaKg) * 100) / 100
                : null),
            peso: previous.result.datos.peso,
          },
        ]
      : []),
  ];

  const fraccionamientoData = [
    {
      label: "Actual",
      adiposo: current.result.fraccionamiento.masaAdiposaKg,
      muscular: current.result.fraccionamiento.masaMuscularKg,
      peso: current.result.datos.peso,
    },
    ...(previous
      ? [
          {
            label: prevLabel!,
            adiposo: previous.result.fraccionamiento.masaAdiposaKg,
            muscular: previous.result.fraccionamiento.masaMuscularKg,
            peso: previous.result.datos.peso,
          },
        ]
      : []),
  ];

  // Barras horizontales de distribución adiposo-muscular
  const perimeterVal = (res: IsakResult, name: string) =>
    res.mediciones.perimetros.find((p) => p.nombre === name)?.valor ?? null;

  const distributionBarsData = [
    {
      name: "Brazo relajado (cm)",
      actual: perimeterVal(current.result, "Brazo relajado"),
      anterior: previous ? perimeterVal(previous.result, "Brazo relajado") : null,
    },
    {
      name: "Brazo corregido (cm)",
      actual: current.result.distribucion.brazoCorregido,
      anterior: previous ? previous.result.distribucion.brazoCorregido : null,
    },
    {
      name: "Muslo medio (cm)",
      actual: perimeterVal(current.result, "Muslo medio"),
      anterior: previous ? perimeterVal(previous.result, "Muslo medio") : null,
    },
    {
      name: "Muslo corregido (cm)",
      actual: current.result.distribucion.musloCorregido,
      anterior: previous ? previous.result.distribucion.musloCorregido : null,
    },
    {
      name: "Pierna (cm)",
      actual: perimeterVal(current.result, "Pierna"),
      anterior: previous ? perimeterVal(previous.result, "Pierna") : null,
    },
    {
      name: "Pierna corregida (cm)",
      actual: current.result.distribucion.piernaCorregida,
      anterior: previous ? previous.result.distribucion.piernaCorregida : null,
    },
  ];

  // Comparativa en barras de Pliegues (mm)
  const skinfoldsBarData = current.result.adiposidad.porPliegue.map((site) => {
    const prevSite = previous?.result.adiposidad.porPliegue.find((p) => p.nombre === site.nombre);
    return {
      name: site.nombre,
      actual: site.valor,
      anterior: prevSite?.valor ?? null,
    };
  });

  // Comparativa en barras de Perímetros (cm)
  const perimetersBarData = current.result.mediciones.perimetros.map((site) => {
    const prevSite = previous?.result.mediciones.perimetros.find((p) => p.nombre === site.nombre);
    return {
      name: site.nombre.replace("Brazo flexionado y contraído", "Brazo flex."),
      actual: site.valor,
      anterior: prevSite?.valor ?? null,
    };
  });

  // Series históricas
  const composition = sorted.map((item) => ({
    date: item.date,
    grasa: item.result.fraccionamiento.masaAdiposaPct,
    musculo: item.result.fraccionamiento.masaMuscularPct,
  }));
  const basics = sorted.map((item) => ({
    date: item.date,
    peso: item.result.datos.peso,
    imc: item.result.datos.imc,
  }));
  const circumferences = sorted.map((item) => ({
    date: item.date,
    cintura: item.result.salud.find((s) => s.nombre === "Perímetro cintura")?.valor ?? null,
  }));
  const folds = sorted.map((item) => ({
    date: item.date,
    total: item.result.sumatorio6Pliegues,
  }));

  const iamDiff =
    current.result.indiceAdiposoMuscular.valor != null && previous?.result.indiceAdiposoMuscular.valor != null
      ? Math.round((current.result.indiceAdiposoMuscular.valor - previous.result.indiceAdiposoMuscular.valor) * 100) / 100
      : null;

  const imoDiff =
    current.result.indiceMusculoOseo.valor != null && previous?.result.indiceMusculoOseo.valor != null
      ? Math.round((current.result.indiceMusculoOseo.valor - previous.result.indiceMusculoOseo.valor) * 100) / 100
      : null;

  return (
    <section className="space-y-6" aria-label="Análisis y comparación antropométrica">
      {/* Encabezado y selector de comparación */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
            Lectura comparativa ISAK
          </p>
          <h2 className="text-xl font-semibold tracking-tight">Composición y evolución corporal</h2>
        </div>

        {otherEvaluations.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Comparar con:</span>
            <Select value={previous?.date ?? ""} onValueChange={handleCompareChange}>
              <SelectTrigger className="h-8 w-[180px] text-xs">
                <SelectValue placeholder="Seleccionar fecha" />
              </SelectTrigger>
              <SelectContent>
                {[...otherEvaluations].reverse().map((ev) => (
                  <SelectItem key={ev.date} value={ev.date} className="text-xs">
                    {fullDateLabel(ev.date)} ({ev.result.datos.peso} kg)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Doble gráfico superior estilo ISAK metry */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">Masa grasa vs. Masa libre de grasa (kg)</CardTitle>
            <p className="text-xs text-muted-foreground">Modelo bicompartimental y masa corporal total</p>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={bicompartimentalData} margin={{ top: 12, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="grasa" name="Masa grasa (kg)" fill="#fef08a" stroke="#ca8a04" radius={[4, 4, 0, 0]} />
                <Bar dataKey="magra" name="Masa libre de grasa (kg)" fill="#b97a7a" stroke="#7f1d1d" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="peso" name="Masa corporal (kg)" stroke="#14b8a6" strokeWidth={2.5} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">Tejido adiposo vs. Tejido muscular (kg)</CardTitle>
            <p className="text-xs text-muted-foreground">Fraccionamiento tisular (Kerr / Lee) y masa corporal</p>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={fraccionamientoData} margin={{ top: 12, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="adiposo" name="Tejido adiposo (kg)" fill="#eab308" stroke="#854d0e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="muscular" name="Tejido muscular (kg)" fill="#b91c1c" stroke="#7f1d1d" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="peso" name="Masa corporal (kg)" stroke="#14b8a6" strokeWidth={2.5} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Distribución adiposo muscular + Silueta anatómica */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Distribución adiposo muscular</CardTitle>
              <p className="text-xs text-muted-foreground">
                Comparativa de perímetros reales y corregidos junto con el reparto regional de tejido adiposo y muscular
              </p>
            </div>
            {prevLabel && (
              <Badge variant="outline" className="text-xs">
                Actual vs. {prevLabel}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2 items-center pt-2">
          <div className="h-[270px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={distributionBarsData}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 20, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="actual" name="Actual" fill="#10b981" radius={[0, 4, 4, 0]} />
                {previous && <Bar dataKey="anterior" name={prevLabel!} fill="#fb923c" radius={[0, 4, 4, 0]} />}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <AnatomicalSilhouette
            adiposo={current.result.zonas.adiposo}
            muscular={current.result.zonas.muscular}
          />
        </CardContent>
      </Card>

      {/* Comparativa de Pliegues y Perímetros en Barras */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Comparativa de pliegues cutáneos (mm)</CardTitle>
            <p className="text-xs text-muted-foreground">
              Total actual: <strong>{current.result.sumatorio6Pliegues ?? "—"} mm</strong>
              {previous?.result.sumatorio6Pliegues != null && (
                <span>
                  {" "}· Diferencia: <strong>{fmtDelta(current.result.sumatorio6Pliegues, previous.result.sumatorio6Pliegues, "mm")}</strong>
                </span>
              )}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={skinfoldsBarData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="actual" name="Actual (mm)" fill="#10b981" radius={[4, 4, 0, 0]} />
                {previous && <Bar dataKey="anterior" name={`${prevLabel} (mm)`} fill="#fb923c" radius={[4, 4, 0, 0]} />}
              </BarChart>
            </ResponsiveContainer>
            {previous && (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-center">
                {skinfoldsBarData.map((s) => (
                  <div key={s.name} className="rounded-md border bg-muted/20 px-1.5 py-1">
                    <p className="text-[10px] text-muted-foreground truncate">{s.name}</p>
                    <p className="text-xs font-semibold">{fmtDelta(s.actual, s.anterior, "mm")}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Comparativa de perímetros (cm)</CardTitle>
            <p className="text-xs text-muted-foreground">
              Evolución de circunferencias corporales entre controles
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={perimetersBarData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="actual" name="Actual (cm)" fill="#0d9488" radius={[4, 4, 0, 0]} />
                {previous && <Bar dataKey="anterior" name={`${prevLabel} (cm)`} fill="#f59e0b" radius={[4, 4, 0, 0]} />}
              </BarChart>
            </ResponsiveContainer>
            {previous && (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-center">
                {perimetersBarData.map((p) => (
                  <div key={p.name} className="rounded-md border bg-muted/20 px-1.5 py-1">
                    <p className="text-[10px] text-muted-foreground truncate">{p.name}</p>
                    <p className="text-xs font-semibold">{fmtDelta(p.actual, p.anterior, "cm")}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Índices de composición corporal */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Índices de composición corporal</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <div className="py-3 space-y-1.5">
            <div className="grid grid-cols-4 gap-2 text-sm items-center">
              <div className="col-span-1 font-semibold">Índice adiposo muscular</div>
              <div className="text-center">
                <span className="block text-[10px] text-muted-foreground">Valor actual</span>
                <span className="font-bold">{current.result.indiceAdiposoMuscular.valor ?? "—"}</span>
              </div>
              <div className="text-center">
                <span className="block text-[10px] text-muted-foreground">{prevLabel ?? "Anterior"}</span>
                <span className="font-medium">{previous?.result.indiceAdiposoMuscular.valor ?? "—"}</span>
              </div>
              <div className="text-center">
                <span className="block text-[10px] text-muted-foreground">Diferencia</span>
                <span className={`font-semibold ${iamDiff != null && iamDiff < 0 ? "text-emerald-600" : iamDiff != null && iamDiff > 0 ? "text-amber-600" : ""}`}>
                  {iamDiff == null ? "—" : `${iamDiff > 0 ? "+" : ""}${iamDiff}`}
                </span>
              </div>
            </div>
            <p className="text-xs font-medium">
              Clasificación: <Badge variant="secondary">{current.result.indiceAdiposoMuscular.clasificacion}</Badge>
            </p>
            <p className="text-xs text-muted-foreground">{current.result.indiceAdiposoMuscular.interpretacion}</p>
          </div>

          <div className="py-3 space-y-1.5">
            <div className="grid grid-cols-4 gap-2 text-sm items-center">
              <div className="col-span-1 font-semibold">Índice músculo / óseo</div>
              <div className="text-center">
                <span className="block text-[10px] text-muted-foreground">Valor actual</span>
                <span className="font-bold">{current.result.indiceMusculoOseo.valor ?? "—"}</span>
              </div>
              <div className="text-center">
                <span className="block text-[10px] text-muted-foreground">{prevLabel ?? "Anterior"}</span>
                <span className="font-medium">{previous?.result.indiceMusculoOseo.valor ?? "—"}</span>
              </div>
              <div className="text-center">
                <span className="block text-[10px] text-muted-foreground">Diferencia</span>
                <span className={`font-semibold ${imoDiff != null && imoDiff > 0 ? "text-emerald-600" : imoDiff != null && imoDiff < 0 ? "text-amber-600" : ""}`}>
                  {imoDiff == null ? "—" : `${imoDiff > 0 ? "+" : ""}${imoDiff}`}
                </span>
              </div>
            </div>
            <p className="text-xs font-medium">
              Clasificación: <Badge variant="secondary">{current.result.indiceMusculoOseo.clasificacion}</Badge>
            </p>
            <p className="text-xs text-muted-foreground">{current.result.indiceMusculoOseo.interpretacion}</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1 pt-1 text-[11px] text-muted-foreground">
              <span>&lt; 2,01: Muy bajo</span>
              <span>2,01–2,11: Bajo</span>
              <span>2,11–2,78: Medio</span>
              <span>2,78–2,96: Alto</span>
              <span>&gt; 2,96: Muy alto</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tendencias históricas */}
      {sorted.length >= 2 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard
            title="Peso e IMC"
            description="Cambios generales a lo largo del tiempo"
            data={basics}
            lines={[
              { key: "peso", label: "Peso", color: "#2563eb" },
              { key: "imc", label: "IMC", color: "#8b5cf6" },
            ]}
            unit=""
          />
          <ChartCard
            title="Composición corporal (%)"
            description="Estimaciones expresadas como porcentaje del peso"
            data={composition}
            lines={[
              { key: "grasa", label: "Masa adiposa", color: "#e76f51" },
              { key: "musculo", label: "Masa muscular", color: "#159a72" },
            ]}
            unit="%"
          />
          <ChartCard
            title="Cintura"
            description="Útil para observar cambios en la zona abdominal"
            data={circumferences}
            lines={[{ key: "cintura", label: "Cintura", color: "#d97706" }]}
            unit="cm"
          />
          <ChartCard
            title="Sumatorio de pliegues"
            description="Suma de seis sitios medidos con plicómetro"
            data={folds}
            lines={[{ key: "total", label: "Total", color: "#dc2626" }]}
            unit="mm"
          />
        </div>
      )}
    </section>
  );
}
