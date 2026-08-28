"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Ruler,
  Users,
  ClipboardList,
  BookOpen,
  Activity,
  ArrowRight,
  CheckCircle2,
  User,
  Scale,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface EvalSummary {
  id: string;
  patientId?: string;
  patientName?: string;
  measuredAt: string;
  fecha: string;
  weight: number | null;
  height: number | null;
  age: number | null;
  imc: number | null;
  imcClasificacion: string;
  masaAdiposaPct: number | null;
  masaMuscularPct: number | null;
  iam: number | null;
  iamClasificacion: string;
  evaluador: string;
}

export interface PatientSummary {
  id: string;
  firstName: string;
  lastName: string;
  gender: string | null;
  age: number | null;
  count: number;
  latest: EvalSummary | null;
}

interface ModuleProps {
  userName: string;
  evaluations: EvalSummary[];
  patients: PatientSummary[];
}

const PROTOCOLO_PLIEGUES = [
  {
    nombre: "Tríceps",
    punto: "Punto posterior del brazo, a la altura del punto mesobraquial (punto medio entre el acromion y el olécranon).",
    tecnica: "Pliegue vertical en la cara posterior del brazo, con el brazo relajado y colgando.",
  },
  {
    nombre: "Subescapular",
    punto: "Por debajo del ángulo inferior de la escápula.",
    tecnica: "Pliegue diagonal (oblícuo), con el brazo relajado a lo largo del cuerpo.",
  },
  {
    nombre: "Supraespinal",
    punto: "Por encima de la cresta ilíaca, sobre la línea axilar media.",
    tecnica: "Pliegue diagonal hacia abajo y hacia adentro.",
  },
  {
    nombre: "Abdominal",
    punto: "A 2 cm lateral del ombligo, del lado derecho.",
    tecnica: "Pliegue vertical.",
  },
  {
    nombre: "Muslo (frontal)",
    punto: "Punto medio del muslo, entre el pliegue inguinal y el borde superior de la rótula.",
    tecnica: "Pliegue vertical en la cara anterior del muslo, con la rodilla flexionada.",
  },
  {
    nombre: "Pierna (gemelo medial)",
    punto: "Punto medio de la pierna, en la cara medial del gemelo, en el punto de mayor perímetro.",
    tecnica: "Pliegue vertical, con el pie apoyado y la pierna relajada.",
  },
];

export function IsakModule({ userName, evaluations, patients }: ModuleProps) {
  const [tab, setTab] = useState<"pacientes" | "evaluaciones" | "protocolo">(
    "pacientes"
  );

  const conData = patients.filter((p) => p.count > 0);
  const total = evaluations.length;
  const ultima = evaluations[0] ?? null;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Ruler className="h-6 w-6 text-emerald-500" />
            Antropometría
          </h1>
          <p className="text-sm text-muted-foreground">
            Composición corporal, fraccionamiento tisular, índices y evaluación ISAK.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          Evaluador: <span className="font-medium text-foreground">{userName}</span>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <Stat label="Pacientes evaluados" value={String(conData.length)} color="text-emerald-600" />
        <Stat label="Evaluaciones totales" value={String(total)} color="text-blue-600" />
        <Stat label="Pacientes sin evaluar" value={String(patients.filter((p) => p.count === 0).length)} color="text-amber-600" />
        <Stat
          label={ultima ? "Última evaluación" : "Sin evaluaciones"}
          value={ultima ? ultima.fecha : "—"}
          color="text-purple-600"
        />
      </div>

      {/* Contenido */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap gap-2">
            <TabButton active={tab === "pacientes"} onClick={() => setTab("pacientes")} icon={<Users className="h-4 w-4" />} label="Pacientes" />
            <TabButton active={tab === "evaluaciones"} onClick={() => setTab("evaluaciones")} icon={<ClipboardList className="h-4 w-4" />} label="Evaluaciones" />
            <TabButton active={tab === "protocolo"} onClick={() => setTab("protocolo")} icon={<BookOpen className="h-4 w-4" />} label="Protocolo ISAK" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {tab === "pacientes" && <PacientesView patients={patients} />}
          {tab === "evaluaciones" && <EvaluacionesView evaluations={evaluations} />}
          {tab === "protocolo" && <ProtocoloView />}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Card className="py-0">
      <CardContent className="p-3 flex items-center gap-2.5">
        <div>
          <p className="text-lg font-bold leading-none">{value}</p>
          <p className="text-[10px] text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Button
      variant={active ? "default" : "outline"}
      size="sm"
      className={cn(active && "bg-emerald-600 text-white")}
      onClick={onClick}
    >
      {icon}
      <span className="ml-1.5">{label}</span>
    </Button>
  );
}

function genderLabel(g: string | null) {
  if (g === "MALE") return "Masculino";
  if (g === "FEMALE") return "Femenino";
  return "Sin especificar";
}

function PacientesView({ patients }: { patients: PatientSummary[] }) {
  if (patients.length === 0) return <EmptyState />;
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {patients.map((p) => (
        <Card key={p.id} className="py-0">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {p.firstName} {p.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {genderLabel(p.gender)}
                    {p.age !== null && ` · ${p.age} años`}
                  </p>
                </div>
              </div>
              {p.count > 0 ? (
                <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-600/30">
                  {p.count} {p.count === 1 ? "eval." : "evals."}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  Sin datos
                </Badge>
              )}
            </div>

            {p.latest ? (
              <div className="space-y-1.5 text-xs bg-muted/30 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Última</span>
                  <span className="font-medium">{p.latest.fecha}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Peso</span>
                  <span className="font-medium">{p.latest.weight ?? "—"} kg</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">IMC</span>
                  <span className="font-medium">{p.latest.imc ?? "—"} ({p.latest.imcClasificacion})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Grasa / Músculo</span>
                  <span className="font-medium">{p.latest.masaAdiposaPct ?? "—"}% / {p.latest.masaMuscularPct ?? "—"}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">IAM</span>
                  <span className="font-medium">{p.latest.iam ?? "—"}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Completa una evaluación ISAK para generar el informe corporal.
              </p>
            )}

            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href={`/dashboard/pacientes/${p.id}/antropometria`}>
                <Activity className="h-4 w-4 mr-1.5" />
                {p.count > 0 ? "Ver informe" : "Registrar evaluación"}
                <ArrowRight className="h-3.5 w-3.5 ml-auto" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EvaluacionesView({ evaluations }: { evaluations: EvalSummary[] }) {
  if (evaluations.length === 0) return <EmptyState />;
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Paciente</TableHead>
            <TableHead>Edad</TableHead>
            <TableHead>Peso (kg)</TableHead>
            <TableHead>IMC</TableHead>
            <TableHead>Grasa %</TableHead>
            <TableHead>Músculo %</TableHead>
            <TableHead>IAM</TableHead>
            <TableHead className="text-right">Informe</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {evaluations.map((e) => (
            <TableRow key={e.id}>
              <TableCell className="whitespace-nowrap">{e.fecha}</TableCell>
              <TableCell className="font-medium whitespace-nowrap">{e.patientName ?? "—"}</TableCell>
              <TableCell>{e.age ?? "—"}</TableCell>
              <TableCell>{e.weight ?? "—"}</TableCell>
              <TableCell>{e.imc ?? "—"}</TableCell>
              <TableCell>{e.masaAdiposaPct ?? "—"}</TableCell>
              <TableCell>{e.masaMuscularPct ?? "—"}</TableCell>
              <TableCell>
                {e.iam ?? "—"}
                {e.iamClasificacion && e.iamClasificacion !== "-" && (
                  <span className="ml-1 text-[10px] text-muted-foreground">
                    ({e.iamClasificacion})
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right">
                {e.patientId ? (
                  <Button asChild variant="ghost" size="sm" className="text-emerald-600">
                    <Link href={`/dashboard/pacientes/${e.patientId}/antropometria`}>
                      Ver
                    </Link>
                  </Button>
                ) : (
                  "—"
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ProtocoloView() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Scale className="h-4 w-4 text-emerald-500" />
          <h3 className="font-semibold text-sm">Puntos anatómicos y técnica de pliegues</h3>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PROTOCOLO_PLIEGUES.map((p) => (
            <Card key={p.nombre} className="py-0">
              <CardContent className="p-4 space-y-2">
                <p className="font-semibold text-sm text-emerald-700">{p.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Punto: </span>
                  {p.punto}
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Técnica: </span>
                  {p.tecnica}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <h3 className="font-semibold text-sm">Recomendaciones de medición</h3>
        </div>
        <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
          <li>Realizar las mediciones en el lado derecho del cuerpo, salvo indicación contraria.</li>
          <li>Medir cada pliegue dos veces y registrar la media (o tres si difieren más de 0,2 mm).</li>
          <li>El paciente debe permanecer de pie, relajado y con el mismo estado de hidratación.</li>
          <li>Tomar los pliegues con el calibre de forma perpendicular a la pinza, sosteniéndolo 2 segundos.</li>
          <li>Registrar los datos en la misma franja horaria para comparar correctamente la evolución.</li>
          <li>Los perímetros se miden con cinta métrica inextensible, ajustada sin comprimir.</li>
        </ul>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-12 text-center">
      <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
        <Ruler className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="font-medium">Aún no hay datos antropométricos</p>
      <p className="text-sm text-muted-foreground mt-1">
        Registrá la primera evaluación desde el perfil de un paciente.
      </p>
    </div>
  );
}
