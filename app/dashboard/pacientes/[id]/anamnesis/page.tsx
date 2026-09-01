import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPatientById } from "@/app/actions/patients";
import { getPatientAnamnesis } from "@/app/actions/anamnesis";
import { AnamnesisForm } from "@/components/anamnesis/anamnesis-form";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Anamnesis nutricional" };

export default async function AnamnesisPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  const { id } = await params;
  let patient;
  try { patient = await getPatientById(id); } catch { notFound(); }
  const anamnesis = await getPatientAnamnesis(id);
  return <div className="space-y-6"><Link href={`/dashboard/pacientes/${id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Volver al paciente</Link><div><h1 className="text-2xl font-bold tracking-tight">Anamnesis nutricional</h1><p className="text-sm text-muted-foreground">{patient.firstName} {patient.lastName} · ficha completa para la consulta y los planes</p></div><AnamnesisForm patientId={id} initialData={anamnesis as any} /></div>;
}
