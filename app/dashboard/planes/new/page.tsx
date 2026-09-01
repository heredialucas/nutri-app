import { getPatients } from "@/app/actions/patients";
import { NewPlanClient } from "@/components/nutrition-plans/new-plan-client";
import { getCurrentUser, isPatientUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
    title: "Nuevo plan alimentario",
    description: "Crear un nuevo plan de alimentación",
};

export default async function NewPlanPage({
    searchParams,
}: {
    searchParams: Promise<{ patientId?: string }>;
}) {
    const { patientId } = await searchParams;
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");
    if (isPatientUser(user)) redirect("/paciente/dashboard");

    const patients = await getPatients();

    return (
        <NewPlanClient
            initialPatientIds={patientId ? [patientId] : undefined}
            patients={(patients as any[]).map((p) => ({
                 id: p.id,
                 firstName: p.firstName,
                 lastName: p.lastName,
                 email: p.email,
                 documentNumber: p.documentNumber,
            }))}
        />
    );
}
