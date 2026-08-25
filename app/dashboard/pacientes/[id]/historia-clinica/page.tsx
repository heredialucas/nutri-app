import { notFound } from "next/navigation";
import { getPatientById } from "@/app/actions/patients";
import { getMedicalHistory, getAllergies, getMedications, getGoals } from "@/app/actions/medical-history";
import { MedicalHistoryForm } from "@/components/medical-history/medical-history-form";
import { AllergyList } from "@/components/medical-history/allergy-list";
import { MedicationList } from "@/components/medical-history/medication-list";
import { GoalList } from "@/components/medical-history/goal-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
    title: "Historia clínica",
};

export default async function MedicalHistoryPage({
    params,
}: {
    params: Promise<{ id: string }>;
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

    const [history, allergies, medications, goals] = await Promise.all([
        getMedicalHistory(id).catch(() => null),
        getAllergies(id).catch(() => []),
        getMedications(id).catch(() => []),
        getGoals(id).catch(() => []),
    ]);

    return (
        <div className="space-y-6">
            <div>
                <Link
                    href={`/dashboard/pacientes/${id}`}
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver al paciente
                </Link>
                <h1 className="text-2xl font-bold tracking-tight">
                    Historia clínica — {patient.firstName} {patient.lastName}
                </h1>
            </div>

            <MedicalHistoryForm patientId={id} initialData={history ?? undefined} />

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Alergias</CardTitle>
                </CardHeader>
                <CardContent>
                    <AllergyList patientId={id} allergies={allergies as any} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Medicación</CardTitle>
                </CardHeader>
                <CardContent>
                    <MedicationList patientId={id} medications={medications as any} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Objetivos</CardTitle>
                </CardHeader>
                <CardContent>
                    <GoalList patientId={id} goals={goals as any} />
                </CardContent>
            </Card>
        </div>
    );
}
