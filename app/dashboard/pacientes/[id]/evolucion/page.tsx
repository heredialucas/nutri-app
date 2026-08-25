import { notFound } from "next/navigation";
import { getPatientById } from "@/app/actions/patients";
import { getMeasurements, getEvolutionData, getLatestMeasurement } from "@/app/actions/measurements";
import { getProgressPhotos } from "@/app/actions/progress-photos";
import { MeasurementForm } from "@/components/progress/measurement-form";
import { MeasurementHistory } from "@/components/progress/measurement-history";
import { ProgressChart } from "@/components/progress/progress-chart";
import { ProgressPhotoGallery } from "@/components/progress/progress-photo-gallery";
import { ProgressPhotoUpload } from "@/components/progress/progress-photo-upload";
import { EvolutionSummary } from "@/components/progress/evolution-summary";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
    title: "Evolución",
};

export default async function EvolutionPage({
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

    const [measurements, evolutionData, latestMeasurement, photos] = await Promise.all([
        getMeasurements(id).catch(() => []),
        getEvolutionData(id).catch(() => []),
        getLatestMeasurement(id).catch(() => null),
        getProgressPhotos(id).catch(() => []),
    ]);

    const sorted = [...measurements].sort(
        (a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime()
    );
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
                    Evolución — {patient.firstName} {patient.lastName}
                </h1>
            </div>

            {latestMeasurement && (
                <EvolutionSummary latest={latestMeasurement as any} previous={previous as any} />
            )}

            <ProgressChart data={evolutionData} />

            <div className="grid gap-6 lg:grid-cols-2">
                <MeasurementForm patientId={id} />
                <ProgressPhotoUpload patientId={id} />
            </div>

            <MeasurementHistory measurements={measurements as any} />

            <ProgressPhotoGallery photos={photos as any} />
        </div>
    );
}
