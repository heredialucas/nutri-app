import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Activity } from "lucide-react";
import { getPatientById } from "@/app/actions/patients";
import { getIsakAssessments } from "@/app/actions/isak";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { IsakReport } from "@/components/progress/isak-report";
import { IsakHistory } from "@/components/progress/isak-history";
import { IsakForm } from "@/components/progress/isak-form";
import { IsakEvolutionChart } from "@/components/progress/isak-evolution-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  computeIsak,
  inputsFromMeasurement,
  calcularEdad,
} from "@/lib/isak/calculations";

export const metadata = {
  title: "Informe corporal ISAK",
};

export default async function AntropometriaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ eval?: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  let patient: any;
  try {
    patient = await getPatientById(id);
  } catch {
    notFound();
  }

  const assessments = (await getIsakAssessments(id).catch(() => [])) as any[];

  if (assessments.length === 0) {
    return (
      <div className="space-y-6">
        <BackLink id={id} name={`${patient.firstName} ${patient.lastName}`} />
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-500" />
              Informe corporal ISAK
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Este paciente aún no tiene evaluaciones ISAK registradas. Completa el formulario para
              generar el informe de composición corporal.
            </p>
          </CardContent>
        </Card>
        <IsakForm patientId={id} />
      </div>
    );
  }

  const sp = await searchParams;
  const selectedId = sp.eval ?? assessments[0].id;
  const selected =
    assessments.find((a) => a.id === selectedId) ?? assessments[0];

  const age = calcularEdad(patient.birthDate);
  const buildResult = (a: any) =>
    computeIsak(inputsFromMeasurement({ ...a, age: age ?? 0, gender: patient.gender }));

  const inputs = inputsFromMeasurement({
    ...selected,
    age: age ?? 0,
    gender: patient.gender,
  });
  const result = computeIsak(inputs);

  const evolutionData = assessments.map((a: any) => ({
    date: a.measuredAt,
    result: buildResult(a),
  }));

  const evaluador = selected.measuredBy?.fullName || user.fullName || "Mauro Acosta";

  return (
    <div className="space-y-6">
      <BackLink id={id} name={`${patient.firstName} ${patient.lastName}`} />

      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Activity className="h-6 w-6 text-emerald-500" />
          Informe corporal ISAK
        </h1>
        <p className="text-sm text-muted-foreground">
          {patient.firstName} {patient.lastName}
        </p>
      </div>

      <IsakHistory
        assessments={assessments}
        patientId={id}
        currentId={selected.id}
      />

      <IsakEvolutionChart data={evolutionData} />

      <IsakReport
        result={result}
        paciente={`${patient.firstName} ${patient.lastName}`}
        fecha={selected.measuredAt}
        evaluador={evaluador}
      />

      <div>
        <h2 className="text-lg font-semibold mb-3">Nueva evaluación</h2>
        <IsakForm patientId={id} />
      </div>
    </div>
  );
}

function BackLink({ id, name }: { id: string; name: string }) {
  return (
    <Link
      href={`/dashboard/pacientes/${id}`}
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
    >
      <ArrowLeft className="h-4 w-4" />
      Volver al paciente
    </Link>
  );
}
