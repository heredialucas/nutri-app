import { getPatients } from "@/app/actions/patients";
import { PlanForm } from "@/components/nutrition-plans/plan-form";
import { getCurrentUser, isPatientUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
    title: "Nuevo plan alimentario",
    description: "Crear un nuevo plan de alimentación",
};

export default async function NewPlanPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");
    if (isPatientUser(user)) redirect("/paciente/dashboard");

    const patients = await getPatients();

    return (
        <PlanForm
            patients={(patients as any[]).map((p) => ({
                id: p.id,
                firstName: p.firstName,
                lastName: p.lastName,
            }))}
        />
    );
}
