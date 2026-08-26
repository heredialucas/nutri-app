import { notFound } from "next/navigation";
import { getPatientById } from "@/app/actions/patients";
import { getFollowUps } from "@/app/actions/followups";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { FollowUpForm } from "@/components/followups/followup-form";
import { FollowUpList } from "@/components/followups/followup-list";
import { FollowUpSummary } from "@/components/followups/followup-summary";

export const metadata = {
    title: "Seguimiento",
};

export default async function PatientFollowUpPage({
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

    const followUps = await getFollowUps(id).catch(() => []);
    const sorted = [...followUps].sort(
        (a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()
    );
    const latest = sorted[0] || null;
    const previous = sorted[1] || null;

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
                    Seguimiento — {patient.firstName} {patient.lastName}
                </h1>
                <p className="text-sm text-muted-foreground">
                    Seguimiento semanal y evolución del paciente
                </p>
            </div>

            {latest && (
                <FollowUpSummary current={latest} previous={previous} />
            )}

            <div className="grid gap-6 lg:grid-cols-2">
                <FollowUpForm patientId={id} />
            </div>

            <FollowUpList followUps={followUps} patientId={id} />
        </div>
    );
}
