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
import { publishIsakToPatient, revokeIsakFromPatient } from "@/app/actions/isak";
import { IsakVisuals } from "./isak-visuals";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Share2, EyeOff } from "lucide-react";
import type { IsakResult } from "@/lib/isak/calculations";

interface IsakReportProps {
  result: IsakResult;
  paciente: string;
  fecha?: string | null;
  evaluador: string;
  assessmentId?: string;
  publishedToPatientAt?: string | null;
  evolutionData?: { date: string; result: IsakResult }[];
}

function Row({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 py-1.5 last:border-0">
      <span className="text-sm text-muted-foreground min-w-0 break-words">{label}</span>
      <span className={`${strong ? "text-sm font-semibold" : "text-sm font-medium"} shrink-0 text-right`}>
        {value}
      </span>
    </div>
  );
}

export function IsakReport({ result, paciente, fecha, evaluador, assessmentId, publishedToPatientAt, evolutionData = [] }: IsakReportProps) {
  const fechaTexto = fecha ? format(new Date(fecha), "dd/MM/yyyy", { locale: es }) : "";
  const publish = async () => {
    if (!assessmentId) return;
    try { publishedToPatientAt ? await revokeIsakFromPatient(assessmentId) : await publishIsakToPatient(assessmentId); toast.success(publishedToPatientAt ? "Informe retirado del portal" : "Informe visible para el paciente"); } catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo actualizar la publicación"); }
  };

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
        <div className="flex flex-wrap gap-2">
          <IsakPdfButton result={result} paciente={paciente} fecha={fechaTexto} evaluador={evaluador} evolutionData={evolutionData} />
          {assessmentId && <Button onClick={publish} variant={publishedToPatientAt ? "outline" : "default"} size="sm"><span className="mr-2">{publishedToPatientAt ? <EyeOff className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}</span>{publishedToPatientAt ? "Retirar del portal" : "Mostrar al paciente"}</Button>}
        </div>
      </div>

      {publishedToPatientAt && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Este informe está visible en el portal del paciente.</div>}

      {evolutionData.length > 0 && <IsakVisuals data={evolutionData} />}

      <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white">
        <CardContent className="grid gap-4 p-5 sm:grid-cols-3">
          <div><p className="text-xs text-muted-foreground">Peso actual</p><p className="text-2xl font-semibold tracking-tight">{result.datos.peso} <span className="text-sm font-normal">kg</span></p><p className="text-xs text-muted-foreground">{result.datos.imcClasificacion}</p></div>
          <div><p className="text-xs text-muted-foreground">Masa adiposa estimada</p><p className="text-2xl font-semibold tracking-tight">{result.fraccionamiento.masaAdiposaPct ?? "—"} <span className="text-sm font-normal">%</span></p><p className="text-xs text-muted-foreground">{result.fraccionamiento.masaAdiposaKg ?? "—"} kg</p></div>
          <div><p className="text-xs text-muted-foreground">Masa muscular estimada</p><p className="text-2xl font-semibold tracking-tight">{result.fraccionamiento.masaMuscularPct ?? "—"} <span className="text-sm font-normal">%</span></p><p className="text-xs text-muted-foreground">{result.fraccionamiento.masaMuscularKg ?? "—"} kg</p></div>
        </CardContent>
      </Card>

      {/* Medidas básicas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Medidas básicas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <Stat label="Masa corporal" value={`${result.datos.peso} kg`} />
            <Stat label="Talla" value={`${result.datos.talla} cm`} />
            <Stat label="Edad" value={`${result.datos.edad} años`} />
            <Stat label="IMC" value={`${result.datos.imc} kg/m²`} />
            <Stat label="Clasificación" value={result.datos.imcClasificacion} className="col-span-2 sm:col-span-1" />
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

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Diámetros óseos</CardTitle><p className="text-xs text-muted-foreground">Medidas estructurales tomadas según el perfil registrado</p></CardHeader>
        <CardContent><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{[
          ["Húmero biepicondilar", result.diametros.humerusBreadth], ["Fémur biepicondilar", result.diametros.femurBreadth], ["Muñeca biestiloidea", result.diametros.biStyloidWrist], ["Tobillo bimaleolar", result.diametros.biMalleolarAnkle], ["Biacromial", result.diametros.biacromial], ["Biiliocrestal", result.diametros.biiliocristal], ["Tórax transversal", result.diametros.transverseChest], ["Tórax AP", result.diametros.apChestDepth], ["Abdomen AP", result.diametros.apAbdominalDepth]
        ].map(([label, value]) => <Stat key={String(label)} label={String(label)} value={value == null ? "—" : `${value} mm`} />)}</div></CardContent>
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

      {/* Lectura sencilla de salud */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Lectura de salud</CardTitle>
          <p className="text-xs text-muted-foreground">Indicadores orientativos para acompañar la evolución, no diagnósticos aislados.</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {result.salud.map((s) => {
              const positive = /bajo|óptimo|normopeso|saludable/i.test(s.interpretacion);
              return <div key={s.nombre} className="rounded-xl border bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-2"><p className="text-sm font-semibold">{friendlyHealthName(s.nombre)}</p><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${positive ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{positive ? "En seguimiento" : "Para observar"}</span></div>
                <p className="mt-3 text-2xl font-semibold">{s.valor} <span className="text-xs font-normal text-muted-foreground">{s.unidad}</span></p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{friendlyHealthText(s)}</p>
              </div>;
            })}
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

function Stat({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border bg-muted/30 p-3 ${className ?? ""}`}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-semibold break-words">{value}</p>
    </div>
  );
}

function friendlyHealthName(name: string) {
  const names: Record<string, string> = { "Perímetro cintura": "Cintura", "Índice cintura cadera": "Distribución cintura-cadera", "Índice de conicidad": "Distribución abdominal", "Pliegue abdominal": "Grasa abdominal estimada", "Pliegue tríceps": "Grasa subcutánea del brazo", IMC: "Relación peso-altura" };
  return names[name] ?? name;
}

function friendlyHealthText(item: { nombre: string; interpretacion: string; rangoSaludable: string }) {
  const texts: Record<string, string> = {
    "Perímetro cintura": "Ayuda a observar cambios en la zona abdominal y su relación con la salud metabólica.",
    "Índice cintura cadera": "Muestra cómo se distribuyen las medidas entre cintura y cadera.",
    "Índice de conicidad": "Describe de forma orientativa la distribución de volumen en el tronco.",
    "Pliegue abdominal": "Permite seguir cambios en el tejido adiposo bajo la piel del abdomen.",
    "Pliegue tríceps": "Permite seguir cambios en el tejido adiposo bajo la piel del brazo.",
    IMC: "Relaciona el peso con la altura. Se interpreta junto con cintura, músculo y contexto personal.",
  };
  return `${texts[item.nombre] ?? item.interpretacion} (${item.interpretacion}).`;
}
