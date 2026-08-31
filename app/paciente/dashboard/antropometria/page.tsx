import { redirect } from "next/navigation";
import { getCurrentUser, isPatientUser } from "@/lib/auth";
import { patientService } from "@/services/patient-service";
import { getMyIsakAssessments } from "@/app/actions/patient-portal";
import { calcularEdad, computeIsak, inputsFromMeasurement, type IsakResult } from "@/lib/isak/calculations";
import { IsakVisuals } from "@/components/progress/isak-visuals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, ArrowDown, ArrowUp, Minus } from "lucide-react";

function Delta({ current, previous, unit }: { current: number | null; previous: number | null; unit: string }) {
  if (current == null || previous == null) return <span className="text-xs text-[#999]">Sin comparación</span>;
  const delta = Math.round((current - previous) * 10) / 10;
  if (delta === 0) return <span className="inline-flex items-center gap-1 text-xs text-[#666]"><Minus size={12} /> Sin cambios</span>;
  const positive = delta > 0;
  return <span className={`inline-flex items-center gap-1 text-xs ${positive ? "text-amber-700" : "text-emerald-700"}`}>{positive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}{Math.abs(delta)} {unit} desde la evaluación anterior</span>;
}

function resultFor(item: any, patient: any): IsakResult {
  const age = calcularEdad(patient.birthDate, new Date(item.measuredAt));
  return computeIsak(inputsFromMeasurement({ ...item, age: age ?? 0, gender: patient.gender }));
}

export default async function PatientAnthropometryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (!isPatientUser(user)) redirect("/dashboard");
  const patient = await patientService.getByUserId(user.id);
  if (!patient) redirect("/auth/login");
  const assessments = (await getMyIsakAssessments()) as any[];

  if (!assessments.length) return <div className="py-10 text-center"><Activity size={36} strokeWidth={1.2} className="mx-auto mb-3 text-[#bbb]" /><h1 className="text-xl font-semibold text-[#1a1a1a]">Mi evolución corporal</h1><p className="mt-2 text-sm text-[#666]">Todavía no hay un informe compartido por Mauro Acosta.</p></div>;

  const current = resultFor(assessments[0], patient);
  const previous = assessments[1] ? resultFor(assessments[1], patient) : null;
  const evolutionData = assessments.map((item) => ({ date: item.measuredAt, result: resultFor(item, patient) }));
  const date = new Date(assessments[0].measuredAt).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });

  return <div className="space-y-7">
    <header><p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Mi evolución</p><h1 className="text-2xl font-semibold tracking-tight text-[#1a1a1a]">Así está cambiando tu cuerpo</h1><p className="mt-1 text-sm text-[#666]">Última evaluación: {date}</p></header>
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Resumen de la evaluación">
      <Card><CardContent className="p-5"><p className="text-xs text-[#777]">Peso actual</p><p className="mt-1 text-3xl font-semibold text-[#1a1a1a]">{current.datos.peso} <span className="text-sm font-normal">kg</span></p><Delta current={current.datos.peso} previous={previous?.datos.peso ?? null} unit="kg" /></CardContent></Card>
      <Card><CardContent className="p-5"><p className="text-xs text-[#777]">Masa adiposa estimada</p><p className="mt-1 text-3xl font-semibold text-[#1a1a1a]">{current.fraccionamiento.masaAdiposaPct ?? "—"} <span className="text-sm font-normal">%</span></p><Delta current={current.fraccionamiento.masaAdiposaPct} previous={previous?.fraccionamiento.masaAdiposaPct ?? null} unit="puntos" /></CardContent></Card>
      <Card><CardContent className="p-5"><p className="text-xs text-[#777]">Masa muscular estimada</p><p className="mt-1 text-3xl font-semibold text-[#1a1a1a]">{current.fraccionamiento.masaMuscularPct ?? "—"} <span className="text-sm font-normal">%</span></p><Delta current={current.fraccionamiento.masaMuscularPct} previous={previous?.fraccionamiento.masaMuscularPct ?? null} unit="puntos" /></CardContent></Card>
    </section>
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 text-sm leading-relaxed text-emerald-950"><strong>¿Cómo leerlo?</strong> Mirá principalmente la tendencia entre evaluaciones. Estos valores son estimaciones realizadas con mediciones corporales y siempre se interpretan junto con tus objetivos y tu historia clínica.</div>
    <IsakVisuals data={evolutionData} />
    <Card><CardHeader><CardTitle className="text-base">Última evaluación</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-[#f7f7f5] p-4"><p className="text-xs text-[#777]">IMC</p><p className="mt-1 text-xl font-semibold">{current.datos.imc} <span className="text-sm font-normal">kg/m²</span></p><p className="text-xs text-[#666]">{current.datos.imcClasificacion}</p></div><div className="rounded-xl bg-[#f7f7f5] p-4"><p className="text-xs text-[#777]">Cintura</p><p className="mt-1 text-xl font-semibold">{current.salud.find((item) => item.nombre === "Perímetro cintura")?.valor ?? "—"} <span className="text-sm font-normal">cm</span></p><p className="text-xs text-[#666]">Ayuda a observar cambios en la zona abdominal</p></div></CardContent></Card>
    <p className="text-center text-xs text-[#999]">Informe compartido por Mauro Acosta. Los resultados no reemplazan una consulta profesional.</p>
  </div>;
}
