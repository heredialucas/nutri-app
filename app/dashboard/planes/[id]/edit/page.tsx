import { getNutritionPlanById } from "@/app/actions/nutrition-plans";
import { getPatients } from "@/app/actions/patients";
import { PlanForm } from "@/components/nutrition-plans/plan-form";
import { getCurrentUser, isPatientUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
    const { id } = await params;
    const plan = await getNutritionPlanById(id).catch(() => null);
    return {
        title: plan ? `Editar: ${plan.title}` : "Editar plan",
        description: "Editar plan alimentario",
    };
}

export default async function EditPlanPage({ params }: Props) {
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");
    if (isPatientUser(user)) redirect("/paciente/dashboard");

    const { id } = await params;
    let plan;
    try {
        plan = await getNutritionPlanById(id);
    } catch {
        notFound();
    }

    if (!plan) notFound();

    const patients = await getPatients();

    return (
        <PlanForm
            patients={(patients as any[]).map((p) => ({
                id: p.id,
                firstName: p.firstName,
                lastName: p.lastName,
            }))}
            initialPlan={{
                ...(plan as any),
                patientIds: (plan as any)?.patients?.map((p: any) => p.patientId) ?? [],
            }}
        />
    );
}
