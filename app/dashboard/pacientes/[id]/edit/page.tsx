import { notFound } from "next/navigation";
import { getPatientById } from "@/app/actions/patients";
import { PatientForm } from "@/components/patients/patient-form";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
    title: "Editar paciente",
};

export default async function EditPatientPage({
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

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">
                    Editar {patient.firstName} {patient.lastName}
                </h1>
                <p className="text-muted-foreground text-sm">
                    Actualizá los datos del paciente
                </p>
            </div>
            <PatientForm mode="edit" initialData={patient} />
        </div>
    );
}
