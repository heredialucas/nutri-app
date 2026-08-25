import { getNutritionPlans } from "@/app/actions/nutrition-plans";
import { PlanList } from "@/components/nutrition-plans/plan-list";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser, isPatientUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
    title: "Plantillas de planes",
    description: "Plantillas reutilizables de planes alimentarios",
};

export default async function TemplatesPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");
    if (isPatientUser(user)) redirect("/paciente/dashboard");

    const plans = await getNutritionPlans({ status: "ARCHIVED" });

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
                        <h1 className="text-2xl font-bold tracking-tight">Plantillas de planes</h1>
                        <p className="text-muted-foreground text-sm">
                            Planes archivados que podés duplicar como plantilla
                        </p>
                    </div>
                </div>
            </div>

            {plans.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">
                        No hay plantillas disponibles. Los planes archivados aparecerán aquí.
                    </p>
                </div>
            ) : (
                <PlanList initialPlans={plans as any} />
            )}
        </div>
    );
}
