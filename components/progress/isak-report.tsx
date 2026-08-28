"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IsakPdfButton } from "./isak-pdf";
import type { IsakResult } from "@/lib/isak/calculations";

interface IsakReportProps {
  result: IsakResult;
  paciente: string;
  fecha?: string | null;
  evaluador: string;
}

function Row({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-1.5 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={strong ? "text-sm font-semibold" : "text-sm font-medium"}>{value}</span>
    </div>
  );
}

export function IsakReport({ result, paciente, fecha, evaluador }: IsakReportProps) {
  const fechaTexto = fecha ? format(new Date(fecha), "dd/MM/yyyy", { locale: es }) : "";

  return (
    <div className="space-y-6">
      {/* Encabezado + acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{fechaTexto}</p>
          <p className="text-sm text-muted-foreground">
            Evaluado por: <span className="font-medium text-foreground">{evaluador}</span>
          </p>
        </div>
        <IsakPdfButton result={result} paciente={paciente} fecha={fechaTexto} evaluador={evaluador} />
      </div>

      {/* Medidas básicas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Medidas básicas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Stat label="Masa corporal" value={`${result.datos.peso} kg`} />
            <Stat label="Talla" value={`${result.datos.talla} cm`} />
            <Stat label="Edad" value={`${result.datos.edad} años`} />
            <Stat label="IMC" value={`${result.datos.imc} kg/m²`} />
            <Stat label="Clasificación" value={result.datos.imcClasificacion} />
          </div>
        </CardContent>
      </Card>

      {/* Sumatorio pliegues */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Adiposidad — Sumatorio de 6 pliegues (mm)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {result.adiposidad.porPliegue.map((p) => (
              <div key={p.nombre} className="rounded-lg border bg-muted/30 p-3 text-center">
                <p className="text-xs text-muted-foreground">{p.nombre}</p>
                <p className="text-lg font-semibold">{p.valor} mm</p>
              </div>
            ))}
            <div className="rounded-lg border bg-primary/5 p-3 text-center">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold text-primary">{result.sumatorio6Pliegues ?? "—"} mm</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fraccionamiento tisular */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Fraccionamiento tisular (modelo de 5 componentes)</CardTitle>
        </CardHeader>
        <CardContent>
          <Row
            label="Masa adiposa (Kerr, 1991)"
            value={`${result.fraccionamiento.masaAdiposaKg ?? "—"} kg (${result.fraccionamiento.masaAdiposaPct ?? "—"} %)`}
            strong
          />
          <Row
            label="Masa muscular (Lee, 2000)"
            value={`${result.fraccionamiento.masaMuscularKg ?? "—"} kg (${result.fraccionamiento.masaMuscularPct ?? "—"} %)`}
            strong
          />
          <Row label="Otros tejidos" value={`${result.fraccionamiento.otrosTejidosKg ?? "—"} kg (${result.fraccionamiento.otrosPct ?? "—"} %)`} />
        </CardContent>
      </Card>

      {/* Distribución adiposo-muscular */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Distribución adiposo-muscular</CardTitle>
          </CardHeader>
          <CardContent>
            <Row
              label="Brazo corregido"
              value={`${result.distribucion.brazoCorregido ?? "—"} cm`}
            />
            <Row
              label="Muslo corregido"
              value={`${result.distribucion.musloCorregido ?? "—"} cm`}
            />
            <Row
              label="Pierna corregida"
              value={`${result.distribucion.piernaCorregida ?? "—"} cm`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Índice adiposo muscular</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-primary">
                {result.indiceAdiposoMuscular.valor ?? "—"}
              </span>
              <Badge variant="secondary">{result.indiceAdiposoMuscular.clasificacion}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {result.indiceAdiposoMuscular.interpretacion}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gasto energético */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Estimación de gasto energético</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Stat label="Metabolismo basal" value={`${result.gastoEnergetico.metabolismoBasal ?? "—"} kcal`} />
            <Stat
              label="Gasto energético total"
              value={`${result.gastoEnergetico.gastoTotal ?? "—"} kcal`}
            />
            <div>
              <p className="text-xs text-muted-foreground mb-1">Nivel de actividad</p>
              <p className="text-sm font-semibold">{result.gastoEnergetico.nivelActividad}</p>
              <p className="text-xs text-muted-foreground">{result.gastoEnergetico.metodo}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Índices de salud */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Índices de salud</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Indicador</th>
                  <th className="py-2 pr-4 font-medium">Valor</th>
                  <th className="py-2 pr-4 font-medium">Rango saludable</th>
                  <th className="py-2 font-medium">Interpretación</th>
                </tr>
              </thead>
              <tbody>
                {result.salud.map((s) => (
                  <tr key={s.nombre} className="border-b border-border/60 last:border-0">
                    <td className="py-2 pr-4 font-medium">{s.nombre}</td>
                    <td className="py-2 pr-4">
                      {s.valor} {s.unidad}
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">{s.rangoSaludable}</td>
                    <td className="py-2">{s.interpretacion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Índices de rendimiento */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Índices de rendimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <Row
            label="Diferencia brazo contraído - relajado"
            value={`${result.rendimiento.diferenciaBrazo ?? "—"} cm`}
          />
          <Row label="Área de superficie corporal" value={`${result.rendimiento.areaSuperficie ?? "—"} m²`} />
          <Row label="Índice de pérdida de calor (IPC)" value={String(result.rendimiento.indicePerdidaCalor ?? "—")} />
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}
