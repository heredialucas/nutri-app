import { getNutritionPlanById } from "@/app/actions/nutrition-plans";
import { PlanPreview } from "@/components/nutrition-plans/plan-preview";
import { PlanActions } from "@/components/nutrition-plans/plan-actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { getCurrentUser, isPatientUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
    const { id } = await params;
    const plan = await getNutritionPlanById(id).catch(() => null);
    return {
        title: plan?.title || "Plan alimentario",
        description: `Plan de alimentación para ${plan?.patient.firstName} ${plan?.patient.lastName}`,
    };
}

export default async function PlanDetailPage({ params }: Props) {
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard/planes">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{plan.title}</h1>
                        <p className="text-muted-foreground text-sm">
                            {plan.patient.firstName} {plan.patient.lastName}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" asChild>
                        <Link href={`/dashboard/planes/${plan.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                        </Link>
                    </Button>
                    <PlanActions
                        planId={plan.id}
                        planStatus={plan.status}
                        patientId={plan.patientId}
                    />
                </div>
            </div>
            <PlanPreview plan={plan as any} />
        </div>
    );
}
