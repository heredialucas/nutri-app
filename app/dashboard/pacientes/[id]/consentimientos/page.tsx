import { notFound } from "next/navigation";
import { getPatientById } from "@/app/actions/patients";
import { getConsents } from "@/app/actions/consents";
import { ConsentForm } from "@/components/consents/consent-form";
import { ConsentHistory } from "@/components/consents/consent-history";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ArrowLeft, ClipboardCheck } from "lucide-react";
import Link from "next/link";

export const metadata = {
    title: "Consentimientos",
};

export default async function PatientConsentsPage({
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

    const consents = await getConsents(id).catch(() => []);

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
                    Consentimientos — {patient.firstName} {patient.lastName}
                </h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Nuevo consentimiento</CardTitle>
                </CardHeader>
                <CardContent>
                    <ConsentForm patientId={id} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <ClipboardCheck className="h-4 w-4" />
                        Historial ({consents.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ConsentHistory consents={consents as any} />
                </CardContent>
            </Card>
        </div>
    );
}
