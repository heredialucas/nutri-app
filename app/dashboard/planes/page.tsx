import { getNutritionPlans } from "@/app/actions/nutrition-plans";
import { PlanList } from "@/components/nutrition-plans/plan-list";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText } from "lucide-react";
import { getCurrentUser, isPatientUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
    title: "Planes alimentarios",
    description: "Gestión de planes de alimentación para pacientes",
};

export default async function PlansPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");
    if (isPatientUser(user)) redirect("/paciente/dashboard");

    const plans = await getNutritionPlans();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Planes alimentarios</h1>
                    <p className="text-muted-foreground text-sm">
                        {plans.length} plan{plans.length !== 1 ? "es" : ""} registrado{plans.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/dashboard/planes/templates">Plantillas</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/dashboard/planes/new">
                            <FileText className="mr-2 h-4 w-4" />
                            Nuevo plan
                        </Link>
                    </Button>
                </div>
            </div>
            <PlanList initialPlans={plans as any} />
        </div>
    );
}
