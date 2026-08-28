import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getAllIsakAssessments, getPatientsWithIsak } from "@/app/actions/isak";
import { IsakModule } from "@/components/isak/isak-module";
import {
  computeIsak,
  inputsFromMeasurement,
  calcularEdad,
} from "@/lib/isak/calculations";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const metadata = {
  title: "Antropometría — Gestión nutricional",
};

function formatDate(d: string | null) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return format(date, "dd/MM/yyyy", { locale: es });
}

function summarize(a: any, patient: any) {
  const age = calcularEdad(patient?.birthDate);
  const inputs = inputsFromMeasurement({
    ...a,
    age: age ?? 0,
    gender: patient?.gender,
  });
  const r = computeIsak(inputs);
  return {
    id: a.id,
    patientId: patient?.id,
    patientName: patient ? `${patient.firstName} ${patient.lastName}` : "—",
    measuredAt: a.measuredAt,
    fecha: formatDate(a.measuredAt),
    weight: r.datos.peso,
    height: r.datos.talla,
    age: r.datos.edad,
    imc: r.datos.imc,
    imcClasificacion: r.datos.imcClasificacion,
    masaAdiposaPct: r.fraccionamiento.masaAdiposaPct,
    masaMuscularPct: r.fraccionamiento.masaMuscularPct,
    iam: r.indiceAdiposoMuscular.valor,
    iamClasificacion: r.indiceAdiposoMuscular.clasificacion,
    evaluador: a.measuredBy?.fullName || "—",
  };
}

export default async function AntropometriaModulePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const [assessments, patients] = await Promise.all([
    getAllIsakAssessments().catch(() => []),
    getPatientsWithIsak().catch(() => []),
  ]);

  const evaluations = (assessments as any[]).map((a) =>
    summarize(a, (a as any).patient)
  );

  const patientsData = (patients as any[]).map((p) => {
    const latest = p.isakAssessments?.[0];
    const age = calcularEdad(p.birthDate);
    let latestSummary = null;
    if (latest) {
      latestSummary = summarize(latest, p);
    }
    return {
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      gender: p.gender,
      age: age ?? null,
      count: p._count?.isakAssessments ?? 0,
      latest: latestSummary,
    };
  });

  return (
    <IsakModule
      userName={user.fullName || user.email}
      evaluations={evaluations}
      patients={patientsData}
    />
  );
}
